import type { PGlite } from "@electric-sql/pglite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readReceipt } from "@/server/receipts";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const holder = globalThis as unknown as { __eventsDb?: Promise<PGlite> };
const root = mkdtempSync(path.join(tmpdir(), "events-guest-actions-"));
const saved = process.env.EVENTS_DATA_DIR;
let n = 0;
let eventId: string;

const form = (fields: Record<string, string | Blob>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};
const csvFile = (text: string, name = "guests.csv", type = "text/csv") => new File([text], name, { type });
const redirectTarget = async (p: Promise<unknown>): Promise<URL> => {
  const e = await p.then(
    () => null,
    (err: Error) => err,
  );
  expect(e?.message).toMatch(/^NEXT_REDIRECT:/);
  return new URL(e!.message.replace("NEXT_REDIRECT:", ""), "http://127.0.0.1");
};

async function modules() {
  return { actions: await import("@/server/guest-actions"), repo: await import("@/server/guests-repository"), database: await import("@/server/database"), events: await import("@/server/events-repository") };
}

beforeEach(async () => {
  process.env.EVENTS_DATA_DIR = path.join(root, `db${n++}`, "pglite");
  holder.__eventsDb = undefined;
  const { database, events } = await modules();
  eventId = (await events.createEvent(await database.getDatabase(), database.DEMO_ACCOUNT_ID, { name: "Action event", date: "2027-06-18", location: "Hall", description: null })).id;
});
afterEach(async () => {
  if (holder.__eventsDb) await (await holder.__eventsDb).close().catch(() => undefined);
  holder.__eventsDb = undefined;
  if (saved === undefined) delete process.env.EVENTS_DATA_DIR;
  else process.env.EVENTS_DATA_DIR = saved;
  vi.restoreAllMocks();
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

const TEN = "name\r\n" + Array.from({ length: 10 }, (_, i) => `Guest ${String.fromCharCode(65 + i)} Example`).join("\r\n") + "\r\n";

describe("CSV import actions", () => {
  it("previews a valid file without saving anything, then imports only after confirmation", async () => {
    const { actions, repo, database } = await modules();
    const preview = await actions.previewImportAction({}, form({ eventId, file: csvFile(TEN) }));
    expect(preview.error).toBeUndefined();
    expect(preview.preview?.names.length).toBe(10);
    expect(await repo.listGuests(await database.getDatabase(), database.DEMO_ACCOUNT_ID, eventId)).toEqual([]); // nothing saved yet

    const p = preview.preview!;
    const target = await redirectTarget(actions.confirmImportAction({}, form({ eventId, submissionId: p.submissionId, names: JSON.stringify(p.names) })));
    expect(target.pathname).toBe(`/events/${eventId}/check-in`);
    expect([...target.searchParams.keys()]).toEqual(["r"]); // a receipt id only: no 'notice' text in the address
    expect(readReceipt(target.searchParams.get("r"), eventId)).toMatchObject({ notice: "imported", count: 10 });
    expect((await repo.listGuests(await database.getDatabase(), database.DEMO_ACCOUNT_ID, eventId)).length).toBe(10);
  });

  it("a repeated confirmation (double click) imports once and says so", async () => {
    const { actions, repo, database } = await modules();
    const p = (await actions.previewImportAction({}, form({ eventId, file: csvFile(TEN) }))).preview!;
    const fields = { eventId, submissionId: p.submissionId, names: JSON.stringify(p.names) };
    const t1 = await redirectTarget(actions.confirmImportAction({}, form(fields)));
    const t2 = await redirectTarget(actions.confirmImportAction({}, form(fields)));
    expect(readReceipt(t1.searchParams.get("r"), eventId)?.notice).toBe("imported");
    expect(readReceipt(t2.searchParams.get("r"), eventId)).toMatchObject({ notice: "import-repeated", count: 10 });
    expect((await repo.listGuests(await database.getDatabase(), database.DEMO_ACCOUNT_ID, eventId)).length).toBe(10);
  });

  it("refuses bad files at preview with plain messages that show no paths or database details", async () => {
    const { actions } = await modules();
    const cases: [string, File | undefined][] = [
      ["not a csv", csvFile(TEN, "guests.xlsx", "application/vnd.ms-excel")],
      ["wrong header", csvFile("full name\r\nA Example\r\n")],
      ["extra columns", csvFile("name,email\r\nA,a@example.invalid\r\n")],
      ["empty", csvFile("")],
      ["binary", new File([new Uint8Array([0x50, 0x4b, 0, 0])], "guests.csv", { type: "text/csv" })],
      ["all rows invalid", csvFile("name\r\n=1+1\r\n+2\r\n")],
      ["missing", undefined],
    ];
    for (const [label, file] of cases) {
      const r = await actions.previewImportAction({}, form(file ? { eventId, file } : { eventId }));
      expect(r.error, label).toBeTruthy();
      expect(r.preview, label).toBeUndefined();
      expect(r.error, label).not.toMatch(/[A-Z]:\\|node_modules|\/src\/|SQL|relation|postgres|stack/i);
    }
  });

  it("refuses an oversized file before reading it", async () => {
    const { actions } = await modules();
    const big = csvFile("name\r\n" + "A Example\r\n".repeat(30000));
    const r = await actions.previewImportAction({}, form({ eventId, file: big }));
    expect(r.error).toContain("larger than");
  });

  it("reports invalid rows with their row numbers and still previews the valid ones", async () => {
    const { actions } = await modules();
    const r = await actions.previewImportAction({}, form({ eventId, file: csvFile("name\r\nA Example\r\n=1+1\r\nB Example\r\n") }));
    expect(r.preview?.names).toEqual(["A Example", "B Example"]);
    expect(r.preview?.invalid).toEqual([{ row: 3, reason: expect.stringContaining("formula") }]);
  });

  it("flags duplicate names against the guests already on the event", async () => {
    const { actions, repo, database } = await modules();
    await repo.addGuest(await database.getDatabase(), database.DEMO_ACCOUNT_ID, eventId, "Guest A Example");
    const r = await actions.previewImportAction({}, form({ eventId, file: csvFile(TEN) }));
    expect(r.preview?.matchExisting).toBe(1);
    expect(r.preview?.names.length).toBe(10); // still all kept
  });

  it("refuses to preview or import into an unknown event or a malformed id", async () => {
    const { actions } = await modules();
    expect((await actions.previewImportAction({}, form({ eventId: "33333333-3333-4333-8333-333333333333", file: csvFile(TEN) }))).error).toContain("could not be found");
    expect((await actions.previewImportAction({}, form({ eventId: "nope", file: csvFile(TEN) }))).error).toContain("could not be found");
    const r = await actions.confirmImportAction({}, form({ eventId: "33333333-3333-4333-8333-333333333333", submissionId: "44444444-4444-4444-8444-444444444444", names: JSON.stringify(["A"]) }));
    expect(r.error).toContain("could not be found");
  });

  it("does not trust the confirmation form: tampered names, ids, counts and types are all refused and nothing is saved", async () => {
    const { actions, repo, database } = await modules();
    const sub = "44444444-4444-4444-8444-444444444444";
    const tampered: Record<string, string>[] = [
      { eventId, submissionId: sub, names: JSON.stringify(["=cmd|' /C calc'!A0"]) },
      { eventId, submissionId: sub, names: JSON.stringify(["jo@example.invalid"]) },
      { eventId, submissionId: sub, names: JSON.stringify(["x".repeat(121)]) },
      { eventId, submissionId: sub, names: JSON.stringify([]) },
      { eventId, submissionId: sub, names: JSON.stringify(Array.from({ length: 501 }, (_, i) => `Guest ${i}`)) },
      { eventId, submissionId: sub, names: JSON.stringify([5]) },
      { eventId, submissionId: sub, names: JSON.stringify("not a list") },
      { eventId, submissionId: sub, names: "{{{" },
      { eventId, submissionId: "not-a-uuid", names: JSON.stringify(["A Example"]) },
      { eventId: "nope", submissionId: sub, names: JSON.stringify(["A Example"]) },
    ];
    for (const fields of tampered) {
      const r = await actions.confirmImportAction({}, form(fields));
      expect(r.error, JSON.stringify(fields).slice(0, 60)).toBeTruthy();
    }
    expect(await repo.listGuests(await database.getDatabase(), database.DEMO_ACCOUNT_ID, eventId)).toEqual([]);
  });

  it("a failure part-way is reported plainly, leaks nothing, writes nothing, and a retry works", async () => {
    const { actions, repo, database } = await modules();
    const db = await database.getDatabase();
    const p = (await actions.previewImportAction({}, form({ eventId, file: csvFile(TEN) }))).preview!;
    await db.exec(`create function fail_audit() returns trigger language plpgsql as $$ begin raise exception 'secret internal detail'; end; $$;
      create trigger fail_audit before insert on audit_events for each row execute function fail_audit();`);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fields = { eventId, submissionId: p.submissionId, names: JSON.stringify(p.names) };
    const r = await actions.confirmImportAction({}, form(fields));
    expect(r.error).toBe("The import failed and nothing was imported. Please try again.");
    expect(JSON.stringify([r, log.mock.calls])).not.toMatch(/secret internal detail|Guest A Example/);
    expect(await repo.listGuests(db, database.DEMO_ACCOUNT_ID, eventId)).toEqual([]);
    await db.exec("drop trigger fail_audit on audit_events");
    const t = await redirectTarget(actions.confirmImportAction({}, form(fields)));
    expect(readReceipt(t.searchParams.get("r"), eventId)?.notice).toBe("imported");
  });
});

describe("check-in, undo and rename actions", () => {
  it("send the browser back with a receipt id (never message text), and the receipt reflects what really happened", async () => {
    const { actions, repo, database } = await modules();
    const db = await database.getDatabase();
    const g = (await repo.addGuest(db, database.DEMO_ACCOUNT_ID, eventId, "Alex Example"))!;
    const fields = { eventId, guestId: g.id, q: "alex" };
    const sequence: [typeof actions.checkInAction, string][] = [
      [actions.checkInAction, "checked-in"],
      [actions.checkInAction, "already"],
      [actions.undoCheckInAction, "undone"],
      [actions.undoCheckInAction, "not-checked-in"],
      [actions.checkInAction, "checked-in"],
    ];
    for (const [action, expected] of sequence) {
      const t = await redirectTarget(action(form(fields)));
      expect(t.hash).toBe(`#guest-${g.id}`);
      expect(t.searchParams.get("q")).toBe("alex");
      expect(t.searchParams.has("notice")).toBe(false);
      expect(t.searchParams.has("g")).toBe(false);
      expect(readReceipt(t.searchParams.get("r"), eventId)).toMatchObject({ notice: expected, guestId: g.id });
    }
  });

  it("report 'not found' for a guest of another event, and make no change", async () => {
    const { actions, repo, database, events } = await modules();
    const db = await database.getDatabase();
    const other = await events.createEvent(db, database.DEMO_ACCOUNT_ID, { name: "Other", date: "2027-07-01", location: "x", description: null });
    const g = (await repo.addGuest(db, database.DEMO_ACCOUNT_ID, eventId, "Alex Example"))!;
    for (const action of [actions.checkInAction, actions.undoCheckInAction]) {
      const t = await redirectTarget(action(form({ eventId: other.id, guestId: g.id })));
      expect(readReceipt(t.searchParams.get("r"), other.id)?.notice).toBe("not-found");
    }
    expect((await repo.getGuest(db, database.DEMO_ACCOUNT_ID, eventId, g.id))!.checkedInAt).toBeNull();
  });

  it("rename validates with the guest-name rules, keeps what was typed, and confirms through a receipt", async () => {
    const { actions, repo, database } = await modules();
    const db = await database.getDatabase();
    const g = (await repo.addGuest(db, database.DEMO_ACCOUNT_ID, eventId, "Alx Example"))!;
    for (const bad of ["", "   ", "x".repeat(121), "=1+1", "jo@example.invalid", "Bad\u0000"]) {
      const r = await actions.renameGuestAction({}, form({ eventId, guestId: g.id, name: bad }));
      expect(r.error, bad).toBeTruthy();
      expect(r.value).toBe(bad);
    }
    expect((await repo.getGuest(db, database.DEMO_ACCOUNT_ID, eventId, g.id))!.name).toBe("Alx Example");
    const t = await redirectTarget(actions.renameGuestAction({}, form({ eventId, guestId: g.id, name: "Alex Example" })));
    expect(readReceipt(t.searchParams.get("r"), eventId)).toMatchObject({ notice: "renamed", guestId: g.id });
    const same = await redirectTarget(actions.renameGuestAction({}, form({ eventId, guestId: g.id, name: "Alex Example" })));
    expect(readReceipt(same.searchParams.get("r"), eventId)?.notice).toBe("rename-unchanged");
    const missing = await actions.renameGuestAction({}, form({ eventId, guestId: "44444444-4444-4444-8444-444444444444", name: "Whoever" }));
    expect(missing.message).toContain("could not be found");
  });

  it("add-guest sends a receipt, not a message", async () => {
    const { actions } = await modules();
    const t = await redirectTarget(actions.addGuestAction({}, form({ eventId, name: "Bea Example" })));
    expect(t.searchParams.has("notice")).toBe(false);
    expect(readReceipt(t.searchParams.get("r"), eventId)?.notice).toBe("added");
  });

  it("do not log guest names when a save fails", async () => {
    const { actions, repo, database } = await modules();
    const db = await database.getDatabase();
    const g = (await repo.addGuest(db, database.DEMO_ACCOUNT_ID, eventId, "Private Person"))!;
    await db.close();
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const t = await redirectTarget(actions.checkInAction(form({ eventId, guestId: g.id })));
    expect(readReceipt(t.searchParams.get("r"), eventId)?.notice).toBe("error");
    const r = await actions.renameGuestAction({}, form({ eventId, guestId: g.id, name: "Another Private" }));
    expect(r.message).toContain("could not save");
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Private/);
  });
});

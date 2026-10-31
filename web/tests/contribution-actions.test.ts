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
const root = mkdtempSync(path.join(tmpdir(), "events-contribution-actions-"));
const saved = process.env.EVENTS_DATA_DIR;
let n = 0;
let eventId: string;

const SIG = JSON.stringify({ strokes: [[[10, 10], [50, 40], [120, 20], [200, 90]]] });
const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};
const target = async (p: Promise<unknown>): Promise<URL> => {
  const e = await p.then(
    () => null,
    (err: Error) => err,
  );
  expect(e?.message).toMatch(/^NEXT_REDIRECT:/);
  return new URL(e!.message.replace("NEXT_REDIRECT:", ""), "http://127.0.0.1");
};
async function mods() {
  return {
    sig: await import("@/server/contribution-actions"),
    modActions: await import("@/server/module-actions"),
    repo: await import("@/server/contributions-repository"),
    modules: await import("@/server/modules-repository"),
    guests: await import("@/server/guests-repository"),
    database: await import("@/server/database"),
    events: await import("@/server/events-repository"),
  };
}

beforeEach(async () => {
  process.env.EVENTS_DATA_DIR = path.join(root, `db${n++}`, "pglite");
  holder.__eventsDb = undefined;
  const m = await mods();
  eventId = (await m.events.createEvent(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, { name: "Action event", date: "2027-06-18", location: "Hall", description: null })).id;
});
afterEach(async () => {
  if (holder.__eventsDb) await (await holder.__eventsDb).close().catch(() => undefined);
  holder.__eventsDb = undefined;
  if (saved === undefined) delete process.env.EVENTS_DATA_DIR;
  else process.env.EVENTS_DATA_DIR = saved;
  vi.restoreAllMocks();
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("saving module settings", () => {
  it("the 'Signatures only' preset switches the guest list and attendance off and signatures on, then confirms by receipt", async () => {
    const m = await mods();
    const t = await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "signatures-only" })));
    expect(t.pathname).toBe(`/events/${eventId}/check-in/modules`);
    expect(readReceipt(t.searchParams.get("r"), eventId)?.notice).toBe("modules-saved");
    expect(await m.modules.getModuleSettings(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, eventId)).toMatchObject({ guest_registration: false, attendance: false, signature: true });
  });

  it("the other presets work and an unknown preset is refused", async () => {
    const m = await mods();
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "signatures-only" })));
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "guest-list" })));
    const db = await m.database.getDatabase();
    expect(await m.modules.getModuleSettings(db, m.database.DEMO_ACCOUNT_ID, eventId)).toMatchObject({ guest_registration: true, attendance: true, signature: false });
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "guest-list-and-signatures" })));
    expect(await m.modules.getModuleSettings(db, m.database.DEMO_ACCOUNT_ID, eventId)).toMatchObject({ guest_registration: true, attendance: true, signature: true });
    expect((await m.modActions.saveModulesAction({}, form({ eventId, preset: "everything" }))).error).toContain("does not exist");
  });

  it("tick boxes: ticked means on, unticked means off, for every built input", async () => {
    const m = await mods();
    await target(m.modActions.saveModulesAction({}, form({ eventId, module_guest_registration: "on", module_signature: "on" })));
    expect(await m.modules.getModuleSettings(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, eventId)).toMatchObject({ guest_registration: true, attendance: false, signature: true });
  });

  it("refuses an invalid combination with a clear message and changes nothing", async () => {
    const m = await mods();
    const r = await m.modActions.saveModulesAction({}, form({ eventId, module_attendance: "on" })); // attendance without a guest list
    expect(r.error).toContain("needs");
    expect(await m.modules.getModuleSettings(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, eventId)).toMatchObject({ guest_registration: true, attendance: true, signature: false });
  });

  it("refuses to switch on a planned input even when the form is tampered with", async () => {
    const m = await mods();
    for (const field of ["module_photograph", "module_video", "module_drawing", "module_text_message", "module_consent", "module_nonsense"]) {
      const r = await m.modActions.saveModulesAction({}, form({ eventId, module_guest_registration: "on", module_attendance: "on", [field]: "on" }));
      expect(r.error, field).toBeTruthy();
    }
    expect(await m.modules.getModuleSettings(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, eventId)).toMatchObject({ photograph: false, video: false, drawing: false, text_message: false, consent: false });
  });

  it("refuses an unknown or malformed event", async () => {
    const m = await mods();
    expect((await m.modActions.saveModulesAction({}, form({ eventId: "33333333-3333-4333-8333-333333333333", preset: "signatures-only" }))).error).toContain("could not be found");
    expect((await m.modActions.saveModulesAction({}, form({ eventId: "nope", preset: "signatures-only" }))).error).toContain("could not be found");
  });
});

describe("the signature action", () => {
  async function signaturesOnly() {
    const m = await mods();
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "signatures-only" })));
    return m;
  }

  it("saves an anonymous signature with an explicit yes and sends the browser back to a fresh collection screen", async () => {
    const m = await signaturesOnly();
    const t = await target(m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted" })));
    expect(t.pathname).toBe(`/events/${eventId}/check-in/collect`);
    expect([...t.searchParams.keys()]).toEqual(["r"]);
    expect(readReceipt(t.searchParams.get("r"), eventId)?.notice).toBe("contribution-saved");
    const db = await m.database.getDatabase();
    const list = await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId);
    expect(list.length).toBe(1);
    expect(list[0]).toMatchObject({ linkedToGuest: false, status: "granted" });
  });

  it("saves a 'no' too, and another signature can follow straight away with no guest involved", async () => {
    const m = await signaturesOnly();
    await target(m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "denied" })));
    await target(m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted" })));
    const db = await m.database.getDatabase();
    expect((await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId)).map((c) => c.status).sort()).toEqual(["denied", "granted"]);
    expect(await m.guests.listGuests(db, m.database.DEMO_ACCOUNT_ID, eventId)).toEqual([]);
  });

  it("does not require or accept a name, email or phone number: they are ignored if sent", async () => {
    const m = await signaturesOnly();
    await target(m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted", name: "Alex Example", email: "alex@example.invalid", phone: "07700 900123" })));
    const db = await m.database.getDatabase();
    expect(JSON.stringify((await db.query("select * from contributions")).rows)).not.toMatch(/Alex|alex@|07700/);
    expect((await db.query("select count(*)::int as c from guests")).rows[0]).toEqual({ c: 0 });
  });

  it("refuses a missing or invalid permission choice: there is no default", async () => {
    const m = await signaturesOnly();
    for (const choice of [undefined, "", "yes", "true", "on", "revoked", "GRANTED"]) {
      const fields: Record<string, string> = { eventId, payload: SIG };
      if (choice !== undefined) fields.permission = choice;
      const r = await m.sig.submitSignatureAction({}, form(fields));
      expect(r.field, String(choice)).toBe("permission");
      expect(r.error).toContain("no default");
    }
    expect(await m.repo.listContributions(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, eventId)).toEqual([]);
  });

  it("refuses empty, malformed, hostile and oversized signatures, saving nothing and never echoing the input", async () => {
    const m = await signaturesOnly();
    const cases: Record<string, string>[] = [
      { payload: "" },
      { payload: JSON.stringify({ strokes: [] }) },
      { payload: "not json" },
      { payload: JSON.stringify({ strokes: [[[1, 1]]] }) },
      { payload: JSON.stringify({ strokes: [[[10, 10], [50, 40], [120, 20]]], svg: "<svg onload=alert(1)>" }) },
      { payload: JSON.stringify({ strokes: [[["<script>alert(1)</script>", 1], [50, 40], [120, 20]]] }) },
      { payload: "x".repeat(130_000) },
    ];
    for (const c of cases) {
      const r = await m.sig.submitSignatureAction({}, form({ eventId, permission: "granted", ...c }));
      expect(r.field, c.payload.slice(0, 30)).toBe("payload");
      expect(r.error).not.toMatch(/script|svg|onload/i);
    }
    const missing = await m.sig.submitSignatureAction({}, form({ eventId, permission: "granted" }));
    expect(missing.field).toBe("payload");
    expect(await m.repo.listContributions(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, eventId)).toEqual([]);
  });

  it("refuses when the signature input is switched off, in the server and not only on the page", async () => {
    const m = await mods(); // default configuration: signature is off
    const r = await m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted" }));
    expect(r.error).toContain("switched off");
    expect(await m.repo.listContributions(await m.database.getDatabase(), m.database.DEMO_ACCOUNT_ID, eventId)).toEqual([]);
  });

  it("refuses a guest from another event or one that does not exist, and a guest link when the guest list is off", async () => {
    const m = await mods();
    const db = await m.database.getDatabase();
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "guest-list-and-signatures" })));
    const other = (await m.events.createEvent(db, m.database.DEMO_ACCOUNT_ID, { name: "Other", date: "2027-07-01", location: "x", description: null })).id;
    const foreign = (await m.guests.addGuest(db, m.database.DEMO_ACCOUNT_ID, other, "Foreign Guest"))!;
    for (const guestId of [foreign.id, "44444444-4444-4444-8444-444444444444", "nope"]) {
      const r = await m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted", guestId }));
      expect(r.field, guestId).toBe("guest");
    }
    const own = (await m.guests.addGuest(db, m.database.DEMO_ACCOUNT_ID, eventId, "Own Guest"))!;
    await target(m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted", guestId: own.id })));
    expect((await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId))[0].linkedToGuest).toBe(true);
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "signatures-only" })));
    const r = await m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted", guestId: own.id }));
    expect(r.field).toBe("guest");
  });

  it("refuses an unknown or malformed event", async () => {
    const m = await signaturesOnly();
    for (const id of ["33333333-3333-4333-8333-333333333333", "nope", ""]) {
      expect((await m.sig.submitSignatureAction({}, form({ eventId: id, payload: SIG, permission: "granted" }))).error).toContain("could not be found");
    }
  });

  it("a failure is reported plainly: nothing saved, nothing sensitive in the message or the log", async () => {
    const m = await signaturesOnly();
    const db = await m.database.getDatabase();
    await db.exec(`create function fail_audit() returns trigger language plpgsql as $$ begin raise exception 'secret internal detail'; end; $$;
      create trigger fail_audit before insert on audit_events for each row execute function fail_audit();`);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = await m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted" }));
    expect(r.error).toBe("The signature could not be saved. Nothing was stored. Please try again.");
    expect(JSON.stringify([r, log.mock.calls])).not.toMatch(/secret internal detail|strokes/);
    await db.exec("drop trigger fail_audit on audit_events");
    expect((await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId)).length).toBe(0);
  });
});

describe("the revoke action", () => {
  it("withdraws permission, confirms by receipt, keeps the signature, and is safe to repeat", async () => {
    const m = await mods();
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "signatures-only" })));
    await target(m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted" })));
    const db = await m.database.getDatabase();
    const id = (await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId))[0].id;
    const t1 = await target(m.sig.revokePermissionAction(form({ eventId, contributionId: id })));
    expect(t1.pathname).toBe(`/events/${eventId}/check-in/contributions`);
    expect(t1.searchParams.has("notice")).toBe(false);
    expect(readReceipt(t1.searchParams.get("r"), eventId)?.notice).toBe("permission-revoked");
    const t2 = await target(m.sig.revokePermissionAction(form({ eventId, contributionId: id })));
    expect(readReceipt(t2.searchParams.get("r"), eventId)?.notice).toBe("permission-not-granted");
    expect(await m.repo.listEligibleContributions(db, m.database.DEMO_ACCOUNT_ID, eventId)).toEqual([]);
    expect((await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId)).length).toBe(1);
  });

  it("reports 'not found' for a contribution of another event or an unknown id, changing nothing", async () => {
    const m = await mods();
    await target(m.modActions.saveModulesAction({}, form({ eventId, preset: "signatures-only" })));
    await target(m.sig.submitSignatureAction({}, form({ eventId, payload: SIG, permission: "granted" })));
    const db = await m.database.getDatabase();
    const id = (await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId))[0].id;
    const other = (await m.events.createEvent(db, m.database.DEMO_ACCOUNT_ID, { name: "Other", date: "2027-07-01", location: "x", description: null })).id;
    for (const [ev, cid] of [[other, id], [eventId, "44444444-4444-4444-8444-444444444444"], [eventId, "nope"]] as const) {
      const t = await target(m.sig.revokePermissionAction(form({ eventId: ev, contributionId: cid })));
      expect(readReceipt(t.searchParams.get("r"), ev)?.notice).toBe("not-found");
    }
    expect((await m.repo.listContributions(db, m.database.DEMO_ACCOUNT_ID, eventId))[0].status).toBe("granted");
  });
});

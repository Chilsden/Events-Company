import { PGlite } from "@electric-sql/pglite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureAccount, openDatabase, defaultDataDir, DEMO_ACCOUNT_ID } from "@/server/database";
import { createEvent, getEvent, listEvents } from "@/server/events-repository";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const input = (name: string) => ({ name, date: "2027-06-18", location: "Test Hall", description: null });

describe("repository filter works on its own (row-level security switched off)", () => {
  it("still separates accounts, so the explicit account filter is tested independently of the policies", async () => {
    const db = await openDatabase();
    await ensureAccount(db, A, "A");
    await ensureAccount(db, B, "B");
    const a = await createEvent(db, A, input("A event"));
    const b = await createEvent(db, B, input("B event"));
    await db.exec("alter table events disable row level security");
    expect((await listEvents(db, A)).map((e) => e.name)).toEqual(["A event"]);
    expect((await listEvents(db, B)).map((e) => e.name)).toEqual(["B event"]);
    expect(await getEvent(db, A, b.id)).toBeNull();
    expect(await getEvent(db, B, a.id)).toBeNull();
  });
});

describe("database constraints (defence behind the validation)", () => {
  it.each([
    ["name too long", "insert into events (account_id, name, event_date, location) values ($1, repeat('n', 121), '2027-01-01', 'x')"],
    ["empty name", "insert into events (account_id, name, event_date, location) values ($1, '', '2027-01-01', 'x')"],
    ["location too long", "insert into events (account_id, name, event_date, location) values ($1, 'n', '2027-01-01', repeat('l', 201))"],
    ["empty location", "insert into events (account_id, name, event_date, location) values ($1, 'n', '2027-01-01', '')"],
    ["description too long", "insert into events (account_id, name, event_date, location, description) values ($1, 'n', '2027-01-01', 'x', repeat('d', 2001))"],
    ["unknown account", "insert into events (account_id, name, event_date, location) values ('99999999-9999-4999-8999-999999999999', 'n', '2027-01-01', 'x')"],
  ])("rejects %s", async (_label, sql) => {
    const db = await openDatabase();
    await ensureAccount(db, A, "A");
    await expect(db.query(sql, sql.includes("$1") ? [A] : [])).rejects.toThrow();
  });
});

describe("account setting does not leak between operations", () => {
  it("leaves no account set on the connection after a repository call", async () => {
    const db = await openDatabase();
    await ensureAccount(db, A, "A");
    await createEvent(db, A, input("A event"));
    const { rows } = await db.query<{ v: string | null }>("select current_setting('app.account_id', true) as v");
    expect(rows[0].v === null || rows[0].v === "").toBe(true);
    const role = await db.query<{ r: string }>("select current_user as r");
    expect(role.rows[0].r).not.toBe("events_app");
  });

  it("does not let the application role read the accounts table", async () => {
    const db = await openDatabase();
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role events_app");
        await tx.query("select * from accounts");
      }),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("data folder setting", () => {
  const saved = process.env.EVENTS_DATA_DIR;
  afterEach(() => {
    if (saved === undefined) delete process.env.EVENTS_DATA_DIR;
    else process.env.EVENTS_DATA_DIR = saved;
  });

  it("uses EVENTS_DATA_DIR when set, and the default folder when it is empty or blank", () => {
    process.env.EVENTS_DATA_DIR = "C:\\somewhere\\else";
    expect(defaultDataDir()).toBe("C:\\somewhere\\else");
    for (const blank of ["", "   "]) {
      process.env.EVENTS_DATA_DIR = blank;
      expect(defaultDataDir()).toBe(path.resolve(process.cwd(), ".data", "pglite"));
    }
  });
});

describe("createEventAction (the server action behind the form)", () => {
  const holder = globalThis as unknown as { __eventsDb?: Promise<PGlite> };
  const root = mkdtempSync(path.join(tmpdir(), "events-action-"));
  const saved = process.env.EVENTS_DATA_DIR;
  let dir: string;
  let n = 0;

  beforeEach(() => {
    dir = path.join(root, `db${n++}`, "pglite");
    process.env.EVENTS_DATA_DIR = dir;
    holder.__eventsDb = undefined;
  });
  afterEach(async () => {
    if (holder.__eventsDb) await (await holder.__eventsDb).close().catch(() => undefined);
    holder.__eventsDb = undefined;
    if (saved === undefined) delete process.env.EVENTS_DATA_DIR;
    else process.env.EVENTS_DATA_DIR = saved;
    vi.restoreAllMocks();
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const form = (o: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(o)) fd.append(k, v);
    return fd;
  };
  const count = async () => {
    const { getDatabase } = await import("@/server/database");
    return (await (await getDatabase()).query<{ c: number }>("select count(*)::int as c from events")).rows[0].c;
  };

  it("returns field errors and the entered values, and saves nothing, for invalid input", async () => {
    const { createEventAction } = await import("@/server/actions");
    const state = await createEventAction({}, form({ name: "", date: "2027-02-30", location: "Hall", description: "kept text" }));
    expect(state.errors?.name).toContain("Enter an event name");
    expect(state.errors?.date).toContain("real date");
    expect(state.errors?.location).toBeUndefined();
    expect(state.values).toMatchObject({ location: "Hall", description: "kept text" });
    expect(await count()).toBe(0);
  });

  it("saves a valid event under the demo account and redirects to its page, ignoring any account in the request", async () => {
    const { createEventAction } = await import("@/server/actions");
    await expect(
      createEventAction({}, form({ name: "Action test", date: "2027-06-18", location: "Hall", account_id: A, accountId: B })),
    ).rejects.toThrow(/^NEXT_REDIRECT:\/events\/[0-9a-f-]{36}$/);
    const { getDatabase } = await import("@/server/database");
    const db = await getDatabase();
    const events = await listEvents(db, DEMO_ACCOUNT_ID);
    expect(events.map((e) => e.name)).toEqual(["Action test"]);
    expect(await listEvents(db, A)).toEqual([]);
    expect(await listEvents(db, B)).toEqual([]);
  });

  it("returns a plain message and does not log the submitted values when saving fails", async () => {
    const { createEventAction } = await import("@/server/actions");
    const { getDatabase } = await import("@/server/database");
    await (await getDatabase()).close(); // the next save will fail
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const state = await createEventAction({}, form({ name: "Secret-ish name", date: "2027-06-18", location: "Secret-ish place" }));
    expect(state.message).toBe("We could not save the event. Please try again.");
    expect(log).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain("Secret-ish");
  });
});

import { PGlite } from "@electric-sql/pglite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ensureAccount, migrate, openDatabase } from "@/server/database";
import { createEvent, getEvent, listEvents } from "@/server/events-repository";
import { isUuid } from "@/domain/event";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const input = (name: string, date = "2027-06-18") => ({ name, date, location: "Test Hall", description: null });

let db: PGlite;
beforeEach(async () => {
  db = await openDatabase(); // fresh in-memory database per test
  await ensureAccount(db, A, "Synthetic account A");
  await ensureAccount(db, B, "Synthetic account B");
});

describe("saving and retrieving", () => {
  it("creates an event and returns it with a UUID, the account and the saved fields", async () => {
    const created = await createEvent(db, A, { name: "Launch", date: "2027-06-18", location: "Test Hall", description: "Synthetic" });
    expect(isUuid(created.id)).toBe(true);
    expect(created).toMatchObject({ accountId: A, name: "Launch", date: "2027-06-18", location: "Test Hall", description: "Synthetic" });
    expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    expect(await getEvent(db, A, created.id)).toEqual(created);
  });

  it("stores a missing description as null", async () => {
    const created = await createEvent(db, A, input("No description"));
    expect((await getEvent(db, A, created.id))?.description).toBeNull();
  });

  it("gives every event a different id", async () => {
    const a = await createEvent(db, A, input("One"));
    const b = await createEvent(db, A, input("One"));
    expect(a.id).not.toBe(b.id);
  });

  it("stores hostile text literally and keeps the table intact", async () => {
    const nasty = "x'); drop table events; --";
    const created = await createEvent(db, A, input(nasty));
    expect((await getEvent(db, A, created.id))?.name).toBe(nasty);
    expect((await listEvents(db, A)).length).toBe(1);
  });

  it("rejects an account id that is not a UUID", async () => {
    await expect(createEvent(db, "1' or '1'='1", input("x"))).rejects.toThrow();
    await expect(listEvents(db, "nope")).rejects.toThrow();
  });
});

describe("listing", () => {
  it("returns an empty list for an account with no events", async () => {
    expect(await listEvents(db, A)).toEqual([]);
  });

  it("lists events by date, then creation order", async () => {
    await createEvent(db, A, input("Later", "2027-09-01"));
    await createEvent(db, A, input("Sooner", "2027-03-01"));
    await createEvent(db, A, input("Sooner second", "2027-03-01"));
    expect((await listEvents(db, A)).map((e) => e.name)).toEqual(["Sooner", "Sooner second", "Later"]);
  });
});

describe("unknown events", () => {
  it("returns null for an unknown id and for text that is not a UUID", async () => {
    expect(await getEvent(db, A, "33333333-3333-4333-8333-333333333333")).toBeNull();
    for (const bad of ["not-a-uuid", "", "1 or 1=1", "../../etc/passwd"]) expect(await getEvent(db, A, bad)).toBeNull();
  });
});

describe("account separation", () => {
  it("does not list or return another account's events", async () => {
    const mine = await createEvent(db, A, input("A event"));
    const theirs = await createEvent(db, B, input("B event"));
    expect((await listEvents(db, A)).map((e) => e.name)).toEqual(["A event"]);
    expect((await listEvents(db, B)).map((e) => e.name)).toEqual(["B event"]);
    expect(await getEvent(db, A, theirs.id)).toBeNull();
    expect(await getEvent(db, B, mine.id)).toBeNull();
    expect((await getEvent(db, B, theirs.id))?.name).toBe("B event");
  });

  it("is enforced by the database, not only by the repository filter", async () => {
    const mine = await createEvent(db, A, input("A event"));
    await createEvent(db, B, input("B event"));
    await db.transaction(async (tx) => {
      await tx.exec("set local role events_app");
      await tx.query("select set_config('app.account_id', $1, true)", [B]);
      // a query with no account filter at all, asking for A's row by id, still sees nothing of A
      expect((await tx.query("select id from events where id = $1", [mine.id])).rows).toEqual([]);
      expect((await tx.query<{ name: string }>("select name from events")).rows.map((r) => r.name)).toEqual(["B event"]);
    });
  });

  it("blocks the application role from inserting for another account", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role events_app");
        await tx.query("select set_config('app.account_id', $1, true)", [A]);
        await tx.query("insert into events (account_id, name, event_date, location) values ($1, 'sneaky', '2027-01-01', 'x')", [B]);
      }),
    ).rejects.toThrow(/row-level security/);
  });

  it("shows no rows when no account is set", async () => {
    await createEvent(db, A, input("A event"));
    await db.transaction(async (tx) => {
      await tx.exec("set local role events_app");
      expect((await tx.query("select id from events")).rows).toEqual([]);
    });
  });

  it("does not let the application role change or delete events", async () => {
    const mine = await createEvent(db, A, input("A event"));
    for (const sql of ["update events set name = 'changed'", "delete from events"]) {
      await expect(
        db.transaction(async (tx) => {
          await tx.exec("set local role events_app");
          await tx.query("select set_config('app.account_id', $1, true)", [A]);
          await tx.query(sql);
        }),
      ).rejects.toThrow(/permission denied/);
    }
    expect((await getEvent(db, A, mine.id))?.name).toBe("A event");
  });
});

describe("persistence and migrations", () => {
  const dirs: string[] = [];
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

  it("keeps events after the database is closed and reopened", async () => {
    const dir = path.join(mkdtempSync(path.join(tmpdir(), "events-test-")), "pglite");
    dirs.push(path.dirname(dir));
    const first = await openDatabase(dir);
    await ensureAccount(first, A, "Synthetic account A");
    const created = await createEvent(first, A, { name: "Survives restart", date: "2027-06-18", location: "Test Hall", description: "kept" });
    await first.close();

    const second = await openDatabase(dir);
    expect(await getEvent(second, A, created.id)).toEqual(created);
    expect((await listEvents(second, A)).map((e) => e.name)).toEqual(["Survives restart"]);
    await second.close();
  });

  it("applies each migration once", async () => {
    const dir = path.join(mkdtempSync(path.join(tmpdir(), "events-test-")), "pglite");
    dirs.push(path.dirname(dir));
    const first = await openDatabase(dir);
    expect((await first.query("select version from schema_migrations order by version")).rows).toEqual([{ version: "0001_init.sql" }, { version: "0002_guests.sql" }, { version: "0003_protect_check_in_time.sql" }, { version: "0004_guest_management.sql" }, { version: "0005_modules_and_contributions.sql" }]);
    expect(await migrate(first)).toEqual([]); // second run applies nothing
    await first.close();
    const reopened = await openDatabase(dir); // reopening must not fail on the existing role and tables
    expect((await reopened.query("select count(*)::int as c from schema_migrations")).rows[0]).toEqual({ c: 5 });
    await reopened.close();
  });
});

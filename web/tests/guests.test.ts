import type { PGlite } from "@electric-sql/pglite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { cleanSearch, formatCheckInTime, parseGuestForm } from "@/domain/guest";
import { ensureAccount, openDatabase } from "@/server/database";
import { createEvent } from "@/server/events-repository";
import { addGuest, checkInGuest, getAttendance, listGuests, undoCheckIn } from "@/server/guests-repository";
import { asAccount } from "@/server/scope";
import { isUuid } from "@/domain/event";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const ev = (name: string) => ({ name, date: "2027-06-18", location: "Test Hall", description: null });
const NOWHERE = "33333333-3333-4333-8333-333333333333";

let db: PGlite;
let eventA1: string;
let eventA2: string;
let eventB1: string;

beforeEach(async () => {
  db = await openDatabase();
  await ensureAccount(db, A, "Synthetic A");
  await ensureAccount(db, B, "Synthetic B");
  eventA1 = (await createEvent(db, A, ev("A event one"))).id;
  eventA2 = (await createEvent(db, A, ev("A event two"))).id;
  eventB1 = (await createEvent(db, B, ev("B event one"))).id;
});

describe("guest input validation", () => {
  it("accepts and trims a valid name", () => {
    expect(parseGuestForm({ name: "  Alex Example  " })).toEqual({ ok: true, name: "Alex Example" });
  });
  it("accepts a name exactly at the limit", () => {
    expect(parseGuestForm({ name: "n".repeat(120) }).ok).toBe(true);
  });
  it.each([
    ["empty", "", "Enter the guest's name."],
    ["blank", "   ", "Enter the guest's name."],
    ["too long", "n".repeat(121), "120 characters or fewer"],
    ["control character", "Bad\u0000Name", "not allowed"],
    ["new line", "Two\nLines", "not allowed"],
  ])("rejects a %s name", (_label, name, message) => {
    const r = parseGuestForm({ name });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(message);
  });
  it("treats a missing or non-string name as empty and ignores other fields such as an email or account", () => {
    expect(parseGuestForm({}).ok).toBe(false);
    expect(parseGuestForm({ name: ["x"] }).ok).toBe(false);
    expect(parseGuestForm({ name: "Alex", email: "alex@example.invalid", accountId: B })).toEqual({ ok: true, name: "Alex" });
  });
  it("cleans search text", () => {
    expect(cleanSearch("  ab\u0000c  ")).toBe("ab c");
    expect(cleanSearch("x".repeat(500)).length).toBe(100);
    expect(cleanSearch(undefined)).toBe("");
    expect(cleanSearch(["a"])).toBe("");
  });
  it("formats check-in times in UK time", () => {
    expect(formatCheckInTime("2027-06-18T13:05:00.000Z")).toBe("14:05"); // British Summer Time
    expect(formatCheckInTime("2027-01-18T13:05:00.000Z")).toBe("13:05");
  });
});

describe("adding and listing guests", () => {
  it("adds a guest with a UUID, the right account and event, and not checked in", async () => {
    const g = await addGuest(db, A, eventA1, "Alex Example");
    expect(g).not.toBeNull();
    expect(isUuid(g!.id)).toBe(true);
    expect(g).toMatchObject({ accountId: A, eventId: eventA1, name: "Alex Example", checkedInAt: null });
    expect(Number.isNaN(Date.parse(g!.createdAt))).toBe(false);
  });

  it("lists an empty event as empty, with zero attendance", async () => {
    expect(await listGuests(db, A, eventA1)).toEqual([]);
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 0, checkedIn: 0, notCheckedIn: 0 });
  });

  it("lists guests by name regardless of case, and finds duplicates of the same name as separate people", async () => {
    await addGuest(db, A, eventA1, "charlie Test");
    await addGuest(db, A, eventA1, "Alex Test");
    await addGuest(db, A, eventA1, "Alex Test");
    await addGuest(db, A, eventA1, "Bea Test");
    const list = await listGuests(db, A, eventA1);
    expect(list.map((g) => g.name)).toEqual(["Alex Test", "Alex Test", "Bea Test", "charlie Test"]);
    expect(new Set(list.map((g) => g.id)).size).toBe(4);
  });

  it("searches by plain text, ignoring case, with no wildcard behaviour", async () => {
    for (const n of ["Alex Test", "Bea Test", "100% Real", "under_score", "O'Neil Test"]) await addGuest(db, A, eventA1, n);
    expect((await listGuests(db, A, eventA1, "BEA")).map((g) => g.name)).toEqual(["Bea Test"]);
    expect((await listGuests(db, A, eventA1, "%")).map((g) => g.name)).toEqual(["100% Real"]);
    expect((await listGuests(db, A, eventA1, "_")).map((g) => g.name)).toEqual(["under_score"]);
    expect((await listGuests(db, A, eventA1, "' or '1'='1")).length).toBe(0);
    expect((await listGuests(db, A, eventA1, "o'neil")).length).toBe(1);
    expect((await listGuests(db, A, eventA1, "zzz")).length).toBe(0);
  });

  it("stores hostile text literally", async () => {
    const nasty = "x'); drop table guests; --";
    await addGuest(db, A, eventA1, nasty);
    expect((await listGuests(db, A, eventA1)).map((g) => g.name)).toEqual([nasty]);
  });
});

describe("unknown events and guests", () => {
  it("does not add a guest to an unknown, malformed or other-account event", async () => {
    expect(await addGuest(db, A, NOWHERE, "Alex")).toBeNull();
    expect(await addGuest(db, A, "not-a-uuid", "Alex")).toBeNull();
    expect(await addGuest(db, A, eventB1, "Alex")).toBeNull();
    expect(await listGuests(db, B, eventB1)).toEqual([]);
  });
  it("returns empty lists and zero totals for unknown or malformed events", async () => {
    expect(await listGuests(db, A, NOWHERE)).toEqual([]);
    expect(await listGuests(db, A, "nope")).toEqual([]);
    expect(await getAttendance(db, A, NOWHERE)).toEqual({ total: 0, checkedIn: 0, notCheckedIn: 0 });
    expect(await getAttendance(db, A, "nope")).toEqual({ total: 0, checkedIn: 0, notCheckedIn: 0 });
  });
  it("reports not_found for unknown or malformed guest and event ids, and writes nothing", async () => {
    expect(await checkInGuest(db, A, eventA1, NOWHERE)).toEqual({ status: "not_found" });
    expect(await checkInGuest(db, A, eventA1, "nope")).toEqual({ status: "not_found" });
    expect(await checkInGuest(db, A, "nope", NOWHERE)).toEqual({ status: "not_found" });
    expect((await db.query("select count(*)::int as c from check_in_log")).rows[0]).toEqual({ c: 0 });
  });
});

describe("account and event isolation", () => {
  it("never shows guests of another event or account", async () => {
    const a1 = await addGuest(db, A, eventA1, "Guest of A1");
    const a2 = await addGuest(db, A, eventA2, "Guest of A2");
    const b1 = await addGuest(db, B, eventB1, "Guest of B1");
    expect((await listGuests(db, A, eventA1)).map((g) => g.id)).toEqual([a1!.id]);
    expect((await listGuests(db, A, eventA2)).map((g) => g.id)).toEqual([a2!.id]);
    expect((await listGuests(db, B, eventB1)).map((g) => g.id)).toEqual([b1!.id]);
    expect(await listGuests(db, A, eventB1)).toEqual([]); // account A asking for B's event
    expect(await listGuests(db, B, eventA1)).toEqual([]);
    expect((await getAttendance(db, A, eventA1)).total).toBe(1);
    expect((await getAttendance(db, A, eventB1)).total).toBe(0);
  });

  it("cannot check in a guest through another event or another account", async () => {
    const a1 = (await addGuest(db, A, eventA1, "Guest of A1"))!;
    expect(await checkInGuest(db, A, eventA2, a1.id)).toEqual({ status: "not_found" }); // same account, wrong event
    expect(await checkInGuest(db, B, eventA1, a1.id)).toEqual({ status: "not_found" }); // other account, right ids
    expect(await checkInGuest(db, B, eventB1, a1.id)).toEqual({ status: "not_found" });
    expect((await listGuests(db, A, eventA1))[0].checkedInAt).toBeNull();
    expect((await db.query("select count(*)::int as c from check_in_log")).rows[0]).toEqual({ c: 0 });
  });

  it("still separates events and accounts with row-level security switched off (repository filters alone)", async () => {
    const a1 = (await addGuest(db, A, eventA1, "Guest of A1"))!;
    const b1 = (await addGuest(db, B, eventB1, "Guest of B1"))!;
    await db.exec("alter table guests disable row level security; alter table check_in_log disable row level security");
    expect((await listGuests(db, A, eventA1)).map((g) => g.name)).toEqual(["Guest of A1"]);
    expect(await listGuests(db, A, eventA2)).toEqual([]);
    expect(await listGuests(db, B, eventA1)).toEqual([]);
    expect(await checkInGuest(db, A, eventA2, a1.id)).toEqual({ status: "not_found" });
    expect(await checkInGuest(db, A, eventA1, b1.id)).toEqual({ status: "not_found" });
    expect(await checkInGuest(db, B, eventB1, a1.id)).toEqual({ status: "not_found" });
  });
});

describe("check-in", () => {
  it("checks a guest in once, records the first time, and updates the counts", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex Test"))!;
    await addGuest(db, A, eventA1, "Bea Test");
    const r = await checkInGuest(db, A, eventA1, g.id);
    expect(r.status).toBe("checked_in");
    if (r.status === "checked_in") {
      expect(r.guest.checkedInAt).not.toBeNull();
      expect(r.guest.name).toBe("Alex Test");
    }
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 2, checkedIn: 1, notCheckedIn: 1 });
    const list = await listGuests(db, A, eventA1);
    expect(list.filter((x) => x.checkedInAt).map((x) => x.name)).toEqual(["Alex Test"]);
  });

  it("a repeat check-in changes nothing: same first timestamp, no extra attendance, but the attempt is logged", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex Test"))!;
    const first = await checkInGuest(db, A, eventA1, g.id);
    const second = await checkInGuest(db, A, eventA1, g.id);
    const third = await checkInGuest(db, A, eventA1, g.id);
    expect(first.status).toBe("checked_in");
    expect(second.status).toBe("already_checked_in");
    expect(third.status).toBe("already_checked_in");
    if (first.status === "checked_in" && second.status === "already_checked_in") {
      expect(second.guest.checkedInAt).toBe(first.guest.checkedInAt);
    }
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 1, checkedIn: 1, notCheckedIn: 0 });
    const log = await db.query<{ outcome: string }>("select outcome from check_in_log order by received_at, outcome");
    expect(log.rows.map((r) => r.outcome).sort()).toEqual(["already_checked_in", "already_checked_in", "checked_in"]);
  });

  it("concurrent attempts on one guest give exactly one success and consistent state", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex Test"))!;
    const results = await Promise.all(Array.from({ length: 25 }, () => checkInGuest(db, A, eventA1, g.id)));
    expect(results.filter((r) => r.status === "checked_in").length).toBe(1);
    expect(results.filter((r) => r.status === "already_checked_in").length).toBe(24);
    const times = new Set(results.map((r) => (r.status === "not_found" ? "x" : r.guest.checkedInAt)));
    expect(times.size).toBe(1); // everyone sees the same first-check-in time
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 1, checkedIn: 1, notCheckedIn: 0 });
    const log = await db.query<{ outcome: string; c: number }>("select outcome, count(*)::int as c from check_in_log group by outcome order by outcome");
    expect(log.rows).toEqual([{ outcome: "already_checked_in", c: 24 }, { outcome: "checked_in", c: 1 }]);
  });

  it("concurrent attempts on different guests all succeed and the totals add up", async () => {
    const guests = await Promise.all(Array.from({ length: 12 }, (_, i) => addGuest(db, A, eventA1, `Guest ${String(i).padStart(2, "0")}`)));
    const results = await Promise.all(guests.map((g) => checkInGuest(db, A, eventA1, g!.id)));
    expect(results.every((r) => r.status === "checked_in")).toBe(true);
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 12, checkedIn: 12, notCheckedIn: 0 });
  });

  it("attendance totals always equal the guest list", async () => {
    const people = [];
    for (const n of ["A", "B", "C", "D", "E"]) people.push((await addGuest(db, A, eventA1, `Guest ${n}`))!);
    await checkInGuest(db, A, eventA1, people[0].id);
    await checkInGuest(db, A, eventA1, people[3].id);
    await checkInGuest(db, A, eventA1, people[3].id);
    const list = await listGuests(db, A, eventA1);
    const att = await getAttendance(db, A, eventA1);
    expect(att.total).toBe(list.length);
    expect(att.checkedIn).toBe(list.filter((g) => g.checkedInAt).length);
    expect(att.notCheckedIn).toBe(list.filter((g) => !g.checkedInAt).length);
    expect(att).toEqual({ total: 5, checkedIn: 2, notCheckedIn: 3 });
  });
});

describe("database constraints and access policies", () => {
  const inRole = (accountId: string | null, sql: string, params: unknown[] = []) =>
    db.transaction(async (tx) => {
      await tx.exec("set local role events_app");
      if (accountId) await tx.query("select set_config('app.account_id', $1, true)", [accountId]);
      return tx.query(sql, params);
    });

  it("rejects a guest whose event belongs to a different account (composite foreign key, as the database owner)", async () => {
    await expect(db.query("insert into guests (account_id, event_id, name) values ($1, $2, 'x')", [A, eventB1])).rejects.toThrow(/foreign key/);
    await expect(db.query("insert into guests (account_id, event_id, name) values ($1, $2, 'x')", [A, NOWHERE])).rejects.toThrow(/foreign key/);
  });

  it("rejects bad names, even bypassing the application", async () => {
    await expect(db.query("insert into guests (account_id, event_id, name) values ($1, $2, '')", [A, eventA1])).rejects.toThrow(/check/);
    await expect(db.query("insert into guests (account_id, event_id, name) values ($1, $2, repeat('n', 121))", [A, eventA1])).rejects.toThrow(/check/);
  });

  it("rejects a log entry for a guest of another event or account, and unknown outcomes", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await expect(db.query("insert into check_in_log (account_id, event_id, guest_id, outcome) values ($1, $2, $3, 'checked_in')", [A, eventA2, g.id])).rejects.toThrow(/foreign key/);
    await expect(db.query("insert into check_in_log (account_id, event_id, guest_id, outcome) values ($1, $2, $3, 'checked_in')", [B, eventA1, g.id])).rejects.toThrow(/foreign key/);
    await expect(db.query("insert into check_in_log (account_id, event_id, guest_id, outcome) values ($1, $2, $3, 'bogus')", [A, eventA1, g.id])).rejects.toThrow(/check/);
  });

  it("the application role sees only its own account's guests and cannot insert for another account", async () => {
    await addGuest(db, A, eventA1, "Guest of A");
    await addGuest(db, B, eventB1, "Guest of B");
    expect((await inRole(B, "select name from guests")).rows).toEqual([{ name: "Guest of B" }]);
    expect((await inRole(null, "select name from guests")).rows).toEqual([]);
    await expect(inRole(A, "insert into guests (account_id, event_id, name) values ($1, $2, 'sneaky')", [B, eventB1])).rejects.toThrow(/row-level security/);
  });

  it("the application role can change only a guest's name and check-in state (each needs an audit record), and cannot delete or rewrite history", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await expect(inRole(A, "update guests set name = 'renamed'")).rejects.toThrow(/without an audit record/); // 0004: allowed only with its audit record
    await expect(inRole(A, "update guests set account_id = $1", [B])).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "update guests set event_id = $1", [eventA2])).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "delete from guests")).rejects.toThrow(/permission denied/);
    await checkInGuest(db, A, eventA1, g.id);
    await expect(inRole(A, "update check_in_log set outcome = 'already_checked_in'")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "delete from check_in_log")).rejects.toThrow(/permission denied/);
    // an update under another account's setting touches nothing
    expect((await inRole(B, "update guests set checked_in_at = null")).affectedRows).toBe(0);
    expect((await listGuests(db, A, eventA1))[0].checkedInAt).not.toBeNull();
  });

  it("consent records: no access for the application role, constraints in place, and no consent assumed", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await expect(inRole(A, "select * from consent_records")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "insert into consent_records (account_id, event_id, guest_id, purpose, status, wording_version, provenance) values ($1,$2,$3,'p','granted','v1','guest_self')", [A, eventA1, g.id])).rejects.toThrow(/permission denied/);
    const base = [A, eventA1, g.id];
    await db.query("insert into consent_records (account_id, event_id, guest_id, purpose, status, wording_version, provenance) values ($1,$2,$3,'test only','granted','v0','synthetic_test')", base);
    await expect(db.query("insert into consent_records (account_id, event_id, guest_id, purpose, status, wording_version, provenance) values ($1,$2,$3,'p','granted','v1','assumed')", base)).rejects.toThrow(/check/);
    await expect(db.query("insert into consent_records (account_id, event_id, guest_id, purpose, status, wording_version, provenance) values ($1,$2,$3,'p','withdrawn','v1','guest_self')", base)).rejects.toThrow(/check/); // withdrawn needs a withdrawn_at
    // adding a guest never creates a consent row on its own
    await addGuest(db, A, eventA1, "Bea");
    expect((await db.query("select count(*)::int as c from consent_records")).rows[0]).toEqual({ c: 1 });
  });

  it("the guest table holds only a name, no contact details, photographs or signatures", async () => {
    const cols = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_name = 'guests' order by column_name")).rows.map((r) => r.column_name);
    expect(cols).toEqual(["account_id", "checked_in_at", "created_at", "event_id", "id", "import_batch_id", "name"]);
    const logCols = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_name = 'check_in_log' order by column_name")).rows.map((r) => r.column_name);
    expect(logCols).not.toContain("name");
  });
});

describe("scoping helper, rollback and protected evidence", () => {
  it("asAccount runs as the limited role with the account set, only inside the transaction", async () => {
    const inside = await asAccount(db, A, async (tx) => {
      const who = await tx.query<{ u: string; a: string }>("select current_user as u, current_setting('app.account_id', true) as a");
      return who.rows[0];
    });
    expect(inside).toEqual({ u: "events_app", a: A });
    const after = await db.query<{ u: string; a: string | null }>("select current_user as u, current_setting('app.account_id', true) as a");
    expect(after.rows[0].u).not.toBe("events_app");
    expect(after.rows[0].a === null || after.rows[0].a === "").toBe(true);
    await expect(asAccount(db, "not-a-uuid", async () => 1)).rejects.toThrow();
  });

  it("if recording the attempt fails, the whole check-in is rolled back and the guest stays not checked in", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex Test"))!;
    await db.exec(`
      create function fail_log() returns trigger language plpgsql as $$ begin raise exception 'simulated log failure'; end; $$;
      create trigger fail_log before insert on check_in_log for each row execute function fail_log();`);
    await expect(checkInGuest(db, A, eventA1, g.id)).rejects.toThrow(/simulated log failure/);
    await db.exec("drop trigger fail_log on check_in_log");
    expect((await listGuests(db, A, eventA1))[0].checkedInAt).toBeNull();
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 1, checkedIn: 0, notCheckedIn: 1 });
    expect((await checkInGuest(db, A, eventA1, g.id)).status).toBe("checked_in"); // and a retry then works normally
  });

  it("a check-in time cannot be cleared, replaced or set without its audit record, by the application role or the owner", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex Test"))!;
    const done = await checkInGuest(db, A, eventA1, g.id);
    const original = done.status === "checked_in" ? done.guest.checkedInAt : null;
    const asApp = (sql: string) =>
      asAccount(db, A, async (tx) => {
        await tx.query(sql, [g.id]);
      });
    await expect(asApp("update guests set checked_in_at = null where id = $1")).rejects.toThrow(/without an audit record/);
    await expect(asApp("update guests set checked_in_at = now() + interval '1 hour' where id = $1")).rejects.toThrow(/cannot be replaced/);
    await expect(db.query("update guests set checked_in_at = null where id = $1", [g.id])).rejects.toThrow(/without an audit record/);
    expect((await listGuests(db, A, eventA1))[0].checkedInAt).toBe(original);
    // the supported route works: undo records its own audit event and the guest can be checked in again
    expect((await undoCheckIn(db, A, eventA1, g.id)).status).toBe("undone");
    expect((await checkInGuest(db, A, eventA1, g.id)).status).toBe("checked_in");
  });

  it("records the real time of the check-in, not the start of a long transaction", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex Test"))!;
    const before = Date.now();
    const done = await checkInGuest(db, A, eventA1, g.id);
    const stamp = done.status === "checked_in" ? Date.parse(done.guest.checkedInAt!) : 0;
    expect(stamp).toBeGreaterThanOrEqual(before - 1000);
    expect(stamp).toBeLessThanOrEqual(Date.now() + 1000);
  });
});

describe("names cannot hide text", () => {
  it.each([
    ["zero-width space", "Al\u200Bex"],
    ["right-to-left override", "Alex\u202Etxt"],
    ["bidirectional isolate", "A\u2066lex"],
    ["byte-order mark inside the name", "Al\uFEFFex"],
    ["word joiner", "Al\u2060ex"],
  ])("rejects a name with a %s", (_label, name) => {
    expect(parseGuestForm({ name }).ok).toBe(false);
  });
  it("removes a leading byte-order mark rather than storing it", () => {
    expect(parseGuestForm({ name: "\uFEFFAlex" })).toEqual({ ok: true, name: "Alex" });
  });
  it("still accepts ordinary international names", () => {
    for (const name of ["José Álvarez", "Zoë Müller", "李小龍", "Ólafur Þórsson", "O'Neil-Smith"]) expect(parseGuestForm({ name }).ok).toBe(true);
  });
});

describe("persistence", () => {
  const root = mkdtempSync(path.join(tmpdir(), "events-guests-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("keeps guests, check-ins and the log after the database is closed and reopened", async () => {
    const dir = path.join(root, "pglite");
    const first = await openDatabase(dir);
    await ensureAccount(first, A, "Synthetic A");
    const event = await createEvent(first, A, ev("Persisted event"));
    const alex = (await addGuest(first, A, event.id, "Alex Test"))!;
    await addGuest(first, A, event.id, "Bea Test");
    const checked = await checkInGuest(first, A, event.id, alex.id);
    await first.close();

    const second = await openDatabase(dir);
    const list = await listGuests(second, A, event.id);
    expect(list.map((g) => g.name)).toEqual(["Alex Test", "Bea Test"]);
    expect(checked.status === "checked_in" && list[0].checkedInAt).toBe(checked.status === "checked_in" ? checked.guest.checkedInAt : null);
    expect(list[1].checkedInAt).toBeNull();
    expect(await getAttendance(second, A, event.id)).toEqual({ total: 2, checkedIn: 1, notCheckedIn: 1 });
    expect((await checkInGuest(second, A, event.id, alex.id)).status).toBe("already_checked_in"); // still idempotent after a restart
    await second.close();
  });
});

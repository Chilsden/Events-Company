import type { PGlite } from "@electric-sql/pglite";
import { mkdirSync, mkdtempSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_GUESTS_PER_EVENT } from "@/domain/guest";
import { ensureAccount, migrate, openDatabase } from "@/server/database";
import { createEvent } from "@/server/events-repository";
import {
  GuestLimitError,
  addGuest,
  checkInGuest,
  getAttendance,
  getGuest,
  importGuests,
  listAudit,
  listGuests,
  renameGuest,
  undoCheckIn,
} from "@/server/guests-repository";
import { issueReceipt, readReceipt } from "@/server/receipts";
import { asAccount } from "@/server/scope";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const NOWHERE = "33333333-3333-4333-8333-333333333333";
const batch = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ev = (name: string) => ({ name, date: "2027-06-18", location: "Test Hall", description: null });

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

/** Every guest's current state must equal the last thing the audit history says, and the history must alternate. */
async function assertConsistent(eventId: string, account = A) {
  const guests = await listGuests(db, account, eventId);
  const rows = (
    await db.query<{ guest_id: string; action: string }>(
      "select guest_id, action from audit_events where event_id = $1 and guest_id is not null order by seq",
      [eventId],
    )
  ).rows;
  for (const g of guests) {
    const mine = rows.filter((r) => r.guest_id === g.id && ["checked_in", "checked_in_again", "check_in_undone"].includes(r.action)).map((r) => r.action);
    let state = false;
    mine.forEach((action, i) => {
      const sets = action !== "check_in_undone";
      expect(sets, `audit step ${i} for a guest repeats the previous state`).toBe(!state);
      expect(action).toBe(sets ? (i === 0 ? "checked_in" : "checked_in_again") : "check_in_undone");
      state = sets;
    });
    expect(g.checkedInAt !== null, "stored state must match the last audit action").toBe(state);
  }
  const att = await getAttendance(db, account, eventId);
  expect(att).toEqual({ total: guests.length, checkedIn: guests.filter((g) => g.checkedInAt).length, notCheckedIn: guests.filter((g) => !g.checkedInAt).length });
}

describe("importing guests", () => {
  it("imports all names into the selected event, in order, as separate guests", async () => {
    const names = ["Alex Example", "Bea Example", "Alex Example", "Cal Example"];
    const r = await importGuests(db, A, eventA1, batch(1), names);
    expect(r).toEqual({ status: "imported", count: 4 });
    const guests = await listGuests(db, A, eventA1);
    expect(guests.map((g) => g.name)).toEqual(["Alex Example", "Alex Example", "Bea Example", "Cal Example"]); // identical names are not merged
    expect(new Set(guests.map((g) => g.id)).size).toBe(4);
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 4, checkedIn: 0, notCheckedIn: 4 });
    expect(await listGuests(db, A, eventA2)).toEqual([]);
    const tagged = await db.query("select count(*)::int as c from guests where import_batch_id = $1", [batch(1)]);
    expect(tagged.rows[0]).toEqual({ c: 4 });
  });

  it("records one audit event with the count and batch id and no names", async () => {
    await importGuests(db, A, eventA1, batch(1), ["Secretive Name", "Another Name"]);
    const { rows } = await db.query<{ action: string; detail: unknown; guest_id: string | null }>("select action, detail, guest_id from audit_events where action = 'guests_imported'");
    expect(rows).toEqual([{ action: "guests_imported", detail: { count: 2, batch_id: batch(1) }, guest_id: null }]);
    expect(JSON.stringify((await db.query("select * from audit_events")).rows)).not.toMatch(/Secretive|Another Name/);
  });

  it("a repeated submission of the same confirmation imports once and reports the first result", async () => {
    const first = await importGuests(db, A, eventA1, batch(1), ["A One", "B Two"]);
    const second = await importGuests(db, A, eventA1, batch(1), ["A One", "B Two"]);
    expect(first.status).toBe("imported");
    expect(second).toEqual({ status: "already_imported", count: 2 });
    expect((await listGuests(db, A, eventA1)).length).toBe(2);
    expect((await db.query("select count(*)::int as c from audit_events where action = 'guests_imported'")).rows[0]).toEqual({ c: 1 });
  });

  it("a burst of identical submissions imports exactly once", async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => importGuests(db, A, eventA1, batch(7), ["P One", "P Two", "P Three"])));
    expect(results.filter((r) => r.status === "imported").length).toBe(1);
    expect(results.filter((r) => r.status === "already_imported").length).toBe(5);
    expect((await listGuests(db, A, eventA1)).length).toBe(3);
  });

  it("the same submission id cannot be replayed into a different event", async () => {
    await importGuests(db, A, eventA1, batch(1), ["One"]);
    expect((await importGuests(db, A, eventA2, batch(1), ["Two"])).status).toBe("already_imported");
    expect(await listGuests(db, A, eventA2)).toEqual([]);
  });

  it("a second, different import of the same names adds them again (explicit confirmation is the safeguard)", async () => {
    await importGuests(db, A, eventA1, batch(1), ["Same Name"]);
    await importGuests(db, A, eventA1, batch(2), ["Same Name"]);
    expect((await listGuests(db, A, eventA1)).map((g) => g.name)).toEqual(["Same Name", "Same Name"]);
  });

  it("rolls back everything when something fails part-way: no guests, no batch, no audit, and a retry works", async () => {
    await db.exec(`
      create function fail_audit() returns trigger language plpgsql as $$ begin raise exception 'simulated failure'; end; $$;
      create trigger fail_audit before insert on audit_events for each row execute function fail_audit();`);
    await expect(importGuests(db, A, eventA1, batch(1), ["One", "Two", "Three"])).rejects.toThrow(/simulated failure/);
    await db.exec("drop trigger fail_audit on audit_events");
    expect(await listGuests(db, A, eventA1)).toEqual([]);
    expect((await db.query("select count(*)::int as c from import_batches")).rows[0]).toEqual({ c: 0 });
    expect((await db.query("select count(*)::int as c from audit_events where action = 'guests_imported'")).rows[0]).toEqual({ c: 0 });
    expect((await importGuests(db, A, eventA1, batch(1), ["One", "Two", "Three"])).status).toBe("imported"); // same id is usable again
  });

  it("refuses to import into an unknown event, another account's event, or with a bad id, and writes nothing", async () => {
    expect((await importGuests(db, A, NOWHERE, batch(1), ["X"])).status).toBe("event_not_found");
    expect((await importGuests(db, A, eventB1, batch(2), ["X"])).status).toBe("event_not_found"); // account A, B's event
    expect((await importGuests(db, B, eventA1, batch(3), ["X"])).status).toBe("event_not_found"); // account B, A's event
    expect((await importGuests(db, A, "nope", batch(4), ["X"])).status).toBe("event_not_found");
    expect((await importGuests(db, A, eventA1, "nope", ["X"])).status).toBe("event_not_found");
    expect((await importGuests(db, A, eventA1, batch(5), [])).status).toBe("event_not_found");
    expect((await db.query("select (select count(*) from guests)::int as g, (select count(*) from import_batches)::int as b")).rows[0]).toEqual({ g: 0, b: 0 });
  });

  it("enforces the per-event guest limit exactly, rolling back an import that would exceed it", async () => {
    const fill = (from: number, n: number) => Array.from({ length: n }, (_, i) => `Guest ${from + i}`);
    for (let i = 0; i < 4; i++) expect((await importGuests(db, A, eventA1, batch(10 + i), fill(i * 500, 500))).status).toBe("imported");
    expect((await getAttendance(db, A, eventA1)).total).toBe(MAX_GUESTS_PER_EVENT);
    await expect(importGuests(db, A, eventA1, batch(20), ["One more"])).rejects.toBeInstanceOf(GuestLimitError);
    await expect(addGuest(db, A, eventA1, "One more")).rejects.toBeInstanceOf(GuestLimitError);
    expect((await getAttendance(db, A, eventA1)).total).toBe(MAX_GUESTS_PER_EVENT);
    expect((await db.query("select count(*)::int as c from import_batches where id = $1", [batch(20)])).rows[0]).toEqual({ c: 0 }); // no orphan batch
  }, 120000);

  it("a batch cannot be attached to a guest of another account (composite foreign key)", async () => {
    await importGuests(db, A, eventA1, batch(1), ["One"]);
    await expect(db.query("insert into guests (account_id, event_id, name, import_batch_id) values ($1, $2, 'x', $3)", [B, eventB1, batch(1)])).rejects.toThrow(/foreign key/);
  });
});

describe("editing a guest's name", () => {
  it("changes only the name: id, check-in state and earlier history stay", async () => {
    const g = (await addGuest(db, A, eventA1, "Alx Example"))!;
    const done = await checkInGuest(db, A, eventA1, g.id);
    const r = await renameGuest(db, A, eventA1, g.id, "Alex Example");
    expect(r.status).toBe("renamed");
    const after = (await getGuest(db, A, eventA1, g.id))!;
    expect(after.id).toBe(g.id);
    expect(after.name).toBe("Alex Example");
    expect(after.createdAt).toBe(g.createdAt);
    expect(after.checkedInAt).toBe(done.status === "checked_in" ? done.guest.checkedInAt : "x");
    const actions = (await db.query<{ action: string }>("select action from audit_events where guest_id = $1 order by seq", [g.id])).rows.map((r) => r.action);
    expect(actions).toEqual(["guest_added", "checked_in", "guest_renamed"]);
    expect((await db.query("select count(*)::int as c from check_in_log where guest_id = $1", [g.id])).rows[0]).toEqual({ c: 1 });
    await assertConsistent(eventA1);
  });

  it("saying the same name again changes and records nothing", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    expect((await renameGuest(db, A, eventA1, g.id, "Alex")).status).toBe("unchanged");
    expect((await db.query("select count(*)::int as c from audit_events where action = 'guest_renamed'")).rows[0]).toEqual({ c: 0 });
  });

  it("the audit record never contains the old or new name", async () => {
    const g = (await addGuest(db, A, eventA1, "Old Secret Name"))!;
    await renameGuest(db, A, eventA1, g.id, "New Secret Name");
    expect(JSON.stringify((await db.query("select * from audit_events")).rows)).not.toMatch(/Secret Name/);
  });

  it("cannot rename a guest through another event or account, and nothing is recorded", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    expect((await renameGuest(db, A, eventA2, g.id, "Hijack")).status).toBe("not_found");
    expect((await renameGuest(db, B, eventA1, g.id, "Hijack")).status).toBe("not_found");
    expect((await renameGuest(db, A, eventA1, NOWHERE, "Hijack")).status).toBe("not_found");
    expect((await renameGuest(db, A, eventA1, "nope", "Hijack")).status).toBe("not_found");
    expect((await getGuest(db, A, eventA1, g.id))!.name).toBe("Alex");
    expect((await db.query("select count(*)::int as c from audit_events where action = 'guest_renamed'")).rows[0]).toEqual({ c: 0 });
  });
});

describe("undoing a check-in", () => {
  it("returns the guest to not checked in, updates the totals, and keeps the original check-in in the history", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await addGuest(db, A, eventA1, "Bea");
    await checkInGuest(db, A, eventA1, g.id);
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 2, checkedIn: 1, notCheckedIn: 1 });
    const r = await undoCheckIn(db, A, eventA1, g.id);
    expect(r.status).toBe("undone");
    expect(r.status === "undone" && r.guest.checkedInAt).toBeNull();
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 2, checkedIn: 0, notCheckedIn: 2 });
    const actions = (await db.query<{ action: string }>("select action from audit_events where guest_id = $1 order by seq", [g.id])).rows.map((r) => r.action);
    expect(actions).toEqual(["guest_added", "checked_in", "check_in_undone"]);
    expect((await db.query("select outcome from check_in_log where guest_id = $1", [g.id])).rows).toEqual([{ outcome: "checked_in" }]); // the original evidence is untouched
    await assertConsistent(eventA1);
  });

  it("a repeated undo is safe and records nothing more", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await checkInGuest(db, A, eventA1, g.id);
    expect((await undoCheckIn(db, A, eventA1, g.id)).status).toBe("undone");
    expect((await undoCheckIn(db, A, eventA1, g.id)).status).toBe("not_checked_in");
    expect((await undoCheckIn(db, A, eventA1, g.id)).status).toBe("not_checked_in");
    expect((await db.query("select count(*)::int as c from audit_events where action = 'check_in_undone'")).rows[0]).toEqual({ c: 1 });
    expect((await undoCheckIn(db, A, eventA1, (await addGuest(db, A, eventA1, "Never in"))!.id)).status).toBe("not_checked_in");
  });

  it("allows a later legitimate check-in, recorded as a separate 'checked in again' event with a new time", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    const first = await checkInGuest(db, A, eventA1, g.id);
    await undoCheckIn(db, A, eventA1, g.id);
    await new Promise((r) => setTimeout(r, 15));
    const again = await checkInGuest(db, A, eventA1, g.id);
    expect(again.status).toBe("checked_in");
    if (first.status === "checked_in" && again.status === "checked_in") expect(Date.parse(again.guest.checkedInAt!)).toBeGreaterThan(Date.parse(first.guest.checkedInAt!));
    const actions = (await db.query<{ action: string }>("select action from audit_events where guest_id = $1 order by seq", [g.id])).rows.map((r) => r.action);
    expect(actions).toEqual(["guest_added", "checked_in", "check_in_undone", "checked_in_again"]);
    expect(await getAttendance(db, A, eventA1)).toEqual({ total: 1, checkedIn: 1, notCheckedIn: 0 });
    await assertConsistent(eventA1);
  });

  it("a repeated check-in after an undo still reports 'already' and adds no audit event", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await checkInGuest(db, A, eventA1, g.id);
    await undoCheckIn(db, A, eventA1, g.id);
    await checkInGuest(db, A, eventA1, g.id);
    expect((await checkInGuest(db, A, eventA1, g.id)).status).toBe("already_checked_in");
    expect((await db.query("select count(*)::int as c from audit_events where guest_id = $1", [g.id])).rows[0]).toEqual({ c: 4 });
  });

  it("is refused for unknown guests, other events and other accounts, changing nothing", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await checkInGuest(db, A, eventA1, g.id);
    expect((await undoCheckIn(db, A, eventA2, g.id)).status).toBe("not_found");
    expect((await undoCheckIn(db, B, eventA1, g.id)).status).toBe("not_found");
    expect((await undoCheckIn(db, B, eventB1, g.id)).status).toBe("not_found");
    expect((await undoCheckIn(db, A, eventA1, NOWHERE)).status).toBe("not_found");
    expect((await undoCheckIn(db, A, eventA1, "nope")).status).toBe("not_found");
    expect((await undoCheckIn(db, A, "nope", g.id)).status).toBe("not_found");
    expect((await getGuest(db, A, eventA1, g.id))!.checkedInAt).not.toBeNull();
    await assertConsistent(eventA1);
  });

  it("still separates events and accounts with row-level security switched off", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await checkInGuest(db, A, eventA1, g.id);
    await db.exec("alter table guests disable row level security; alter table audit_events disable row level security");
    expect((await undoCheckIn(db, A, eventA2, g.id)).status).toBe("not_found");
    expect((await undoCheckIn(db, B, eventA1, g.id)).status).toBe("not_found");
    expect((await renameGuest(db, B, eventA1, g.id, "Hijack")).status).toBe("not_found");
    expect((await importGuests(db, B, eventA1, batch(1), ["X"])).status).toBe("event_not_found");
    expect((await listAudit(db, B, eventA1)).total).toBe(0);
  });
});

// On PGlite these run one after another on a single connection: they show the final state is consistent whatever the
// order, not that overlapping real connections are safe.
describe("interleaved attendance actions", () => {
  it("interleaved check-ins and undos on one guest leave state and history consistent", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    const ops = Array.from({ length: 40 }, (_, i) => (i % 3 === 0 ? undoCheckIn(db, A, eventA1, g.id) : checkInGuest(db, A, eventA1, g.id)));
    await Promise.all(ops);
    await assertConsistent(eventA1);
  });

  it("mixed operations across several guests keep every guest and the totals consistent", async () => {
    const guests = await Promise.all(Array.from({ length: 6 }, (_, i) => addGuest(db, A, eventA1, `Guest ${i}`)));
    const ops: Promise<unknown>[] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 90; i++) {
      const g = guests[Math.floor(rnd() * guests.length)]!;
      const pick = rnd();
      ops.push(pick < 0.5 ? checkInGuest(db, A, eventA1, g.id) : pick < 0.85 ? undoCheckIn(db, A, eventA1, g.id) : renameGuest(db, A, eventA1, g.id, `Renamed ${i}`));
    }
    await Promise.all(ops);
    await assertConsistent(eventA1);
  });

  it("after a burst, a normal check-in and undo still work", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await Promise.all(Array.from({ length: 10 }, () => checkInGuest(db, A, eventA1, g.id)));
    expect((await undoCheckIn(db, A, eventA1, g.id)).status).toBe("undone");
    expect((await checkInGuest(db, A, eventA1, g.id)).status).toBe("checked_in");
    await assertConsistent(eventA1);
  });
});

describe("audit history", () => {
  it("lists events newest first with strictly increasing sequence numbers and the full set of actions", async () => {
    await importGuests(db, A, eventA1, batch(1), ["Imported One", "Imported Two"]);
    const g = (await addGuest(db, A, eventA1, "Added Guest"))!;
    await renameGuest(db, A, eventA1, g.id, "Renamed Guest");
    await checkInGuest(db, A, eventA1, g.id);
    await undoCheckIn(db, A, eventA1, g.id);
    await checkInGuest(db, A, eventA1, g.id);
    const { entries, total } = await listAudit(db, A, eventA1);
    expect(total).toBe(6);
    expect(entries.map((e) => e.action)).toEqual(["checked_in_again", "check_in_undone", "checked_in", "guest_renamed", "guest_added", "guests_imported"]);
    const seqs = entries.map((e) => e.seq);
    expect([...seqs].sort((a, b) => b - a)).toEqual(seqs);
    expect(new Set(seqs).size).toBe(seqs.length);
    const times = entries.map((e) => Date.parse(e.occurredAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(entries.find((e) => e.action === "guests_imported")?.count).toBe(2);
    expect(entries.find((e) => e.action === "guest_renamed")?.guestName).toBe("Renamed Guest"); // current name, looked up for display
    expect(entries.every((e) => e.actor.includes("not a verified person"))).toBe(true);
  });

  it("numbers records within the event (1, 2, 3 ...), so one account cannot infer another's activity", async () => {
    for (let i = 0; i < 3; i++) await addGuest(db, B, eventB1, `Other ${i}`); // activity elsewhere moves the database-wide counter
    await addGuest(db, A, eventA1, "Alex");
    await addGuest(db, A, eventA1, "Bea");
    await addGuest(db, A, eventA2, "Cal");
    expect((await listAudit(db, A, eventA1)).entries.map((e) => e.seq)).toEqual([2, 1]);
    expect((await listAudit(db, A, eventA2)).entries.map((e) => e.seq)).toEqual([1]);
    expect((await listAudit(db, B, eventB1)).entries.map((e) => e.seq)).toEqual([3, 2, 1]);
  });

  it("never shows another event's or account's history", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await checkInGuest(db, A, eventA1, g.id);
    await addGuest(db, B, eventB1, "Bea");
    expect((await listAudit(db, A, eventA1)).total).toBe(2);
    expect((await listAudit(db, A, eventA2)).total).toBe(0);
    expect((await listAudit(db, B, eventA1)).total).toBe(0);
    expect((await listAudit(db, B, eventB1)).total).toBe(1);
    expect((await listAudit(db, A, "nope")).entries).toEqual([]);
    expect((await listAudit(db, A, NOWHERE)).entries).toEqual([]);
  });

  it("is limited to a page size but still reports the total", async () => {
    for (let i = 0; i < 5; i++) await addGuest(db, A, eventA1, `Guest ${i}`);
    const { entries, total } = await listAudit(db, A, eventA1, 3);
    expect(entries.length).toBe(3);
    expect(total).toBe(5);
    expect(entries[0].seq).toBeGreaterThan(entries[2].seq);
  });

  it("holds no names or personal text in any audit row", async () => {
    const g = (await addGuest(db, A, eventA1, "Unique Person Name"))!;
    await checkInGuest(db, A, eventA1, g.id);
    await renameGuest(db, A, eventA1, g.id, "Another Unique Name");
    await importGuests(db, A, eventA1, batch(1), ["Third Unique Name"]);
    expect(JSON.stringify((await db.query("select * from audit_events")).rows)).not.toMatch(/Unique/);
    const cols = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_name = 'audit_events'")).rows.map((r) => r.column_name).sort();
    expect(cols).toEqual(["account_id", "action", "actor", "detail", "event_id", "guest_id", "id", "occurred_at", "seq", "tx_id"]);
  });
});

describe("database rules for the new tables", () => {
  const inRole = (accountId: string | null, sql: string, params: unknown[] = []) =>
    db.transaction(async (tx) => {
      await tx.exec("set local role events_app");
      if (accountId) await tx.query("select set_config('app.account_id', $1, true)", [accountId]);
      return tx.query(sql, params);
    });

  it("audit history cannot be updated or deleted by the application role or even the database owner", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await expect(inRole(A, "update audit_events set action = 'checked_in'")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "delete from audit_events")).rejects.toThrow(/permission denied/);
    await expect(db.query("update audit_events set action = 'checked_in' where guest_id = $1", [g.id])).rejects.toThrow(/append-only/);
    await expect(db.query("delete from audit_events")).rejects.toThrow(/append-only/);
    expect((await listAudit(db, A, eventA1)).total).toBe(1);
  });

  it("audit rows accept only known actions, only the demo-operator actor, and only small non-personal detail", async () => {
    const base = [A, eventA1];
    await expect(db.query("insert into audit_events (account_id, event_id, action) values ($1, $2, 'deleted_everything')", base)).rejects.toThrow(/check/);
    await expect(db.query("insert into audit_events (account_id, event_id, action, actor) values ($1, $2, 'guest_added', 'Jane Smith')", base)).rejects.toThrow(/check/);
    await expect(db.query(`insert into audit_events (account_id, event_id, action, detail) values ($1, $2, 'guests_imported', '{"name": "Jane"}')`, base)).rejects.toThrow(/check/);
    await expect(db.query(`insert into audit_events (account_id, event_id, action, detail) values ($1, $2, 'guests_imported', '[1]')`, base)).rejects.toThrow(/check/);
  });

  it("audit rows must belong to a real guest and event of the same account", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await expect(db.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'checked_in')", [A, eventA2, g.id])).rejects.toThrow(/foreign key/);
    await expect(db.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'checked_in')", [B, eventA1, g.id])).rejects.toThrow(/foreign key/);
    await expect(db.query("insert into audit_events (account_id, event_id, action) values ($1, $2, 'guest_added')", [A, eventB1])).rejects.toThrow(/foreign key/);
  });

  it("the application role sees and writes only its own account's audit rows and import batches", async () => {
    await addGuest(db, A, eventA1, "Alex");
    await addGuest(db, B, eventB1, "Bea");
    await importGuests(db, B, eventB1, batch(1), ["X"]);
    expect((await inRole(A, "select count(*)::int as c from audit_events")).rows[0]).toEqual({ c: 1 });
    expect((await inRole(B, "select count(*)::int as c from audit_events")).rows[0]).toEqual({ c: 2 }); // B: one guest_added and one guests_imported
    expect((await inRole(A, "select count(*)::int as c from import_batches")).rows[0]).toEqual({ c: 0 });
    expect((await inRole(null, "select count(*)::int as c from audit_events")).rows[0]).toEqual({ c: 0 });
    await expect(inRole(A, "insert into audit_events (account_id, event_id, action) values ($1, $2, 'guest_added')", [B, eventB1])).rejects.toThrow(/row-level security|foreign key|violates/);
    await expect(inRole(A, "insert into import_batches (account_id, id, event_id, guest_count) values ($1, $2, $3, 1)", [B, batch(9), eventB1])).rejects.toThrow(/row-level security/);
  });

  it("a state or name change needs an audit record written in the same transaction, not an earlier one", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await checkInGuest(db, A, eventA1, g.id); // leaves a genuine 'checked_in' record from an EARLIER transaction
    await expect(db.query("update guests set checked_in_at = null where id = $1", [g.id])).rejects.toThrow(/without an audit record/);
    await expect(db.query("update guests set name = 'Sneaky' where id = $1", [g.id])).rejects.toThrow(/name change without an audit record/);
    // the wrong kind of record in the same transaction does not allow it either
    await expect(
      db.transaction(async (tx) => {
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'guest_renamed')", [A, eventA1, g.id]);
        await tx.query("update guests set checked_in_at = null where id = $1", [g.id]);
      }),
    ).rejects.toThrow(/without an audit record/);
    expect((await getGuest(db, A, eventA1, g.id))!.checkedInAt).not.toBeNull();
    expect((await getGuest(db, A, eventA1, g.id))!.name).toBe("Alex");
  });

  it("an undo needs an 'undone' record and a check-in needs a 'checked in' record", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await checkInGuest(db, A, eventA1, g.id);
    await expect(
      db.transaction(async (tx) => {
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'checked_in_again')", [A, eventA1, g.id]);
        await tx.query("update guests set checked_in_at = null where id = $1", [g.id]);
      }),
    ).rejects.toThrow(/without an audit record|without a matching change|out of order/);
    expect((await getGuest(db, A, eventA1, g.id))!.checkedInAt).not.toBeNull();
  });

  it("a guest cannot be created already checked in: not by the application role, and not by anyone without the audit record", async () => {
    await expect(inRole(A, "insert into guests (account_id, event_id, name, checked_in_at) values ($1, $2, 'Sneaky', now())", [A, eventA1])).rejects.toThrow(/permission denied/);
    await expect(db.query("insert into guests (account_id, event_id, name, checked_in_at) values ($1, $2, 'Sneaky', now())", [A, eventA1])).rejects.toThrow(/without an audit record/);
    expect(await listGuests(db, A, eventA1)).toEqual([]);
    // with its audit record in the same transaction the owner may (this is how a restore or import tool would have to do it)
    await db.transaction(async (tx) => {
      const g = await tx.query<{ id: string }>("insert into guests (account_id, event_id, name, checked_in_at) values ($1, $2, 'Legit', now()) returning id", [A, eventA1]);
      await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'checked_in')", [A, eventA1, g.rows[0].id]);
    });
    expect((await listGuests(db, A, eventA1)).map((g) => g.name)).toEqual(["Legit"]);
    // ... but the application role can still add an ordinary guest
    expect((await addGuest(db, A, eventA1, "Ordinary"))?.checkedInAt).toBeNull();
  });

  it("invented history is refused: an audit record must describe a change made in the same transaction", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    const forge = (action: string, as: "owner" | "app" = "app") => {
      const sql = "insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, $4)";
      return as === "app" ? inRole(A, sql, [A, eventA1, g.id, action]) : db.query(sql, [A, eventA1, g.id, action]);
    };
    for (const action of ["check_in_undone", "checked_in", "checked_in_again"]) await expect(forge(action), action).rejects.toThrow(/without a matching change|out of order/);
    await expect(forge("check_in_undone", "owner")).rejects.toThrow(/without a matching change|out of order/);
    // a guest who was never checked in cannot get an 'undone' record even if the row is touched in the same transaction;
    // a checked-in guest cannot get a second 'checked in' record, and cannot be 'undone' twice
    // an undo record for a guest that was merely renamed (not undone) is also refused
    await expect(
      db.transaction(async (tx) => {
        await tx.query("update guests set name = 'Alexa' where id = $1", [g.id]);
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'guest_renamed')", [A, eventA1, g.id]);
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'check_in_undone')", [A, eventA1, g.id]);
      }),
    ).rejects.toThrow(/out of order|without a matching change/);
    await checkInGuest(db, A, eventA1, g.id);
    await expect(
      db.transaction(async (tx) => {
        await tx.query("update guests set name = 'Alexa' where id = $1", [g.id]);
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'guest_renamed')", [A, eventA1, g.id]);
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'checked_in_again')", [A, eventA1, g.id]);
      }),
    ).rejects.toThrow(/out of order|without a matching change/);
    await undoCheckIn(db, A, eventA1, g.id);
    await expect(
      db.transaction(async (tx) => {
        await tx.query("update guests set name = 'Alexa' where id = $1", [g.id]);
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'guest_renamed')", [A, eventA1, g.id]);
        await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'check_in_undone')", [A, eventA1, g.id]);
      }),
    ).rejects.toThrow(/out of order|without a matching change/);
    expect((await listAudit(db, A, eventA1)).total).toBe(3); // only the genuine added, checked-in and undone records
    expect((await getGuest(db, A, eventA1, g.id))!.name).toBe("Alex");
  });

  it("the audit history cannot be emptied with TRUNCATE either", async () => {
    await addGuest(db, A, eventA1, "Alex");
    await expect(db.exec("truncate audit_events")).rejects.toThrow(/append-only/);
    expect((await listAudit(db, A, eventA1)).total).toBe(1);
  });

  it("an import batch can only be attached to guests of the same event", async () => {
    await importGuests(db, A, eventA1, batch(1), ["One"]);
    await expect(db.query("insert into guests (account_id, event_id, name, import_batch_id) values ($1, $2, 'x', $3)", [A, eventA2, batch(1)])).rejects.toThrow(/foreign key/);
  });

  it("the application role cannot reach the audit history of a guest it may not see, and cannot change ids", async () => {
    const g = (await addGuest(db, A, eventA1, "Alex"))!;
    await expect(inRole(A, "update guests set import_batch_id = $1 where id = $2", [batch(1), g.id])).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "update guests set created_at = now()")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "delete from import_batches")).rejects.toThrow(/permission denied/);
  });
});

describe("upgrading data made before the audit history existed", () => {
  const root = mkdtempSync(path.join(tmpdir(), "events-upgrade-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("gives existing guests and check-ins audit records so state and history agree", async () => {
    const early = path.join(root, "early");
    mkdirSync(early);
    for (const f of readdirSync("migrations").sort().filter((n) => !n.startsWith("0004"))) copyFileSync(path.join("migrations", f), path.join(early, f));
    const old = await openDatabaseAt(early);
    await ensureAccount(old, A, "Synthetic A");
    const e = await createEvent(old, A, ev("Old event"));
    await old.query("insert into guests (account_id, event_id, name) values ($1, $2, 'Old One'), ($1, $2, 'Old Two')", [A, e.id]);
    await old.query("update guests set checked_in_at = now() where name = 'Old One'");
    const applied = await migrate(old); // applies 0004 from the real folder
    expect(applied).toEqual(["0004_guest_management.sql"]);
    const actions = (await old.query<{ action: string }>("select action from audit_events order by seq")).rows.map((r) => r.action).sort();
    expect(actions).toEqual(["checked_in", "guest_added", "guest_added"]);
    await assertConsistentOn(old, e.id);
    expect((await undoCheckIn(old, A, e.id, (await listGuests(old, A, e.id)).find((g) => g.name === "Old One")!.id)).status).toBe("undone");
    await old.close();
  });

  async function openDatabaseAt(dir: string): Promise<PGlite> {
    const { PGlite: P } = await import("@electric-sql/pglite");
    const d = await P.create();
    await migrate(d, dir);
    return d;
  }
  async function assertConsistentOn(d: PGlite, eventId: string) {
    const guests = await listGuests(d, A, eventId);
    for (const g of guests) {
      const set = (await d.query("select 1 from audit_events where guest_id = $1 and action = 'checked_in'", [g.id])).rows.length > 0;
      expect(g.checkedInAt !== null).toBe(set);
    }
  }
});

describe("server-issued receipts (confirmation messages cannot be forged)", () => {
  it("returns the receipt for the event it was issued for", () => {
    const id = issueReceipt({ notice: "checked-in", eventId: eventA1, guestId: NOWHERE });
    expect(readReceipt(id, eventA1)).toEqual({ notice: "checked-in", eventId: eventA1, guestId: NOWHERE });
  });
  it("ignores invented, malformed, wrong-type and wrong-event ids", () => {
    const id = issueReceipt({ notice: "imported", eventId: eventA1, count: 3 });
    for (const forged of ["checked-in", "AAAAAAAAAAAAAAAAAAAAAA", "", "x".repeat(22), `${id}x`, id.slice(1), "<script>"]) expect(readReceipt(forged, eventA1)).toBeNull();
    for (const bad of [undefined, null, 5, ["a"], {}]) expect(readReceipt(bad, eventA1)).toBeNull();
    expect(readReceipt(id, eventA2)).toBeNull(); // belongs to a different event
  });
  it("expires after a minute", () => {
    vi.useFakeTimers();
    try {
      const id = issueReceipt({ notice: "added", eventId: eventA1 });
      expect(readReceipt(id, eventA1)).not.toBeNull();
      vi.advanceTimersByTime(61_000);
      expect(readReceipt(id, eventA1)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
  it("ids are long random strings and the store stays bounded", () => {
    const ids = Array.from({ length: 300 }, () => issueReceipt({ notice: "added", eventId: eventA1 }));
    expect(new Set(ids).size).toBe(300);
    expect(ids.every((i) => /^[A-Za-z0-9_-]{22}$/.test(i))).toBe(true);
    expect(readReceipt(ids[0], eventA1)).toBeNull(); // oldest dropped
    expect(readReceipt(ids[299], eventA1)).not.toBeNull();
  });
});

describe("scoping helper still applies to the new queries", () => {
  it("runs as the limited role", async () => {
    const who = await asAccount(db, A, async (tx) => (await tx.query<{ u: string }>("select current_user as u")).rows[0].u);
    expect(who).toBe("events_app");
  });
});

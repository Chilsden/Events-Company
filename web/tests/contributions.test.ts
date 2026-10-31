import type { PGlite } from "@electric-sql/pglite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Strokes } from "@/domain/signature";
import { ensureAccount, openDatabase } from "@/server/database";
import { createEvent } from "@/server/events-repository";
import { addGuest, listAudit } from "@/server/guests-repository";
import { ModuleDisabledError, listContributions, listEligibleContributions, revokeDisplayPermission, submitSignature } from "@/server/contributions-repository";
import { setModules } from "@/server/modules-repository";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const NOWHERE = "33333333-3333-4333-8333-333333333333";
const ev = (name: string) => ({ name, date: "2027-06-18", location: "Test Hall", description: null });
const STROKES: Strokes = [[[10, 10], [50, 40], [120, 20], [200, 90]], [[220, 30], [260, 80]]];
const PURPOSE = "mosaic_public_display_demo";

let db: PGlite;
let e1: string; // signatures only
let e2: string; // signatures and guest list
let eB: string; // other account, signatures

beforeEach(async () => {
  db = await openDatabase();
  await ensureAccount(db, A, "Synthetic A");
  await ensureAccount(db, B, "Synthetic B");
  e1 = (await createEvent(db, A, ev("Signatures only"))).id;
  e2 = (await createEvent(db, A, ev("Signatures and guests"))).id;
  eB = (await createEvent(db, B, ev("B event"))).id;
  await setModules(db, A, e1, { attendance: false });
  await setModules(db, A, e1, { guest_registration: false, signature: true });
  await setModules(db, A, e2, { signature: true });
  await setModules(db, B, eB, { signature: true });
});

const inRole = (accountId: string | null, sql: string, params: unknown[] = []) =>
  db.transaction(async (tx) => {
    await tx.exec("set local role events_app");
    if (accountId) await tx.query("select set_config('app.account_id', $1, true)", [accountId]);
    return tx.query(sql, params);
  });

describe("submitting a signature", () => {
  it("saves an anonymous signature: no guest, no name, no check-in needed, and no guest record is made up", async () => {
    const r = await submitSignature(db, A, e1, STROKES, "granted", null);
    expect(r.status).toBe("saved");
    const list = await listContributions(db, A, e1);
    expect(list.length).toBe(1);
    expect(list[0]).toMatchObject({ kind: "signature", linkedToGuest: false, status: "granted" });
    expect(list[0].strokes).toEqual(STROKES);
    expect((await db.query("select count(*)::int as c from guests")).rows[0]).toEqual({ c: 0 }); // no placeholder guest
    expect((await db.query("select guest_id from contributions")).rows).toEqual([{ guest_id: null }]);
  });

  it("works in an event with no guest list at all, and several anonymous signatures can follow one another", async () => {
    for (let i = 0; i < 3; i++) expect((await submitSignature(db, A, e1, STROKES, "granted", null)).status).toBe("saved");
    expect((await listContributions(db, A, e1)).length).toBe(3);
  });

  it("can be linked to a valid guest of the same event when the guest list is on", async () => {
    const g = (await addGuest(db, A, e2, "Alex Example"))!;
    const r = await submitSignature(db, A, e2, STROKES, "granted", g.id);
    expect(r.status).toBe("saved");
    expect((await listContributions(db, A, e2))[0].linkedToGuest).toBe(true);
    expect((await db.query("select guest_id from contributions")).rows).toEqual([{ guest_id: g.id }]);
  });

  it("refuses a guest that belongs to another event, another account, does not exist, or is malformed", async () => {
    const other = (await addGuest(db, A, e2, "Alex"))!;
    const e3 = (await createEvent(db, A, ev("Third"))).id;
    await setModules(db, A, e3, { signature: true });
    const foreign = (await addGuest(db, A, e3, "Bea"))!;
    const bGuest = (await addGuest(db, B, eB, "Cal"))!;
    for (const bad of [foreign.id, bGuest.id, NOWHERE, "nope", "1 or 1=1"]) {
      const r = await submitSignature(db, A, e2, STROKES, "granted", bad);
      expect(r.status, bad).toBe("invalid_guest");
    }
    expect(other.id).toBeTruthy();
    expect(await listContributions(db, A, e2)).toEqual([]);
  });

  it("refuses a guest link when the guest list is switched off", async () => {
    const g = (await addGuest(db, A, e2, "Alex"))!;
    await setModules(db, A, e2, { attendance: false });
    await setModules(db, A, e2, { guest_registration: false });
    const r = await submitSignature(db, A, e2, STROKES, "granted", g.id);
    expect(r.status).toBe("invalid_guest");
    expect((await submitSignature(db, A, e2, STROKES, "granted", null)).status).toBe("saved"); // anonymous still fine
  });

  it("the database also refuses a guest from another event (composite foreign key)", async () => {
    const g = (await addGuest(db, A, e2, "Alex"))!;
    await expect(
      db.transaction(async (tx) => {
        const c = await tx.query<{ id: string }>("insert into contributions (account_id, event_id, guest_id, kind, content) values ($1, $2, $3, 'signature', $4::jsonb) returning id", [A, e1, g.id, JSON.stringify({ v: 1, strokes: STROKES })]);
        await tx.query("insert into contribution_permissions (account_id, event_id, contribution_id, change, purpose, wording_version, provenance) values ($1, $2, $3, 'granted', $4, 'v', 'local_demo_operator_synthetic')", [A, e1, c.rows[0].id, PURPOSE]);
      }),
    ).rejects.toThrow(/foreign key/);
  });

  it("refuses an unknown event, another account's event and a malformed id, saving nothing", async () => {
    expect((await submitSignature(db, A, NOWHERE, STROKES, "granted", null)).status).toBe("event_not_found");
    expect((await submitSignature(db, A, eB, STROKES, "granted", null)).status).toBe("event_not_found");
    expect((await submitSignature(db, B, e1, STROKES, "granted", null)).status).toBe("event_not_found");
    expect((await submitSignature(db, A, "nope", STROKES, "granted", null)).status).toBe("event_not_found");
    expect((await db.query("select count(*)::int as c from contributions")).rows[0]).toEqual({ c: 0 });
  });

  it("is all or nothing: if recording fails part-way nothing is saved", async () => {
    await db.exec(`
      create function fail_audit() returns trigger language plpgsql as $$ begin raise exception 'simulated failure'; end; $$;
      create trigger fail_audit before insert on audit_events for each row execute function fail_audit();`);
    await expect(submitSignature(db, A, e1, STROKES, "granted", null)).rejects.toThrow(/simulated failure/);
    await db.exec("drop trigger fail_audit on audit_events");
    expect((await db.query("select (select count(*) from contributions)::int as c, (select count(*) from contribution_permissions)::int as p")).rows[0]).toEqual({ c: 0, p: 0 });
    expect((await submitSignature(db, A, e1, STROKES, "granted", null)).status).toBe("saved");
  });

  it("raises ModuleDisabledError (not a silent failure) when the module is off", async () => {
    await setModules(db, A, e1, { signature: false });
    await expect(submitSignature(db, A, e1, STROKES, "granted", null)).rejects.toBeInstanceOf(ModuleDisabledError);
  });
});

describe("display permission: explicit, purpose-specific, never assumed", () => {
  it("records the choice with purpose, wording version, provenance and time; the operator is not called a verified guest", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const { rows } = await db.query<Record<string, unknown>>("select change, purpose, wording_version, provenance, occurred_at from contribution_permissions");
    expect(rows.length).toBe(1);
    expect(rows[0]).toMatchObject({ change: "granted", purpose: PURPOSE, wording_version: "demo-v1", provenance: "local_demo_operator_synthetic" });
    expect(Number.isNaN(Date.parse(String(rows[0].occurred_at)))).toBe(false);
  });

  it("a 'no' is stored too, and that signature is not eligible for display", async () => {
    await submitSignature(db, A, e1, STROKES, "denied", null);
    expect((await listContributions(db, A, e1))[0].status).toBe("denied");
    expect(await listEligibleContributions(db, A, e1)).toEqual([]);
  });

  it("a contribution cannot be stored without an explicit choice recorded with it", async () => {
    await expect(
      db.query("insert into contributions (account_id, event_id, kind, content) values ($1, $2, 'signature', $3::jsonb)", [A, e1, JSON.stringify({ v: 1, strokes: STROKES })]),
    ).rejects.toThrow(/explicit display permission/);
    expect((await db.query("select count(*)::int as c from contributions")).rows[0]).toEqual({ c: 0 });
  });

  it("the choice must be 'granted' or 'denied' first; a first entry of 'revoked' is refused", async () => {
    await expect(
      db.transaction(async (tx) => {
        const c = await tx.query<{ id: string }>("insert into contributions (account_id, event_id, kind, content) values ($1, $2, 'signature', $3::jsonb) returning id", [A, e1, JSON.stringify({ v: 1, strokes: STROKES })]);
        await tx.query("insert into contribution_permissions (account_id, event_id, contribution_id, change, purpose, wording_version, provenance) values ($1, $2, $3, 'revoked', $4, 'v', 'local_demo_operator_synthetic')", [A, e1, c.rows[0].id, PURPOSE]);
      }),
    ).rejects.toThrow(/explicit display permission|out of order/);
  });

  it("only the synthetic demonstration purpose and provenance exist, so nothing here can pose as real consent", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const id = (await db.query<{ id: string }>("select id from contributions")).rows[0].id;
    const insert = (purpose: string, provenance: string) =>
      db.query("insert into contribution_permissions (account_id, event_id, contribution_id, change, purpose, wording_version, provenance) values ($1, $2, $3, 'revoked', $4, 'v', $5)", [A, e1, id, purpose, provenance]);
    await expect(insert("public_display", "local_demo_operator_synthetic")).rejects.toThrow(/check/);
    await expect(insert(PURPOSE, "guest_self")).rejects.toThrow(/check/);
    await expect(insert(PURPOSE, "verified_guest")).rejects.toThrow(/check/);
  });
});

describe("revoking display permission", () => {
  it("withdraws permission, keeps the signature, and removes it from downstream eligibility", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const [first] = await listContributions(db, A, e1);
    expect((await listEligibleContributions(db, A, e1)).length).toBe(2);
    expect(await revokeDisplayPermission(db, A, e1, first.id)).toEqual({ status: "revoked" });
    const after = await listContributions(db, A, e1);
    expect(after.find((c) => c.id === first.id)).toMatchObject({ status: "revoked" });
    expect(after.find((c) => c.id === first.id)!.strokes).toEqual(STROKES); // still there
    const eligible = await listEligibleContributions(db, A, e1);
    expect(eligible.length).toBe(1);
    expect(eligible.map((c) => c.id)).not.toContain(first.id);
  });

  it("a repeated revoke is safe and records nothing more; a 'denied' one has nothing to revoke", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    await submitSignature(db, A, e1, STROKES, "denied", null);
    const list = await listContributions(db, A, e1);
    const granted = list.find((c) => c.status === "granted")!;
    const denied = list.find((c) => c.status === "denied")!;
    expect((await revokeDisplayPermission(db, A, e1, granted.id)).status).toBe("revoked");
    expect(await revokeDisplayPermission(db, A, e1, granted.id)).toEqual({ status: "not_granted", current: "revoked" });
    expect(await revokeDisplayPermission(db, A, e1, denied.id)).toEqual({ status: "not_granted", current: "denied" });
    expect((await db.query("select count(*)::int as c from contribution_permissions where change = 'revoked'")).rows[0]).toEqual({ c: 1 });
    expect((await db.query("select count(*)::int as c from audit_events where action = 'display_permission_revoked'")).rows[0]).toEqual({ c: 1 });
  });

  it("a burst of revokes records exactly one", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const id = (await listContributions(db, A, e1))[0].id;
    const results = await Promise.all(Array.from({ length: 8 }, () => revokeDisplayPermission(db, A, e1, id)));
    expect(results.filter((r) => r.status === "revoked").length).toBe(1);
    expect((await db.query("select count(*)::int as c from contribution_permissions where change = 'revoked'")).rows[0]).toEqual({ c: 1 });
  });

  it("cannot be done through another event or account, or for an unknown or malformed id", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const id = (await listContributions(db, A, e1))[0].id;
    expect((await revokeDisplayPermission(db, A, e2, id)).status).toBe("not_found");
    expect((await revokeDisplayPermission(db, B, e1, id)).status).toBe("not_found");
    expect((await revokeDisplayPermission(db, B, eB, id)).status).toBe("not_found");
    expect((await revokeDisplayPermission(db, A, e1, NOWHERE)).status).toBe("not_found");
    expect((await revokeDisplayPermission(db, A, e1, "nope")).status).toBe("not_found");
    expect((await listContributions(db, A, e1))[0].status).toBe("granted");
  });

  it("revoking works even after the signature module has been switched off", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const id = (await listContributions(db, A, e1))[0].id;
    await setModules(db, A, e1, { signature: false });
    expect((await revokeDisplayPermission(db, A, e1, id)).status).toBe("revoked");
  });

  it("leaves a full consent history: the choice, then the withdrawal, in order, with an audit record", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const id = (await listContributions(db, A, e1))[0].id;
    await revokeDisplayPermission(db, A, e1, id);
    const history = await db.query<{ change: string; purpose: string; seq: string }>("select change, purpose, seq from contribution_permissions where contribution_id = $1 order by seq", [id]);
    expect(history.rows.map((r) => r.change)).toEqual(["granted", "revoked"]);
    const audit = (await listAudit(db, A, e1)).entries.map((e) => e.action);
    expect(audit).toEqual(["display_permission_revoked", "contribution_submitted", "module_enabled", "module_disabled", "module_disabled"]); // the last three are this event's set-up
    expect(JSON.stringify((await db.query("select * from audit_events")).rows)).not.toMatch(/Alex|signature":/i);
  });
});

describe("what other products may use (eligibility)", () => {
  it("includes only 'granted' signatures of the asked-for event and account", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null); // eligible
    await submitSignature(db, A, e1, STROKES, "denied", null); // said no
    await submitSignature(db, A, e1, STROKES, "granted", null); // will be revoked
    await submitSignature(db, A, e2, STROKES, "granted", null); // other event
    await submitSignature(db, B, eB, STROKES, "granted", null); // other account
    const revokedId = (await listContributions(db, A, e1)).filter((c) => c.status === "granted")[0].id;
    await revokeDisplayPermission(db, A, e1, revokedId);
    expect((await listEligibleContributions(db, A, e1)).length).toBe(1);
    expect((await listEligibleContributions(db, A, e2)).length).toBe(1);
    expect((await listEligibleContributions(db, B, eB)).length).toBe(1);
    expect(await listEligibleContributions(db, A, eB)).toEqual([]);
    expect(await listEligibleContributions(db, B, e1)).toEqual([]);
    expect(await listEligibleContributions(db, A, "nope")).toEqual([]);
  });

  it("the database view itself applies the rule, and row-level security applies to whoever reads it", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    await submitSignature(db, A, e1, STROKES, "denied", null);
    expect((await db.query("select count(*)::int as c from eligible_contributions")).rows[0]).toEqual({ c: 1 });
    expect((await inRole(A, "select count(*)::int as c from eligible_contributions")).rows[0]).toEqual({ c: 1 });
    expect((await inRole(B, "select count(*)::int as c from eligible_contributions")).rows[0]).toEqual({ c: 0 });
    expect((await inRole(null, "select count(*)::int as c from eligible_contributions")).rows[0]).toEqual({ c: 0 });
  });

  it("does not depend on the signature module still being on", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    await setModules(db, A, e1, { signature: false });
    expect((await listEligibleContributions(db, A, e1)).length).toBe(1); // permission, not configuration, decides
  });
});

describe("safe content and database rules", () => {
  const withPermission = (event: string, kind: string, content: unknown, storage: string | null = null) =>
    db.transaction(async (tx) => {
      const c = await tx.query<{ id: string }>("insert into contributions (account_id, event_id, kind, content, storage_ref) values ($1, $2, $3, $4::jsonb, $5) returning id", [A, event, kind, content === null ? null : JSON.stringify(content), storage]);
      await tx.query("insert into contribution_permissions (account_id, event_id, contribution_id, change, purpose, wording_version, provenance) values ($1, $2, $3, 'granted', $4, 'v', 'local_demo_operator_synthetic')", [A, event, c.rows[0].id, PURPOSE]);
    });

  it("the database refuses a signature that is anything but strokes: markup, extra fields, wrong types, no strokes, too many", async () => {
    await expect(withPermission(e1, "signature", { v: 1, strokes: STROKES, svg: "<svg onload=alert(1)>" })).rejects.toThrow(/check/);
    await expect(withPermission(e1, "signature", { v: 1, html: "<script>" })).rejects.toThrow(/check/);
    await expect(withPermission(e1, "signature", { v: 1, strokes: "<svg>" })).rejects.toThrow(/check/);
    await expect(withPermission(e1, "signature", { v: 1, strokes: [] })).rejects.toThrow(/check/);
    await expect(withPermission(e1, "signature", "just text")).rejects.toThrow(/check/);
    await expect(withPermission(e1, "signature", { v: 1, strokes: Array.from({ length: 51 }, () => STROKES[0]) })).rejects.toThrow(/check/);
    await expect(withPermission(e1, "signature", null)).rejects.toThrow(/check/);
    await expect(withPermission(e1, "signature", { v: 1, strokes: STROKES }, "also-a-file")).rejects.toThrow(/check/); // content and storage together
  });

  it("the database refuses an oversized signature", async () => {
    const big = Array.from({ length: 50 }, () => Array.from({ length: 1500 }, (_, i) => [i % 600, (i * 7) % 240]));
    await expect(withPermission(e1, "signature", { v: 1, strokes: big })).rejects.toThrow(/check/);
  });

  it("stored data that fails the check (written behind the application's back) is never drawn: hostile text cannot reach the picture", async () => {
    // the database only checks the shape of the data; the application checks the numbers, and again before drawing
    await withPermission(e1, "signature", { v: 1, strokes: [[["<img src=x onerror=alert(1)>", 1], [2, 3], [4, 5]]] });
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const list = await listContributions(db, A, e1);
    expect(list.length).toBe(2);
    expect(list.filter((c) => c.strokes === null).length).toBe(1); // the hostile one is shown as "could not be shown"
    expect(JSON.stringify(list)).not.toMatch(/<img|onerror/);
    const good = list.find((c) => c.strokes !== null)!;
    expect(JSON.stringify(good.strokes)).toMatch(/^[\[\],.0-9]+$/);
  });

  it("contributions and permission history cannot be changed, deleted or truncated, by the application role or the owner", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    await expect(inRole(A, "update contributions set kind = 'drawing'")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "delete from contributions")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "update contribution_permissions set change = 'granted'")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "delete from contribution_permissions")).rejects.toThrow(/permission denied/);
    await expect(db.query("update contributions set content = '{}'::jsonb")).rejects.toThrow(/cannot be changed or removed/);
    await expect(db.query("delete from contributions")).rejects.toThrow(/cannot be changed or removed/);
    await expect(db.exec("truncate contributions cascade")).rejects.toThrow(/cannot be changed or removed|truncate/);
    await expect(db.query("update contribution_permissions set change = 'granted'")).rejects.toThrow(/append-only/);
    await expect(db.query("delete from contribution_permissions")).rejects.toThrow(/append-only/);
    await expect(db.exec("truncate contribution_permissions")).rejects.toThrow(/append-only|truncate/);
    expect((await listContributions(db, A, e1)).length).toBe(1);
  });

  it("row-level security: each account sees only its own contributions and permission history", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    await submitSignature(db, B, eB, STROKES, "granted", null);
    expect((await inRole(A, "select count(*)::int as c from contributions")).rows[0]).toEqual({ c: 1 });
    expect((await inRole(B, "select count(*)::int as c from contributions")).rows[0]).toEqual({ c: 1 });
    expect((await inRole(null, "select count(*)::int as c from contributions")).rows[0]).toEqual({ c: 0 });
    expect((await inRole(A, "select count(*)::int as c from contribution_permissions")).rows[0]).toEqual({ c: 1 });
    expect((await inRole(null, "select count(*)::int as c from contribution_permissions")).rows[0]).toEqual({ c: 0 });
    await expect(inRole(A, "insert into contributions (account_id, event_id, kind, content) values ($1, $2, 'signature', $3::jsonb)", [B, eB, JSON.stringify({ v: 1, strokes: STROKES })])).rejects.toThrow(/row-level security|explicit display permission|not enabled/);
  });

  it("still separates events and accounts with row-level security switched off (the queries filter on their own)", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    await submitSignature(db, B, eB, STROKES, "granted", null);
    await db.exec("alter table contributions disable row level security; alter table contribution_permissions disable row level security");
    expect((await listContributions(db, A, e1)).length).toBe(1);
    expect(await listContributions(db, A, e2)).toEqual([]);
    expect(await listContributions(db, A, eB)).toEqual([]);
    expect(await listContributions(db, B, e1)).toEqual([]);
    expect(await listEligibleContributions(db, A, eB)).toEqual([]);
    const id = (await listContributions(db, B, eB))[0].id;
    expect((await revokeDisplayPermission(db, A, e1, id)).status).toBe("not_found");
    expect((await revokeDisplayPermission(db, A, eB, id)).status).toBe("not_found");
  });

  it("the application role has no way to write the source, the actor or the creation time", async () => {
    await expect(inRole(A, "insert into contributions (account_id, event_id, kind, content, actor) values ($1, $2, 'signature', '{}', 'Jane Smith')", [A, e1])).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "insert into contributions (account_id, event_id, kind, content, created_at) values ($1, $2, 'signature', '{}', now() - interval '1 year')", [A, e1])).rejects.toThrow(/permission denied/);
  });

  it("an audit record about a contribution must describe a real change in the same transaction", async () => {
    await submitSignature(db, A, e1, STROKES, "granted", null);
    const id = (await listContributions(db, A, e1))[0].id;
    await expect(db.query("insert into audit_events (account_id, event_id, contribution_id, action) values ($1, $2, $3, 'display_permission_revoked')", [A, e1, id])).rejects.toThrow(/without a matching change/);
    await expect(db.query("insert into audit_events (account_id, event_id, contribution_id, action) values ($1, $2, $3, 'contribution_submitted')", [A, e1, id])).rejects.toThrow(/without a matching change/);
    await expect(inRole(A, "insert into audit_events (account_id, event_id, action) values ($1, $2, 'contribution_submitted')", [A, e1])).rejects.toThrow(/without a matching change/);
  });
});

describe("persistence", () => {
  const root = mkdtempSync(path.join(tmpdir(), "events-contributions-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("keeps configuration, signatures, permission history and revocations after the database is closed and reopened", async () => {
    const dir = path.join(root, "pglite");
    const first = await openDatabase(dir);
    await ensureAccount(first, A, "Synthetic A");
    const event = (await createEvent(first, A, ev("Persisted"))).id;
    await setModules(first, A, event, { attendance: false });
    await setModules(first, A, event, { guest_registration: false, signature: true });
    await submitSignature(first, A, event, STROKES, "granted", null);
    await submitSignature(first, A, event, STROKES, "granted", null);
    await revokeDisplayPermission(first, A, event, (await listContributions(first, A, event))[0].id);
    await first.close();

    const second = await openDatabase(dir);
    const { getModuleSettings } = await import("@/server/modules-repository");
    expect(await getModuleSettings(second, A, event)).toMatchObject({ guest_registration: false, attendance: false, signature: true });
    const list = await listContributions(second, A, event);
    expect(list.map((c) => c.status).sort()).toEqual(["granted", "revoked"]);
    expect(list.every((c) => JSON.stringify(c.strokes) === JSON.stringify(STROKES))).toBe(true);
    expect((await listEligibleContributions(second, A, event)).length).toBe(1);
    expect((await submitSignature(second, A, event, STROKES, "granted", null)).status).toBe("saved"); // still accepting
    await second.close();
  });
});

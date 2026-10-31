import { PGlite } from "@electric-sql/pglite";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { IMPLEMENTED_KEYS, MODULES, MODULE_KEYS, PRESETS, checkDesired, type ModuleSettings } from "@/domain/modules";
import { ensureAccount, migrate, openDatabase } from "@/server/database";
import { createEvent } from "@/server/events-repository";
import { addGuest, checkInGuest, getGuest, importGuests, listAudit, listGuests, renameGuest, undoCheckIn } from "@/server/guests-repository";
import { ModuleDisabledError, getModuleSettings, getModules, setModules } from "@/server/modules-repository";
import { submitSignature, listContributions } from "@/server/contributions-repository";
import { asAccount } from "@/server/scope";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const NOWHERE = "33333333-3333-4333-8333-333333333333";
const ev = (name: string) => ({ name, date: "2027-06-18", location: "Test Hall", description: null });
const STROKES = [[[10, 10], [50, 40], [120, 20], [200, 90]]] as [number, number][][];

let db: PGlite;
let e1: string;
let e2: string;
let eB: string;

beforeEach(async () => {
  db = await openDatabase();
  await ensureAccount(db, A, "Synthetic A");
  await ensureAccount(db, B, "Synthetic B");
  e1 = (await createEvent(db, A, ev("Event one"))).id;
  e2 = (await createEvent(db, A, ev("Event two"))).id;
  eB = (await createEvent(db, B, ev("B event"))).id;
});

const inRole = (accountId: string | null, sql: string, params: unknown[] = []) =>
  db.transaction(async (tx) => {
    await tx.exec("set local role events_app");
    if (accountId) await tx.query("select set_config('app.account_id', $1, true)", [accountId]);
    return tx.query(sql, params);
  });

describe("module definitions", () => {
  it("lists eight modules; guest registration, attendance and signature are built, the rest are planned", () => {
    expect(MODULE_KEYS.length).toBe(8);
    expect(MODULES.map((m) => m.key)).toEqual([...MODULE_KEYS]);
    expect([...IMPLEMENTED_KEYS]).toEqual(["guest_registration", "attendance", "signature"]);
    expect(MODULES.filter((m) => !m.implemented).map((m) => m.key)).toEqual(["drawing", "photograph", "video", "text_message", "consent"]);
  });
  it("attendance needs the guest list", () => {
    const base = Object.fromEntries(MODULE_KEYS.map((k) => [k, false])) as ModuleSettings;
    expect(checkDesired({ ...base, attendance: true }, { attendance: true })).toContain("needs");
    expect(checkDesired({ ...base, attendance: true, guest_registration: true }, {})).toBeNull();
  });
  it("planned modules cannot be switched on, but switching one off is harmless", () => {
    const base = Object.fromEntries(MODULE_KEYS.map((k) => [k, false])) as ModuleSettings;
    expect(checkDesired({ ...base, photograph: true }, { photograph: true })).toContain("not built yet");
    expect(checkDesired(base, { photograph: false })).toBeNull();
  });
  it("every preset is a valid configuration", () => {
    const base = Object.fromEntries(MODULE_KEYS.map((k) => [k, false])) as ModuleSettings;
    for (const preset of Object.values(PRESETS)) expect(checkDesired({ ...base, ...preset.values }, preset.values)).toBeNull();
  });
});

describe("default configuration", () => {
  it("every new event gets an explicit row for all eight modules: guest list and attendance on, everything else off", async () => {
    const modules = await getModules(db, A, e1);
    expect(modules.map((m) => m.key)).toEqual([...MODULE_KEYS]);
    expect(Object.fromEntries(modules.map((m) => [m.key, m.enabled]))).toEqual({
      guest_registration: true, attendance: true, signature: false, drawing: false, photograph: false, video: false, text_message: false, consent: false,
    });
    expect((await db.query("select count(*)::int as c from event_modules where event_id = $1", [e1])).rows[0]).toEqual({ c: 8 });
  });

  it("an event created by plain SQL also gets its rows (the database does it, not the application)", async () => {
    const r = await db.query<{ id: string }>("insert into events (account_id, name, event_date, location) values ($1, 'Raw', '2027-01-01', 'x') returning id", [A]);
    expect((await db.query("select count(*)::int as c from event_modules where event_id = $1", [r.rows[0].id])).rows[0]).toEqual({ c: 8 });
  });

  it("an unknown event reads as everything off, never as on", async () => {
    const settings = await getModuleSettings(db, A, NOWHERE);
    expect(Object.values(settings).every((v) => v === false)).toBe(true);
    expect((await getModules(db, A, "nope")).every((m) => !m.enabled)).toBe(true);
  });
});

describe("existing events when the modules migration is applied", () => {
  const root = mkdtempSync(path.join(tmpdir(), "events-modules-upgrade-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("keep guest registration and attendance on, with their guests and check-ins untouched, and signature off", async () => {
    const early = path.join(root, "early");
    mkdirSync(early);
    for (const f of readdirSync("migrations").sort().filter((n) => n < "0005")) copyFileSync(path.join("migrations", f), path.join(early, f));
    const old = await PGlite.create();
    await migrate(old, early);
    await ensureAccount(old, A, "Synthetic A");
    // plain SQL: the application code now expects the modules table, which this older database does not have yet
    const event = (await old.query<{ id: string }>("insert into events (account_id, name, event_date, location) values ($1, 'Old event', '2027-06-18', 'x') returning id", [A])).rows[0];
    const guest = await old.transaction(async (tx) => {
      const g = (await tx.query<{ id: string }>("insert into guests (account_id, event_id, name) values ($1, $2, 'Old Guest') returning id", [A, event.id])).rows[0];
      await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'guest_added')", [A, event.id, g.id]);
      await tx.query("update guests set checked_in_at = now() where id = $1", [g.id]);
      await tx.query("insert into audit_events (account_id, event_id, guest_id, action) values ($1, $2, $3, 'checked_in')", [A, event.id, g.id]);
      return g;
    });

    expect(await migrate(old)).toEqual(["0005_modules_and_contributions.sql"]);
    const settings = await getModuleSettings(old, A, event.id);
    expect(settings).toEqual({ guest_registration: true, attendance: true, signature: false, drawing: false, photograph: false, video: false, text_message: false, consent: false });
    expect((await getGuest(old, A, event.id, guest.id))!.checkedInAt).not.toBeNull();
    expect((await undoCheckIn(old, A, event.id, guest.id)).status).toBe("undone"); // still fully working
    await old.close();
  });
});

describe("changing the configuration", () => {
  it("persists, and applies to one event only", async () => {
    const r = await setModules(db, A, e1, { guest_registration: false, attendance: false, signature: true });
    expect(r).toEqual({ status: "saved", changed: [{ module: "guest_registration", enabled: false }, { module: "attendance", enabled: false }, { module: "signature", enabled: true }] });
    expect(await getModuleSettings(db, A, e1)).toMatchObject({ guest_registration: false, attendance: false, signature: true });
    expect(await getModuleSettings(db, A, e2)).toMatchObject({ guest_registration: true, attendance: true, signature: false }); // same account, other event
    expect(await getModuleSettings(db, B, eB)).toMatchObject({ guest_registration: true, attendance: true, signature: false }); // other account
  });

  it("is atomic: a request that breaks a rule changes nothing", async () => {
    const r = await setModules(db, A, e1, { signature: true, guest_registration: false }); // attendance would be left without a guest list
    expect(r.status).toBe("invalid");
    expect(await getModuleSettings(db, A, e1)).toMatchObject({ guest_registration: true, attendance: true, signature: false });
    expect((await listAudit(db, A, e1)).total).toBe(0);
  });

  it("refuses to switch on a planned module and says why", async () => {
    for (const key of ["drawing", "photograph", "video", "text_message", "consent"] as const) {
      const r = await setModules(db, A, e1, { [key]: true });
      expect(r.status, key).toBe("invalid");
      expect(r.status === "invalid" && r.error).toContain("not built yet");
    }
    expect(await getModuleSettings(db, A, e1)).toMatchObject({ drawing: false, photograph: false, video: false, text_message: false, consent: false });
  });

  it("refuses unknown module names and ignores non-boolean values", async () => {
    expect((await setModules(db, A, e1, { bogus: true } as never)).status).toBe("invalid");
    expect((await setModules(db, A, e1, { signature: "yes" } as never)).status).toBe("saved"); // nothing recognised to change
    expect((await getModuleSettings(db, A, e1)).signature).toBe(false);
  });

  it("changes nothing for an unknown event, another account's event or a malformed id", async () => {
    expect((await setModules(db, A, NOWHERE, { signature: true })).status).toBe("not_found");
    expect((await setModules(db, A, eB, { signature: true })).status).toBe("not_found");
    expect((await setModules(db, B, e1, { signature: true })).status).toBe("not_found");
    expect((await setModules(db, A, "nope", { signature: true })).status).toBe("not_found");
    expect((await getModuleSettings(db, B, eB)).signature).toBe(false);
    expect((await getModuleSettings(db, A, e1)).signature).toBe(false);
  });

  it("records each change, and only changes, in the audit history without any names", async () => {
    await setModules(db, A, e1, { signature: true });
    await setModules(db, A, e1, { signature: true }); // no change, no record
    await setModules(db, A, e1, { signature: false });
    const { entries } = await listAudit(db, A, e1);
    expect(entries.map((e) => [e.action, e.module])).toEqual([["module_disabled", "signature"], ["module_enabled", "signature"]]);
    expect(entries.every((e) => e.guestId === null)).toBe(true);
  });

  it("the database refuses a change without its audit record, and invented module history", async () => {
    await expect(db.query("update event_modules set enabled = true where event_id = $1 and module = 'signature'", [e1])).rejects.toThrow(/without an audit record/);
    await expect(inRole(A, "update event_modules set enabled = true where event_id = $1 and module = 'signature'", [e1])).rejects.toThrow(/without an audit record/);
    await expect(db.query(`insert into audit_events (account_id, event_id, action, detail) values ($1, $2, 'module_enabled', '{"module":"signature"}')`, [A, e1])).rejects.toThrow(/without a matching change/);
    expect((await getModuleSettings(db, A, e1)).signature).toBe(false);
  });

  it("the database itself refuses to switch on a planned module, for the application role and the owner", async () => {
    for (const key of ["drawing", "photograph", "video", "text_message", "consent"]) {
      await expect(inRole(A, "update event_modules set enabled = true where event_id = $1 and module = $2", [e1, key]), key).rejects.toThrow(/check|audit record/);
      await expect(db.query("update event_modules set enabled = true where event_id = $1 and module = $2", [e1, key]), key).rejects.toThrow(/check/);
    }
    // so a photograph or video can never be stored, even by a caller that skips the application code
    await expect(
      db.transaction(async (tx) => {
        await tx.query("insert into contributions (account_id, event_id, kind, storage_ref) values ($1, $2, 'video', 'object-store://x')", [A, e1]);
      }),
    ).rejects.toThrow(/not enabled/);
    expect(await getModuleSettings(db, A, e1)).toMatchObject({ drawing: false, photograph: false, video: false, text_message: false, consent: false });
  });

  it("the database enforces that attendance needs the guest list, at commit, so both can still be changed together", async () => {
    // guest list off while attendance stays on: refused (the audit record is supplied so only the dependency rule can object)
    await expect(
      db.transaction(async (tx) => {
        await tx.query("update event_modules set enabled = false where event_id = $1 and module = 'guest_registration'", [e1]);
        await tx.query(`insert into audit_events (account_id, event_id, action, detail) values ($1, $2, 'module_disabled', '{"module":"guest_registration"}')`, [A, e1]);
      }),
    ).rejects.toThrow(/attendance needs the guest list/);
    expect((await getModuleSettings(db, A, e1)).guest_registration).toBe(true);
    // both off in one transaction is fine
    expect((await setModules(db, A, e1, { attendance: false, guest_registration: false })).status).toBe("saved");
  });

  it("the application role may change only the enabled flag, never delete, and sees only its own account's rows", async () => {
    await expect(inRole(A, "delete from event_modules")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "update event_modules set module = 'video'")).rejects.toThrow(/permission denied/);
    await expect(inRole(A, "update event_modules set event_id = $1", [e2])).rejects.toThrow(/permission denied/);
    expect((await inRole(A, "select count(*)::int as c from event_modules")).rows[0]).toEqual({ c: 16 }); // two events x 8
    expect((await inRole(B, "select count(*)::int as c from event_modules")).rows[0]).toEqual({ c: 8 });
    expect((await inRole(null, "select count(*)::int as c from event_modules")).rows[0]).toEqual({ c: 0 });
    await expect(inRole(A, "insert into event_modules (account_id, event_id, module, enabled) values ($1, $2, 'signature', true)", [B, eB])).rejects.toThrow(/row-level security|duplicate|violates/);
    expect((await inRole(B, "update event_modules set enabled = true where event_id = $1 and module = 'signature'", [e1])).affectedRows).toBe(0);
  });

  it("still separates accounts with row-level security switched off", async () => {
    await db.exec("alter table event_modules disable row level security");
    expect((await setModules(db, B, e1, { signature: true })).status).toBe("not_found");
    expect((await getModules(db, B, e1)).every((m) => !m.enabled)).toBe(true);
  });
});

describe("a switched-off module refuses new entries on the server, and keeps what was collected", () => {
  it("guest list off: no adding, importing or renaming; existing guests are kept and readable", async () => {
    const g = (await addGuest(db, A, e1, "Kept Guest"))!;
    await setModules(db, A, e1, { attendance: false });
    await setModules(db, A, e1, { guest_registration: false });
    await expect(addGuest(db, A, e1, "New Guest")).rejects.toBeInstanceOf(ModuleDisabledError);
    await expect(importGuests(db, A, e1, "00000000-0000-4000-8000-000000000001", ["X Guest"])).rejects.toBeInstanceOf(ModuleDisabledError);
    await expect(renameGuest(db, A, e1, g.id, "Renamed")).rejects.toBeInstanceOf(ModuleDisabledError);
    expect((await listGuests(db, A, e1)).map((x) => x.name)).toEqual(["Kept Guest"]);
    expect((await getGuest(db, A, e1, g.id))!.name).toBe("Kept Guest");
    expect((await db.query("select count(*)::int as c from import_batches")).rows[0]).toEqual({ c: 0 });
  });

  it("attendance off: no check-in or undo, but the guest list still works and check-ins already made are kept", async () => {
    const g = (await addGuest(db, A, e1, "Alex"))!;
    await checkInGuest(db, A, e1, g.id);
    await setModules(db, A, e1, { attendance: false });
    await expect(checkInGuest(db, A, e1, g.id)).rejects.toBeInstanceOf(ModuleDisabledError);
    await expect(undoCheckIn(db, A, e1, g.id)).rejects.toBeInstanceOf(ModuleDisabledError);
    expect((await addGuest(db, A, e1, "Bea"))?.name).toBe("Bea"); // guest list is still on
    expect((await getGuest(db, A, e1, g.id))!.checkedInAt).not.toBeNull(); // the earlier check-in is kept
    await setModules(db, A, e1, { attendance: true });
    expect((await undoCheckIn(db, A, e1, g.id)).status).toBe("undone"); // and works again when switched back on
  });

  it("signature off: no submissions, in the repository or in the database; earlier signatures are kept", async () => {
    await setModules(db, A, e1, { signature: true });
    const saved = await submitSignature(db, A, e1, STROKES, "granted", null);
    expect(saved.status).toBe("saved");
    await setModules(db, A, e1, { signature: false });
    await expect(submitSignature(db, A, e1, STROKES, "granted", null)).rejects.toBeInstanceOf(ModuleDisabledError);
    await expect(
      db.transaction(async (tx) => {
        const c = await tx.query<{ id: string }>("insert into contributions (account_id, event_id, kind, content) values ($1, $2, 'signature', $3::jsonb) returning id", [A, e1, JSON.stringify({ v: 1, strokes: STROKES })]);
        await tx.query("insert into contribution_permissions (account_id, event_id, contribution_id, change, purpose, wording_version, provenance) values ($1, $2, $3, 'granted', 'mosaic_public_display_demo', 'v', 'local_demo_operator_synthetic')", [A, e1, c.rows[0].id]);
      }),
    ).rejects.toThrow(/not enabled/);
    expect((await listContributions(db, A, e1)).length).toBe(1); // the earlier signature is still there
  });

  it("a planned kind cannot be stored while its module is off, and none can be switched on", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.query("insert into contributions (account_id, event_id, kind, storage_ref) values ($1, $2, 'photograph', 'object-store://x')", [A, e1]);
      }),
    ).rejects.toThrow(/not enabled/);
  });

  it("one event's switch-off does not stop another event, in the same or another account", async () => {
    await setModules(db, A, e1, { signature: true });
    await setModules(db, A, e2, { signature: true });
    await setModules(db, B, eB, { signature: true });
    await setModules(db, A, e1, { signature: false });
    expect((await submitSignature(db, A, e2, STROKES, "granted", null)).status).toBe("saved");
    expect((await submitSignature(db, B, eB, STROKES, "granted", null)).status).toBe("saved");
    await expect(submitSignature(db, A, e1, STROKES, "granted", null)).rejects.toBeInstanceOf(ModuleDisabledError);
  });
});

describe("scoping helper", () => {
  it("reads module rows only for the account it is set to", async () => {
    const rows = await asAccount(db, B, async (tx) => (await tx.query("select event_id from event_modules")).rows);
    expect(new Set(rows.map((r) => (r as { event_id: string }).event_id))).toEqual(new Set([eB]));
  });
});

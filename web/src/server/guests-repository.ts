import type { PGlite, Transaction } from "@electric-sql/pglite";
import { isUuid } from "@/domain/event";
import {
  AUDIT_PAGE_SIZE,
  MAX_GUESTS_PER_EVENT,
  OPERATOR_LABEL,
  type Attendance,
  type AuditAction,
  type AuditEntry,
  type CheckInResult,
  type GuestRecord,
  type ImportResult,
  type RenameResult,
  type UndoResult,
} from "@/domain/guest";
import { asAccount } from "@/server/scope";

type Row = {
  id: string;
  account_id: string;
  event_id: string;
  name: string;
  checked_in_at: Date | string | null;
  created_at: Date | string;
};

const COLUMNS = "id, account_id, event_id, name, checked_in_at, created_at";

const toRecord = (r: Row): GuestRecord => ({
  id: r.id,
  accountId: r.account_id,
  eventId: r.event_id,
  name: r.name,
  checkedInAt: r.checked_in_at ? new Date(r.checked_in_at).toISOString() : null,
  createdAt: new Date(r.created_at).toISOString(),
});

export class GuestLimitError extends Error {
  constructor(readonly limit: number) {
    super(`An event can hold at most ${limit} guests in this prototype.`);
    this.name = "GuestLimitError";
  }
}

/** Appends one audit record. Holds ids, an action and (for imports) a count: never a name. */
async function audit(
  tx: Transaction,
  accountId: string,
  eventId: string,
  action: AuditAction,
  guestId: string | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await tx.query("insert into audit_events (account_id, event_id, guest_id, action, detail) values ($1, $2, $3, $4, $5::jsonb)", [
    accountId,
    eventId,
    guestId,
    action,
    JSON.stringify(detail),
  ]);
}

/** Serialises the "count, then insert" limit check per event, so two writers cannot both slip under the limit. */
const lockEventGuests = async (tx: Transaction, eventId: string): Promise<void> => {
  await tx.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`guests:${eventId}`]);
};

const guestCount = async (tx: Transaction, accountId: string, eventId: string): Promise<number> =>
  (await tx.query<{ c: number }>("select count(*)::int as c from guests where account_id = $1 and event_id = $2", [accountId, eventId])).rows[0].c;

/** Adds a guest to an event of this account. Returns null if the event does not exist for this account. */
export async function addGuest(db: PGlite, accountId: string, eventId: string, name: string): Promise<GuestRecord | null> {
  if (!isUuid(eventId)) return null;
  return asAccount(db, accountId, async (tx) => {
    const found = await tx.query("select 1 from events where id = $1 and account_id = $2", [eventId, accountId]);
    if (found.rows.length === 0) return null;
    await lockEventGuests(tx, eventId);
    if ((await guestCount(tx, accountId, eventId)) >= MAX_GUESTS_PER_EVENT) throw new GuestLimitError(MAX_GUESTS_PER_EVENT);
    const { rows } = await tx.query<Row>(
      `insert into guests (account_id, event_id, name) values ($1, $2, $3) returning ${COLUMNS}`,
      [accountId, eventId, name],
    );
    await audit(tx, accountId, eventId, "guest_added", rows[0].id);
    return toRecord(rows[0]);
  });
}

/** Guests of one event, by name. `search` is a plain case-insensitive substring (no wildcards). */
export async function listGuests(db: PGlite, accountId: string, eventId: string, search = ""): Promise<GuestRecord[]> {
  if (!isUuid(eventId)) return [];
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(
      `select ${COLUMNS} from guests
       where account_id = $1 and event_id = $2 and ($3 = '' or position(lower($3) in lower(name)) > 0)
       order by lower(name), created_at, id`,
      [accountId, eventId, search],
    );
    return rows.map(toRecord);
  });
}

export async function getGuest(db: PGlite, accountId: string, eventId: string, guestId: string): Promise<GuestRecord | null> {
  if (!isUuid(eventId) || !isUuid(guestId)) return null;
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(`select ${COLUMNS} from guests where account_id = $1 and event_id = $2 and id = $3`, [accountId, eventId, guestId]);
    return rows[0] ? toRecord(rows[0]) : null;
  });
}

/** Totals derived from stored guests, so they always match the list. */
export async function getAttendance(db: PGlite, accountId: string, eventId: string): Promise<Attendance> {
  if (!isUuid(eventId)) return { total: 0, checkedIn: 0, notCheckedIn: 0 };
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<{ total: number; checked_in: number }>(
      "select count(*)::int as total, count(checked_in_at)::int as checked_in from guests where account_id = $1 and event_id = $2",
      [accountId, eventId],
    );
    const { total, checked_in } = rows[0];
    return { total, checkedIn: checked_in, notCheckedIn: total - checked_in };
  });
}

/**
 * Checks a guest in. One conditional UPDATE decides the outcome, so two simultaneous attempts cannot both succeed:
 * only the first one finds checked_in_at still null. A repeat returns the current check-in and changes nothing, except
 * that the attempt is appended to check_in_log. A successful check-in also appends an audit record (the first time
 * "checked_in", later ones after an undo "checked_in_again"); the database refuses the state change without it.
 */
export async function checkInGuest(db: PGlite, accountId: string, eventId: string, guestId: string): Promise<CheckInResult> {
  if (!isUuid(eventId) || !isUuid(guestId)) return { status: "not_found" };
  return asAccount(db, accountId, async (tx): Promise<CheckInResult> => {
    const ids = [accountId, eventId, guestId];
    const first = await tx.query<Row>(
      `update guests set checked_in_at = clock_timestamp()
       where account_id = $1 and event_id = $2 and id = $3 and checked_in_at is null
       returning ${COLUMNS}`,
      ids,
    );
    if (first.rows[0]) {
      const before = await tx.query("select 1 from audit_events where guest_id = $1 and action in ('checked_in', 'checked_in_again') limit 1", [guestId]);
      await audit(tx, accountId, eventId, before.rows.length ? "checked_in_again" : "checked_in", guestId);
      await tx.query("insert into check_in_log (account_id, event_id, guest_id, outcome) values ($1, $2, $3, 'checked_in')", ids);
      return { status: "checked_in", guest: toRecord(first.rows[0]) };
    }
    const existing = await tx.query<Row>(`select ${COLUMNS} from guests where account_id = $1 and event_id = $2 and id = $3`, ids);
    if (!existing.rows[0]) return { status: "not_found" };
    await tx.query("insert into check_in_log (account_id, event_id, guest_id, outcome) values ($1, $2, $3, 'already_checked_in')", ids);
    return { status: "already_checked_in", guest: toRecord(existing.rows[0]) };
  });
}

/**
 * Returns a checked-in guest to "not yet checked in". The original check-in stays in the audit history; the reversal
 * is a separate "check_in_undone" record written in the same transaction. A repeat changes and records nothing.
 */
export async function undoCheckIn(db: PGlite, accountId: string, eventId: string, guestId: string): Promise<UndoResult> {
  if (!isUuid(eventId) || !isUuid(guestId)) return { status: "not_found" };
  return asAccount(db, accountId, async (tx): Promise<UndoResult> => {
    const ids = [accountId, eventId, guestId];
    const changed = await tx.query<Row>(
      `update guests set checked_in_at = null
       where account_id = $1 and event_id = $2 and id = $3 and checked_in_at is not null
       returning ${COLUMNS}`,
      ids,
    );
    if (changed.rows[0]) {
      await audit(tx, accountId, eventId, "check_in_undone", guestId);
      return { status: "undone", guest: toRecord(changed.rows[0]) };
    }
    const existing = await tx.query<Row>(`select ${COLUMNS} from guests where account_id = $1 and event_id = $2 and id = $3`, ids);
    return existing.rows[0] ? { status: "not_checked_in", guest: toRecord(existing.rows[0]) } : { status: "not_found" };
  });
}

/** Corrects a guest's name. The id, check-in state and history are untouched; the audit record holds no names. */
export async function renameGuest(db: PGlite, accountId: string, eventId: string, guestId: string, name: string): Promise<RenameResult> {
  if (!isUuid(eventId) || !isUuid(guestId)) return { status: "not_found" };
  return asAccount(db, accountId, async (tx): Promise<RenameResult> => {
    const ids = [accountId, eventId, guestId];
    const changed = await tx.query<Row>(
      `update guests set name = $4
       where account_id = $1 and event_id = $2 and id = $3 and name is distinct from $4
       returning ${COLUMNS}`,
      [...ids, name],
    );
    if (changed.rows[0]) {
      await audit(tx, accountId, eventId, "guest_renamed", guestId);
      return { status: "renamed", guest: toRecord(changed.rows[0]) };
    }
    const existing = await tx.query<Row>(`select ${COLUMNS} from guests where account_id = $1 and event_id = $2 and id = $3`, ids);
    return existing.rows[0] ? { status: "unchanged", guest: toRecord(existing.rows[0]) } : { status: "not_found" };
  });
}

/**
 * Imports already-validated names into one event, all or nothing. `batchId` is chosen by the server when the preview
 * is shown, so submitting the same confirmation twice (double click, back button, retry) imports once and the second
 * attempt reports the first result. Identical names are never merged: each row becomes its own guest.
 */
export async function importGuests(db: PGlite, accountId: string, eventId: string, batchId: string, names: string[]): Promise<ImportResult> {
  if (!isUuid(eventId) || !isUuid(batchId) || names.length === 0 || names.length > 500) return { status: "event_not_found" };
  return asAccount(db, accountId, async (tx): Promise<ImportResult> => {
    const inserted = await tx.query(
      `insert into import_batches (account_id, id, event_id, guest_count)
       select $1, $2, $3, $4 where exists (select 1 from events where id = $3 and account_id = $1)
       on conflict do nothing returning id`,
      [accountId, batchId, eventId, names.length],
    );
    if (inserted.rows.length === 0) {
      const earlier = await tx.query<{ guest_count: number }>("select guest_count from import_batches where account_id = $1 and id = $2", [accountId, batchId]);
      if (earlier.rows[0]) return { status: "already_imported", count: earlier.rows[0].guest_count };
      return { status: "event_not_found" };
    }
    await lockEventGuests(tx, eventId);
    if ((await guestCount(tx, accountId, eventId)) + names.length > MAX_GUESTS_PER_EVENT) {
      throw new GuestLimitError(MAX_GUESTS_PER_EVENT); // rolls back the batch row too
    }
    await tx.query(
      `insert into guests (account_id, event_id, name, import_batch_id)
       select $1, $2, t.name, $3 from unnest($4::text[]) with ordinality as t(name, ord) order by t.ord`,
      [accountId, eventId, batchId, names],
    );
    await audit(tx, accountId, eventId, "guests_imported", null, { count: names.length, batch_id: batchId });
    return { status: "imported", count: names.length };
  });
}

/**
 * Newest first. The guest's CURRENT name is joined in for display only. `seq` is the record's number WITHIN this event
 * (1 is the first), not the database-wide sequence, so one account cannot infer another's activity from the numbers.
 */
export async function listAudit(db: PGlite, accountId: string, eventId: string, limit = AUDIT_PAGE_SIZE): Promise<{ entries: AuditEntry[]; total: number }> {
  if (!isUuid(eventId)) return { entries: [], total: 0 };
  return asAccount(db, accountId, async (tx) => {
    const total = (await tx.query<{ c: number }>("select count(*)::int as c from audit_events where account_id = $1 and event_id = $2", [accountId, eventId])).rows[0].c;
    const { rows } = await tx.query<{
      seq: string | number;
      action: AuditAction;
      guest_id: string | null;
      guest_name: string | null;
      detail: { count?: number };
      actor: string;
      occurred_at: Date | string;
    }>(
      `select n.ordinal as seq, n.action, n.guest_id, g.name as guest_name, n.detail, n.actor, n.occurred_at
       from (
         select a.*, row_number() over (order by a.seq) as ordinal
         from audit_events a where a.account_id = $1 and a.event_id = $2
       ) n
       left join guests g on g.id = n.guest_id and g.account_id = n.account_id and g.event_id = n.event_id
       order by n.ordinal desc limit $3`,
      [accountId, eventId, limit],
    );
    return {
      total,
      entries: rows.map((r) => ({
        seq: Number(r.seq),
        action: r.action,
        guestId: r.guest_id,
        guestName: r.guest_name,
        count: typeof r.detail?.count === "number" ? r.detail.count : null,
        actor: r.actor === "local_demo_operator" ? OPERATOR_LABEL : "Unknown",
        occurredAt: new Date(r.occurred_at).toISOString(),
      })),
    };
  });
}

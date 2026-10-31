import type { PGlite } from "@electric-sql/pglite";
import { isUuid } from "@/domain/event";
import type { Attendance, CheckInResult, GuestRecord } from "@/domain/guest";
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

/** Adds a guest to an event of this account. Returns null if the event does not exist for this account. */
export async function addGuest(db: PGlite, accountId: string, eventId: string, name: string): Promise<GuestRecord | null> {
  if (!isUuid(eventId)) return null;
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(
      `insert into guests (account_id, event_id, name)
       select $1, $2, $3 where exists (select 1 from events where id = $2 and account_id = $1)
       returning ${COLUMNS}`,
      [accountId, eventId, name],
    );
    return rows[0] ? toRecord(rows[0]) : null;
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
 * only the first one finds checked_in_at still null. A repeat returns the original check-in and changes nothing,
 * except that every attempt is appended to the check-in log (never edited). The guest must belong to this account
 * and this event, otherwise the result is not_found and nothing is written.
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
      await tx.query("insert into check_in_log (account_id, event_id, guest_id, outcome) values ($1, $2, $3, 'checked_in')", ids);
      return { status: "checked_in", guest: toRecord(first.rows[0]) };
    }
    const existing = await tx.query<Row>(
      `select ${COLUMNS} from guests where account_id = $1 and event_id = $2 and id = $3`,
      ids,
    );
    if (!existing.rows[0]) return { status: "not_found" };
    await tx.query("insert into check_in_log (account_id, event_id, guest_id, outcome) values ($1, $2, $3, 'already_checked_in')", ids);
    return { status: "already_checked_in", guest: toRecord(existing.rows[0]) };
  });
}

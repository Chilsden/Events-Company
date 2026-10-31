import type { PGlite } from "@electric-sql/pglite";
import type { EventInput, EventRecord } from "@/domain/event";
import { isUuid } from "@/domain/event";
import { asAccount } from "@/server/scope";

type Row = {
  id: string;
  account_id: string;
  name: string;
  event_date: string;
  location: string;
  description: string | null;
  created_at: Date | string;
};

const COLUMNS = "id, account_id, name, to_char(event_date, 'YYYY-MM-DD') as event_date, location, description, created_at";

const toRecord = (r: Row): EventRecord => ({
  id: r.id,
  accountId: r.account_id,
  name: r.name,
  date: r.event_date,
  location: r.location,
  description: r.description,
  createdAt: new Date(r.created_at).toISOString(),
});

export async function createEvent(db: PGlite, accountId: string, input: EventInput): Promise<EventRecord> {
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(
      `insert into events (account_id, name, event_date, location, description) values ($1, $2, $3, $4, $5) returning ${COLUMNS}`,
      [accountId, input.name, input.date, input.location, input.description],
    );
    return toRecord(rows[0]);
  });
}

export async function listEvents(db: PGlite, accountId: string): Promise<EventRecord[]> {
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(
      `select ${COLUMNS} from events where account_id = $1 order by event_date, created_at, id`,
      [accountId],
    );
    return rows.map(toRecord);
  });
}

/** Returns null for an unknown id, an id that is not a UUID, or an event that belongs to another account. */
export async function getEvent(db: PGlite, accountId: string, id: string): Promise<EventRecord | null> {
  if (!isUuid(id)) return null;
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(`select ${COLUMNS} from events where account_id = $1 and id = $2`, [accountId, id]);
    return rows[0] ? toRecord(rows[0]) : null;
  });
}

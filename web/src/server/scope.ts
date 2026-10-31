import type { PGlite, Transaction } from "@electric-sql/pglite";
import { isUuid } from "@/domain/event";

/**
 * Runs work as the limited `events_app` role with the account set for this transaction only, so Postgres
 * row-level security applies in addition to the explicit account filters in every repository query.
 * Both settings are transaction-local and cannot leak into another request.
 */
export async function asAccount<T>(db: PGlite, accountId: string, work: (tx: Transaction) => Promise<T>): Promise<T> {
  if (!isUuid(accountId)) throw new Error("accountId must be a UUID");
  return db.transaction(async (tx) => {
    await tx.exec("set local role events_app");
    await tx.query("select set_config('app.account_id', $1, true)", [accountId]);
    return work(tx);
  });
}

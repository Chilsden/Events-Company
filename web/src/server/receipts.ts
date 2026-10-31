import { randomBytes } from "node:crypto";
import type { Notice } from "@/domain/guest";

/**
 * Confirmation messages come from the server, not from the address bar. After an action the server stores what really
 * happened under a random, unguessable id and redirects to ?r=<id>. The page shows a message only if that id exists,
 * has not expired and belongs to the same event. A made-up link therefore cannot display a success message.
 * Receipts live in this process's memory for a minute: restarting the server drops them, which is fine for a notice.
 */
export interface Receipt {
  notice: Notice;
  eventId: string;
  guestId?: string;
  count?: number;
}

const TTL_MS = 60_000;
const MAX_RECEIPTS = 200;

const holder = globalThis as unknown as { __eventsReceipts?: Map<string, { receipt: Receipt; expires: number }> };
const store = (): Map<string, { receipt: Receipt; expires: number }> => (holder.__eventsReceipts ??= new Map());

export function issueReceipt(receipt: Receipt): string {
  const receipts = store();
  const now = Date.now();
  for (const [id, entry] of receipts) if (entry.expires < now) receipts.delete(id);
  while (receipts.size >= MAX_RECEIPTS) receipts.delete(receipts.keys().next().value as string);
  const id = randomBytes(16).toString("base64url");
  receipts.set(id, { receipt, expires: now + TTL_MS });
  return id;
}

/** Returns the receipt only for a well-formed, unexpired id that belongs to this event. */
export function readReceipt(id: unknown, eventId: string): Receipt | null {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(id)) return null;
  const entry = store().get(id);
  if (!entry || entry.expires < Date.now() || entry.receipt.eventId !== eventId) return null;
  return entry.receipt;
}

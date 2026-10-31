import { z } from "zod";

export const GUEST_NAME_MAX = 120;
export const SEARCH_MAX = 100;

export interface GuestRecord {
  id: string;
  accountId: string;
  eventId: string;
  name: string;
  checkedInAt: string | null; // ISO timestamp of the first successful check-in
  createdAt: string;
}

export interface Attendance {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
}

export type CheckInResult =
  | { status: "checked_in"; guest: GuestRecord }
  | { status: "already_checked_in"; guest: GuestRecord }
  | { status: "not_found" };

// Control characters, zero-width characters, byte-order marks and bidirectional controls can hide or reorder text.
const CONTROL_CHARS = /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/;

// The slice collects a name only. Guests must be synthetic (see the page warning); there are no contact details,
// photographs, signatures or consent fields in the form.
export const guestInputSchema = z.object({
  name: z
    .string({ error: "Enter the guest's name." })
    .trim()
    .min(1, "Enter the guest's name.")
    .max(GUEST_NAME_MAX, `The guest's name must be ${GUEST_NAME_MAX} characters or fewer.`)
    .refine((v) => !CONTROL_CHARS.test(v), "The guest's name contains characters that are not allowed."),
});

export type GuestParseResult = { ok: true; name: string } | { ok: false; error: string; value: string };

export function parseGuestForm(raw: Record<string, unknown>): GuestParseResult {
  const value = typeof raw.name === "string" ? raw.name : "";
  const result = guestInputSchema.safeParse({ name: value });
  if (result.success) return { ok: true, name: result.data.name };
  return { ok: false, error: result.error.issues[0].message, value };
}

/** Cleans a search term from the address bar: trimmed, limited in length, control characters removed. */
export function cleanSearch(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, SEARCH_MAX);
}

export function formatCheckInTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(iso));
}

export const NOTICES = ["added", "checked-in", "already", "not-found", "error"] as const;
export type Notice = (typeof NOTICES)[number];
export const isNotice = (v: unknown): v is Notice => typeof v === "string" && (NOTICES as readonly string[]).includes(v);

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
// A leading = + - or @ makes spreadsheet programs treat a cell as a formula if the name is ever exported.
const FORMULA_START = /^[=+\-@]/;
// This prototype takes names only, so text that looks like an email address or a phone number is refused.
const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_LIKE = /\d[\d\s().-]{6,}\d/;

export const guestInputSchema = z.object({
  name: z
    .string({ error: "Enter the guest's name." })
    .trim()
    .min(1, "Enter the guest's name.")
    .max(GUEST_NAME_MAX, `The guest's name must be ${GUEST_NAME_MAX} characters or fewer.`)
    .refine((v) => !CONTROL_CHARS.test(v), "The guest's name contains characters that are not allowed.")
    .refine((v) => !FORMULA_START.test(v), "The guest's name cannot start with =, +, - or @ (spreadsheets treat those as formulas).")
    .refine((v) => !EMAIL_LIKE.test(v) && !PHONE_LIKE.test(v), "This prototype takes names only. The text looks like an email address or phone number."),
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

export const NOTICES = [
  "module-disabled",
  "modules-saved",
  "contribution-saved",
  "permission-revoked",
  "permission-not-granted",
  "added",
  "checked-in",
  "already",
  "undone",
  "not-checked-in",
  "renamed",
  "rename-unchanged",
  "imported",
  "import-repeated",
  "not-found",
  "error",
] as const;
export type Notice = (typeof NOTICES)[number];

export type AuditAction =
  | "guest_added"
  | "guests_imported"
  | "guest_renamed"
  | "checked_in"
  | "check_in_undone"
  | "checked_in_again"
  | "module_enabled"
  | "module_disabled"
  | "contribution_submitted"
  | "display_permission_revoked";

export interface AuditEntry {
  seq: number;
  action: AuditAction;
  guestId: string | null;
  guestName: string | null; // the guest's CURRENT name, looked up for display; the audit record itself holds no names
  count: number | null;
  module: string | null; // for module_enabled and module_disabled
  contributionId: string | null; // for contribution_submitted and display_permission_revoked
  actor: string;
  occurredAt: string;
}

export type UndoResult = { status: "undone"; guest: GuestRecord } | { status: "not_checked_in"; guest: GuestRecord } | { status: "not_found" };
export type RenameResult = { status: "renamed"; guest: GuestRecord } | { status: "unchanged"; guest: GuestRecord } | { status: "not_found" };
export type ImportResult =
  | { status: "imported"; count: number }
  | { status: "already_imported"; count: number }
  | { status: "event_not_found" };

export const MAX_GUESTS_PER_EVENT = 2000;
export const AUDIT_PAGE_SIZE = 200;
export const OPERATOR_LABEL = "Local demonstration operator (not a verified person)";

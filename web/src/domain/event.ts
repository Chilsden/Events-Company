import { z } from "zod";

export const EVENT_LIMITS = { name: 120, location: 200, description: 2000 } as const;
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

export type EventFieldName = "name" | "date" | "location" | "description";

export interface EventInput {
  name: string;
  date: string; // calendar date, YYYY-MM-DD
  location: string;
  description: string | null;
}

export interface EventRecord extends EventInput {
  id: string;
  accountId: string;
  createdAt: string; // ISO timestamp
}

// Control characters other than tab and newline are never valid in these fields (and NUL cannot be stored).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function isRealCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < MIN_YEAR || y > MAX_YEAR) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const text = (required: string, tooLong: string, badChars: string, max: number) =>
  z
    .string({ error: required })
    .trim()
    .min(1, required)
    .max(max, tooLong)
    .refine((v) => !CONTROL_CHARS.test(v), badChars);

export const eventInputSchema = z.object({
  name: text(
    "Enter an event name.",
    `The event name must be ${EVENT_LIMITS.name} characters or fewer.`,
    "The event name contains characters that are not allowed.",
    EVENT_LIMITS.name,
  ),
  date: z
    .string({ error: "Enter the event date." })
    .trim()
    .min(1, "Enter the event date.")
    .refine(isRealCalendarDate, `Enter a real date between ${MIN_YEAR} and ${MAX_YEAR}, for example 2027-06-18.`),
  location: text(
    "Enter the event location.",
    `The event location must be ${EVENT_LIMITS.location} characters or fewer.`,
    "The event location contains characters that are not allowed.",
    EVENT_LIMITS.location,
  ),
  description: z
    .string()
    .trim()
    .max(EVENT_LIMITS.description, `The description must be ${EVENT_LIMITS.description} characters or fewer.`)
    .refine((v) => !CONTROL_CHARS.test(v), "The description contains characters that are not allowed.")
    .optional()
    .transform((v) => (v ? v : null)),
});

export type EventFormValues = Record<EventFieldName, string>;

export type ParseResult =
  | { ok: true; value: EventInput }
  | { ok: false; errors: Partial<Record<EventFieldName, string>>; values: EventFormValues };

const FIELDS: EventFieldName[] = ["name", "date", "location", "description"];

/** Parses raw form values. Only the four known fields are read; anything else is ignored. */
export function parseEventForm(raw: Record<string, unknown>): ParseResult {
  const values = Object.fromEntries(
    FIELDS.map((f) => [f, typeof raw[f] === "string" ? (raw[f] as string) : ""]),
  ) as EventFormValues;
  const result = eventInputSchema.safeParse(values);
  if (result.success) return { ok: true, value: result.data };
  const errors: Partial<Record<EventFieldName, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as EventFieldName;
    if (!errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors, values };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID.test(value);

/** Formats a YYYY-MM-DD calendar date for UK readers, with no time zone shift. */
export function formatEventDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

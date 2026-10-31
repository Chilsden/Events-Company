"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { checkFileDetails, IMPORT_LIMITS, prepareImport, type InvalidRow } from "@/domain/csv";
import { isUuid } from "@/domain/event";
import { cleanSearch, MAX_GUESTS_PER_EVENT, parseGuestForm, type Notice } from "@/domain/guest";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { GuestLimitError, addGuest, checkInGuest, importGuests, listGuests, renameGuest, undoCheckIn } from "@/server/guests-repository";
import { ModuleDisabledError, getModuleSettings } from "@/server/modules-repository";
import { issueReceipt } from "@/server/receipts";

export interface GuestFormState {
  error?: string;
  value?: string;
  message?: string;
}

export interface ImportState {
  error?: string;
  preview?: {
    submissionId: string;
    names: string[];
    invalid: InvalidRow[];
    duplicatesInFile: number;
    matchExisting: number;
  };
}

/** Sends the browser back to Check-in Studio with a server-issued receipt (not a message taken from the address). */
function back(eventId: string, notice: Notice, opts: { guestId?: string; count?: number; search?: string } = {}): never {
  const r = issueReceipt({ notice, eventId, guestId: opts.guestId, count: opts.count });
  const params = new URLSearchParams({ r });
  if (opts.search) params.set("q", opts.search);
  const anchor = opts.guestId && isUuid(opts.guestId) ? `#guest-${opts.guestId}` : "";
  redirect(`/events/${eventId}/check-in?${params.toString()}${anchor}`);
}

const logFailure = (what: string, error: unknown) =>
  console.error(`${what} failed:`, error instanceof Error ? error.name : "unknown error"); // never names, ids or SQL

/** Adds a synthetic guest to the event named in the form. The event must belong to the demo account. */
export async function addGuestAction(_previous: GuestFormState, formData: FormData): Promise<GuestFormState> {
  const eventId = String(formData.get("eventId") ?? "");
  const parsed = parseGuestForm(Object.fromEntries(formData));
  if (!parsed.ok) return { error: parsed.error, value: parsed.value };
  if (!isUuid(eventId)) return { message: "That event could not be found.", value: parsed.name };

  let guestId: string | undefined;
  try {
    const guest = await addGuest(await getDatabase(), DEMO_ACCOUNT_ID, eventId, parsed.name);
    if (!guest) return { message: "That event could not be found.", value: parsed.name };
    guestId = guest.id;
  } catch (error) {
    if (error instanceof ModuleDisabledError) return { message: "The guest list is switched off for this event. Switch it on under Inputs first.", value: parsed.name };
    if (error instanceof GuestLimitError) return { message: `This event already has ${MAX_GUESTS_PER_EVENT} guests, the most this prototype allows.`, value: parsed.name };
    logFailure("addGuest", error);
    return { message: "We could not add the guest. Please try again.", value: parsed.name };
  }
  back(eventId, "added", { guestId });
}

/** Checks a guest in. Safe to repeat: a second attempt reports "already checked in" and changes nothing. */
export async function checkInAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  const search = cleanSearch(formData.get("q"));
  if (!isUuid(eventId)) redirect("/events");
  let notice: Notice;
  try {
    const result = await checkInGuest(await getDatabase(), DEMO_ACCOUNT_ID, eventId, guestId);
    notice = result.status === "checked_in" ? "checked-in" : result.status === "already_checked_in" ? "already" : "not-found";
  } catch (error) {
    if (!(error instanceof ModuleDisabledError)) logFailure("checkIn", error);
    notice = error instanceof ModuleDisabledError ? "module-disabled" : "error";
  }
  back(eventId, notice, { guestId, search });
}

/** Reverses a mistaken check-in. The original check-in stays in the audit history. Safe to repeat. */
export async function undoCheckInAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  const search = cleanSearch(formData.get("q"));
  if (!isUuid(eventId)) redirect("/events");
  let notice: Notice;
  try {
    const result = await undoCheckIn(await getDatabase(), DEMO_ACCOUNT_ID, eventId, guestId);
    notice = result.status === "undone" ? "undone" : result.status === "not_checked_in" ? "not-checked-in" : "not-found";
  } catch (error) {
    if (!(error instanceof ModuleDisabledError)) logFailure("undoCheckIn", error);
    notice = error instanceof ModuleDisabledError ? "module-disabled" : "error";
  }
  back(eventId, notice, { guestId, search });
}

export interface RenameState {
  error?: string;
  value?: string;
  message?: string;
}

/** Corrects a guest's name using the same rules as adding one. */
export async function renameGuestAction(_previous: RenameState, formData: FormData): Promise<RenameState> {
  const eventId = String(formData.get("eventId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  const parsed = parseGuestForm(Object.fromEntries(formData));
  if (!parsed.ok) return { error: parsed.error, value: parsed.value };
  if (!isUuid(eventId) || !isUuid(guestId)) return { message: "That guest could not be found.", value: parsed.name };
  let notice: Notice;
  try {
    const result = await renameGuest(await getDatabase(), DEMO_ACCOUNT_ID, eventId, guestId, parsed.name);
    if (result.status === "not_found") return { message: "That guest could not be found for this event. Nothing was changed.", value: parsed.name };
    notice = result.status === "renamed" ? "renamed" : "rename-unchanged";
  } catch (error) {
    if (error instanceof ModuleDisabledError) return { message: "The guest list is switched off for this event. Nothing was changed.", value: parsed.name };
    logFailure("renameGuest", error);
    return { message: "We could not save the new name. Please try again.", value: parsed.name };
  }
  back(eventId, notice, { guestId });
}

/** Step 1 of an import: read and check the file, then show a preview. Nothing is saved. */
export async function previewImportAction(_previous: ImportState, formData: FormData): Promise<ImportState> {
  const eventId = String(formData.get("eventId") ?? "");
  const file = formData.get("file");
  if (!isUuid(eventId)) return { error: "That event could not be found." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file to upload." };
  const problem = checkFileDetails(file);
  if (problem) return { error: problem };

  try {
    const db = await getDatabase();
    if (!(await getEvent(db, DEMO_ACCOUNT_ID, eventId))) return { error: "That event could not be found." };
    if (!(await getModuleSettings(db, DEMO_ACCOUNT_ID, eventId)).guest_registration) return { error: "The guest list is switched off for this event. Switch it on under Inputs first." };
    const existing = (await listGuests(db, DEMO_ACCOUNT_ID, eventId)).map((g) => g.name);
    const preview = prepareImport(new Uint8Array(await file.arrayBuffer()), existing);
    if (!preview.ok) return { error: preview.error };
    if (preview.names.length === 0) return { error: "None of the rows could be imported. Fix the problems listed and upload the file again.", preview: undefined };
    if (existing.length + preview.names.length > MAX_GUESTS_PER_EVENT) {
      return { error: `Importing ${preview.names.length} guests would take this event over the limit of ${MAX_GUESTS_PER_EVENT} guests.` };
    }
    return {
      preview: {
        submissionId: randomUUID(),
        names: preview.names,
        invalid: preview.invalid,
        duplicatesInFile: preview.duplicatesInFile,
        matchExisting: preview.matchExisting,
      },
    };
  } catch (error) {
    logFailure("previewImport", error);
    return { error: "The file could not be checked. Nothing was imported." };
  }
}

/** Step 2: save the previewed names. Everything is checked again here; the browser's copy is never trusted. */
export async function confirmImportAction(_previous: ImportState, formData: FormData): Promise<ImportState> {
  const eventId = String(formData.get("eventId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  if (!isUuid(eventId) || !isUuid(submissionId)) return { error: "The import could not be confirmed. Upload the file again." };

  let names: string[] = [];
  try {
    const raw: unknown = JSON.parse(String(formData.get("names") ?? ""));
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > IMPORT_LIMITS.maxRows) throw new Error("bad list");
    names = raw.map((n) => {
      const parsed = parseGuestForm({ name: n });
      if (!parsed.ok) throw new Error("bad name");
      return parsed.name;
    });
  } catch {
    return { error: "The import could not be confirmed. Upload the file again." };
  }

  let result: Awaited<ReturnType<typeof importGuests>>;
  try {
    result = await importGuests(await getDatabase(), DEMO_ACCOUNT_ID, eventId, submissionId, names);
  } catch (error) {
    if (error instanceof ModuleDisabledError) return { error: "The guest list is switched off for this event. Nothing was imported." };
    if (error instanceof GuestLimitError) return { error: `This would take the event over the limit of ${error.limit} guests. Nothing was imported.` };
    logFailure("confirmImport", error);
    return { error: "The import failed and nothing was imported. Please try again." };
  }
  if (result.status === "event_not_found") return { error: "That event could not be found. Nothing was imported." };
  back(eventId, result.status === "already_imported" ? "import-repeated" : "imported", { count: result.count });
}

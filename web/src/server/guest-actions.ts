"use server";

import { redirect } from "next/navigation";
import { isUuid } from "@/domain/event";
import { cleanSearch, parseGuestForm, type Notice } from "@/domain/guest";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { addGuest, checkInGuest } from "@/server/guests-repository";

export interface GuestFormState {
  error?: string;
  value?: string;
  message?: string;
}

function destination(eventId: string, notice: Notice, guestId?: string, search?: string): string {
  const params = new URLSearchParams({ notice });
  if (guestId && isUuid(guestId)) params.set("g", guestId);
  if (search) params.set("q", search);
  const anchor = guestId && isUuid(guestId) ? `#guest-${guestId}` : ""; // land on the guest's row, not the top of the page
  return `/events/${eventId}/check-in?${params.toString()}${anchor}`;
}

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
    console.error("addGuest failed:", error instanceof Error ? error.name : "unknown error"); // no guest details in logs
    return { message: "We could not add the guest. Please try again.", value: parsed.name };
  }
  redirect(destination(eventId, "added", guestId));
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
    console.error("checkIn failed:", error instanceof Error ? error.name : "unknown error");
    notice = "error";
  }
  redirect(destination(eventId, notice, guestId, search));
}

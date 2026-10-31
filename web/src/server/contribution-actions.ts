"use server";

import { redirect } from "next/navigation";
import { isUuid } from "@/domain/event";
import { parseSignaturePayload } from "@/domain/signature";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { ModuleDisabledError, revokeDisplayPermission, submitSignature } from "@/server/contributions-repository";
import { issueReceipt } from "@/server/receipts";

export interface SignatureState {
  error?: string;
  /** Which field the message belongs to, so the page can place and announce it. */
  field?: "payload" | "permission" | "guest" | "form";
}

const logFailure = (what: string, error: unknown) => console.error(`${what} failed:`, error instanceof Error ? error.name : "unknown error");

/**
 * Saves one signature. Nothing is required about the visitor: no name, no guest, no check-in. The permission choice
 * must be made explicitly ("granted" or "denied"); there is no default. Everything is validated here, whatever the page did.
 */
export async function submitSignatureAction(_previous: SignatureState, formData: FormData): Promise<SignatureState> {
  const eventId = String(formData.get("eventId") ?? "");
  if (!isUuid(eventId)) return { error: "That event could not be found.", field: "form" };

  const parsed = parseSignaturePayload(formData.get("payload"));
  if (!parsed.ok) return { error: parsed.error, field: "payload" };

  const choice = formData.get("permission");
  if (choice !== "granted" && choice !== "denied") return { error: "Choose whether the signature may be shown. There is no default.", field: "permission" };

  const rawGuest = formData.get("guestId");
  const guestId = typeof rawGuest === "string" && rawGuest !== "" ? rawGuest : null;

  let result;
  try {
    result = await submitSignature(await getDatabase(), DEMO_ACCOUNT_ID, eventId, parsed.strokes, choice, guestId);
  } catch (error) {
    if (error instanceof ModuleDisabledError) return { error: "Signature capture is switched off for this event. Switch it on under Inputs first.", field: "form" };
    logFailure("submitSignature", error);
    return { error: "The signature could not be saved. Nothing was stored. Please try again.", field: "form" };
  }
  if (result.status === "event_not_found") return { error: "That event could not be found.", field: "form" };
  if (result.status === "invalid_guest") return { error: result.reason, field: "guest" };
  const r = issueReceipt({ notice: "contribution-saved", eventId });
  redirect(`/events/${eventId}/check-in/collect?r=${r}`);
}

/** Withdraws display permission for one signature. The signature itself is kept. Safe to repeat. */
export async function revokePermissionAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const contributionId = String(formData.get("contributionId") ?? "");
  if (!isUuid(eventId)) redirect("/events");
  let notice: "permission-revoked" | "permission-not-granted" | "not-found" | "error";
  try {
    const result = await revokeDisplayPermission(await getDatabase(), DEMO_ACCOUNT_ID, eventId, contributionId);
    notice = result.status === "revoked" ? "permission-revoked" : result.status === "not_granted" ? "permission-not-granted" : "not-found";
  } catch (error) {
    logFailure("revokePermission", error);
    notice = "error";
  }
  const r = issueReceipt({ notice, eventId });
  redirect(`/events/${eventId}/check-in/contributions?r=${r}`);
}

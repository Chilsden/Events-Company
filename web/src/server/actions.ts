"use server";

import { redirect } from "next/navigation";
import { parseEventForm, type EventFieldName, type EventFormValues } from "@/domain/event";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { createEvent } from "@/server/events-repository";

export interface FormState {
  errors?: Partial<Record<EventFieldName, string>>;
  values?: EventFormValues;
  message?: string;
}

/** Validates on the server, saves under the fixed demo account, then opens the new event. */
export async function createEventAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseEventForm(Object.fromEntries(formData));
  if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };

  let id: string;
  try {
    const event = await createEvent(await getDatabase(), DEMO_ACCOUNT_ID, parsed.value);
    id = event.id;
  } catch (error) {
    // Log the error type only: the submitted values are not written to logs.
    console.error("createEvent failed:", error instanceof Error ? error.name : "unknown error");
    return { message: "We could not save the event. Please try again." };
  }
  redirect(`/events/${id}`);
}

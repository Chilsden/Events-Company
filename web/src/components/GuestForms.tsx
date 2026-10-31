"use client";

import { useActionState } from "react";
import { GUEST_NAME_MAX } from "@/domain/guest";
import type { GuestFormState } from "@/server/guest-actions";

type Action = (previous: GuestFormState, formData: FormData) => Promise<GuestFormState>;

export function AddGuestForm({ action, eventId, initialState = {} }: { action: Action; eventId: string; initialState?: GuestFormState }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} noValidate className="inline-form">
      <input type="hidden" name="eventId" value={eventId} />
      {state.message && (
        <p role="alert" className="alert">
          {state.message}
        </p>
      )}
      <div className="field">
        <label htmlFor="guest-name">Guest name (required)</label>
        <p id="guest-name-hint" className="hint">
          Synthetic names only in this prototype. Up to {GUEST_NAME_MAX} characters.
        </p>
        {state.error && (
          <p id="guest-name-error" role="alert" className="error">
            {state.error}
          </p>
        )}
        <input
          id="guest-name"
          name="name"
          type="text"
          autoComplete="off"
          required
          aria-required="true"
          defaultValue={state.value ?? ""}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={`guest-name-hint${state.error ? " guest-name-error" : ""}`}
        />
      </div>
      <button type="submit" disabled={pending} className="button">
        {pending ? "Adding…" : "Add guest"}
      </button>
    </form>
  );
}

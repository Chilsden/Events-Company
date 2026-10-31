"use client";

import { useActionState, useEffect, useRef } from "react";
import { EVENT_LIMITS, type EventFieldName } from "@/domain/event";
import type { FormState } from "@/server/actions";

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;

const EMPTY = { name: "", date: "", location: "", description: "" };

export function EventForm({ action, initialState = {} }: { action: Action; initialState?: FormState }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const summary = useRef<HTMLDivElement>(null);
  const errors = state.errors ?? {};
  const values = state.values ?? EMPTY;
  const errorFields = (Object.keys(errors) as EventFieldName[]).filter((f) => errors[f]);
  // After a failed submission, move keyboard and screen reader focus to the list of problems.
  useEffect(() => {
    if (state.errors) summary.current?.focus();
  }, [state]);
  const describe = (f: EventFieldName) => `${f}-hint${errors[f] ? ` ${f}-error` : ""}`;

  return (
    <form action={formAction} noValidate>
      {state.message && (
        <p role="alert" className="alert">
          {state.message}
        </p>
      )}
      {errorFields.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="alert" aria-labelledby="error-summary-title">
          <h2 id="error-summary-title">Please correct the following</h2>
          <ul>
            {errorFields.map((f) => (
              <li key={f}>
                <a href={`#${f}`}>{errors[f]}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="field">
        <label htmlFor="name">Event name (required)</label>
        <p id="name-hint" className="hint">Up to {EVENT_LIMITS.name} characters.</p>
        {errors.name && <p id="name-error" className="error">{errors.name}</p>}
        <input id="name" name="name" type="text" autoComplete="off" required aria-required="true" defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined} aria-describedby={describe("name")} />
      </div>

      <div className="field">
        <label htmlFor="date">Event date (required)</label>
        <p id="date-hint" className="hint">Choose a date, or type it as year-month-day, for example 2027-06-18.</p>
        {errors.date && <p id="date-error" className="error">{errors.date}</p>}
        <input id="date" name="date" type="date" required aria-required="true" defaultValue={values.date}
          aria-invalid={errors.date ? true : undefined} aria-describedby={describe("date")} />
      </div>

      <div className="field">
        <label htmlFor="location">Location (required)</label>
        <p id="location-hint" className="hint">Venue or address. Up to {EVENT_LIMITS.location} characters.</p>
        {errors.location && <p id="location-error" className="error">{errors.location}</p>}
        <input id="location" name="location" type="text" autoComplete="off" required aria-required="true" defaultValue={values.location}
          aria-invalid={errors.location ? true : undefined} aria-describedby={describe("location")} />
      </div>

      <div className="field">
        <label htmlFor="description">Description (optional)</label>
        <p id="description-hint" className="hint">Up to {EVENT_LIMITS.description} characters.</p>
        {errors.description && <p id="description-error" className="error">{errors.description}</p>}
        <textarea id="description" name="description" rows={5} defaultValue={values.description}
          aria-invalid={errors.description ? true : undefined} aria-describedby={describe("description")} />
      </div>

      <button type="submit" disabled={pending} className="button">
        {pending ? "Saving…" : "Save event"}
      </button>
    </form>
  );
}

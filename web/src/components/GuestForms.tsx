"use client";

import { useActionState, useEffect, useRef } from "react";
import { IMPORT_COLUMN, IMPORT_LIMITS } from "@/domain/csv";
import { GUEST_NAME_MAX, MAX_GUESTS_PER_EVENT } from "@/domain/guest";
import type { GuestFormState, ImportState, RenameState } from "@/server/guest-actions";

type Action = (previous: GuestFormState, formData: FormData) => Promise<GuestFormState>;

function NameField({ id, label, state, hint }: { id: string; label: string; state: GuestFormState; hint: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <p id={`${id}-hint`} className="hint">
        {hint}
      </p>
      {state.error && (
        <p id={`${id}-error`} role="alert" className="error">
          {state.error}
        </p>
      )}
      <input
        id={id}
        name="name"
        type="text"
        autoComplete="off"
        required
        aria-required="true"
        defaultValue={state.value ?? ""}
        aria-invalid={state.error ? true : undefined}
        aria-describedby={`${id}-hint${state.error ? ` ${id}-error` : ""}`}
      />
    </div>
  );
}

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
      <NameField id="guest-name" label="Guest name (required)" state={state} hint={`Synthetic names only in this prototype. Up to ${GUEST_NAME_MAX} characters.`} />
      <button type="submit" disabled={pending} className="button">
        {pending ? "Adding…" : "Add guest"}
      </button>
    </form>
  );
}

export function RenameGuestForm({
  action,
  eventId,
  guestId,
  currentName,
  initialState,
}: {
  action: (previous: RenameState, formData: FormData) => Promise<RenameState>;
  eventId: string;
  guestId: string;
  currentName: string;
  initialState?: RenameState;
}) {
  const [state, formAction, pending] = useActionState(action, initialState ?? { value: currentName });
  return (
    <form action={formAction} noValidate className="inline-form">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="guestId" value={guestId} />
      {state.message && (
        <p role="alert" className="alert">
          {state.message}
        </p>
      )}
      <NameField id="rename-name" label="Guest name (required)" state={state} hint={`Correct a spelling or typing mistake. Up to ${GUEST_NAME_MAX} characters. The guest and their check-in history stay the same.`} />
      <button type="submit" disabled={pending} className="button">
        {pending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

type PreviewAction = (previous: ImportState, formData: FormData) => Promise<ImportState>;

const SHOWN_NAMES = 25;

/** Step 1 upload, then a preview, then an explicit confirmation. Nothing is saved until the confirm button is used. */
export function ImportFlow({
  eventId,
  previewAction,
  confirmAction,
  initialPreview = {},
}: {
  eventId: string;
  previewAction: PreviewAction;
  confirmAction: PreviewAction;
  initialPreview?: ImportState;
}) {
  const [previewState, previewFormAction, previewing] = useActionState(previewAction, initialPreview);
  const [confirmState, confirmFormAction, confirming] = useActionState(confirmAction, {} as ImportState);
  const heading = useRef<HTMLHeadingElement>(null);
  const preview = previewState.preview;

  // When a preview or an error appears, move focus to it so keyboard and screen reader users land on the result.
  useEffect(() => {
    if (previewState.error || previewState.preview) heading.current?.focus();
  }, [previewState]);

  return (
    <>
      <section aria-labelledby="upload-title">
        <h2 id="upload-title">1. Choose a CSV file</h2>
        <ul className="rules">
          <li>One column, with the header <code>{IMPORT_COLUMN}</code> in the first row. Download the <a href="/example-guests.csv" download>synthetic example file</a>.</li>
          <li>UTF-8 text ending in .csv, up to {IMPORT_LIMITS.maxBytes / 1024} KB and {IMPORT_LIMITS.maxRows} guests per file. An event can hold {MAX_GUESTS_PER_EVENT} guests.</li>
          <li>Names only, and synthetic ones. Files with emails, phone numbers or other columns are refused.</li>
          <li>Names are never merged. If two rows have the same name, you get two guests (two real people can share a name). The preview tells you how many repeat.</li>
        </ul>
        <form action={previewFormAction} className="inline-form">
          <input type="hidden" name="eventId" value={eventId} />
          <div className="field">
            <label htmlFor="csv-file">CSV file (required)</label>
            <input id="csv-file" name="file" type="file" accept=".csv,text/csv" required aria-required="true" />
          </div>
          <button type="submit" disabled={previewing} className="button">
            {previewing ? "Checking…" : "Check file and preview"}
          </button>
        </form>
      </section>

      {previewState.error && (
        <div role="alert" className="alert">
          <h2 ref={heading} tabIndex={-1}>The file cannot be imported</h2>
          <p>{previewState.error}</p>
        </div>
      )}

      {preview && (
        <section aria-labelledby="preview-title" className="preview">
          <h2 id="preview-title" ref={heading} tabIndex={-1}>2. Preview</h2>
          <p>
            <strong data-testid="import-count">{preview.names.length}</strong> {preview.names.length === 1 ? "guest" : "guests"} will be imported into this event only.
          </p>
          {preview.duplicatesInFile > 0 && (
            <p>{preview.duplicatesInFile} rows in the file share a name with another row. They will be imported as separate guests.</p>
          )}
          {preview.matchExisting > 0 && (
            <p>{preview.matchExisting} names match guests already on this event's list. They will be added again as new guests. Cancel if that is a mistake.</p>
          )}
          {preview.invalid.length > 0 && (
            <div className="alert">
              <h3>{preview.invalid.length} {preview.invalid.length === 1 ? "row" : "rows"} will be skipped</h3>
              <ul>
                {preview.invalid.slice(0, 50).map((r) => (
                  <li key={r.row}>
                    Row {r.row}: {r.reason}
                  </li>
                ))}
              </ul>
              {preview.invalid.length > 50 && <p>…and {preview.invalid.length - 50} more.</p>}
            </div>
          )}
          <h3>Names to import</h3>
          <ol className="preview-names">
            {preview.names.slice(0, SHOWN_NAMES).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
          {preview.names.length > SHOWN_NAMES && <p>…and {preview.names.length - SHOWN_NAMES} more.</p>}

          {confirmState.error && (
            <p role="alert" className="alert">
              {confirmState.error}
            </p>
          )}
          <form action={confirmFormAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="submissionId" value={preview.submissionId} />
            <input type="hidden" name="names" value={JSON.stringify(preview.names)} />
            <button type="submit" disabled={confirming} className="button button-large">
              {confirming ? "Importing…" : `Import ${preview.names.length} ${preview.names.length === 1 ? "guest" : "guests"}`}
            </button>
          </form>
          <p className="hint">Nothing has been saved yet. Choose another file above to start again.</p>
        </section>
      )}
    </>
  );
}

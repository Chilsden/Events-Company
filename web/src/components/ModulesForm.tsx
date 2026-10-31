"use client";

import { useActionState } from "react";
import { PRESETS, type ModuleKey } from "@/domain/modules";
import type { ModuleView } from "@/server/modules-repository";
import type { ModulesState } from "@/server/module-actions";

type Action = (previous: ModulesState, formData: FormData) => Promise<ModulesState>;

/**
 * Which inputs this event collects. Built inputs have tick boxes; planned ones are listed as text only and cannot be
 * switched on. Quick choices set several at once. The server checks every request again.
 */
export function ModulesForm({ action, eventId, modules, initialState = {} }: { action: Action; eventId: string; modules: ModuleView[]; initialState?: ModulesState }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const built = modules.filter((m) => m.implemented);
  const planned = modules.filter((m) => !m.implemented);
  const nameOf = (key: ModuleKey) => modules.find((m) => m.key === key)?.label ?? key;

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="eventId" value={eventId} />
      {state.error && (
        <p role="alert" className="alert">
          {state.error}
        </p>
      )}

      <section aria-labelledby="quick-title">
        <h2 id="quick-title">Quick choices</h2>
        <div className="presets">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
            <div key={key} className="preset">
              <button type="submit" name="preset" value={key} className="button button-secondary button-large" disabled={pending}>
                {PRESETS[key].label}
              </button>
              <p className="hint">{PRESETS[key].description}</p>
            </div>
          ))}
        </div>
      </section>

      <fieldset className="modules">
        <legend>Inputs that are available</legend>
        {built.map((m) => (
          <div key={m.key} className="choice">
            <input type="checkbox" id={`module-${m.key}`} name={`module_${m.key}`} defaultChecked={m.enabled} aria-describedby={`module-${m.key}-hint`} />
            <label htmlFor={`module-${m.key}`}>{m.label}</label>
            <p id={`module-${m.key}-hint`} className="hint">
              {m.description}
              {m.requires ? ` Needs: ${nameOf(m.requires)}.` : ""}
            </p>
          </div>
        ))}
      </fieldset>
      <p>
        <button type="submit" className="button button-large" disabled={pending}>
          {pending ? "Saving…" : "Save inputs"}
        </button>
      </p>
      <p className="hint">Switching an input off stops new entries through it. Everything already collected is kept.</p>

      <section aria-labelledby="planned-title">
        <h2 id="planned-title">Planned, not available yet</h2>
        <ul className="planned">
          {planned.map((m) => (
            <li key={m.key}>
              <strong>{m.label}</strong>: {m.description}
            </li>
          ))}
        </ul>
      </section>
    </form>
  );
}

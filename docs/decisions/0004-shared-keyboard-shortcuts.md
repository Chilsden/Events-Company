# 0004 Shared keyboard shortcut capability

- Status: accepted (capability); conventions, default key bindings and operator control sessions are proposed
- Date: 2026-10-30
- Decided by: founder (Phase 0 notes)

## Context

Presenters and operators need fast control during live events. Shortcuts were first discussed for Lucky Draw but apply to several products.

## Decision

Keyboard shortcuts are a shared platform capability used by multiple products, not a Lucky Draw feature.

- Consistent conventions, a visible reference, and configurable bindings where practical.
- Keyboard, touch and tablet alternatives.
- Protection against accidental activation, focus awareness for text entry, and confirmation for consequential actions.
- Control mode is separate from public display mode. A public display link never grants control.

The default keys in the master spec section 5.5 are proposals to validate, not decisions.

**Conventions (proposed, 2026-10-30, from independent review F-16):**

- The same key means the same thing in every product. `Space` advances or pauses, `R` reveals, `Esc` goes back or cancels.
- Consequential actions (reset, mark absent, re-draw, end session) are never on a bare key. They use `Shift` plus a key, always open a confirmation, and need a reason where one is recorded.
- Held keys do not repeat a command (key-repeat events are ignored) and controls lock while a command is in flight. The server also rejects repeats (architecture 14).
- Every shortcut has a button, touch or tablet alternative.

**Operator control session (proposed, needs Phil's approval):** a presenter who is not an account owner or event collaborator can be given a scoped control session for one event and named capabilities (for example `draw`). It expires, is revocable, and exposes only what the console needs. This avoids making venue staff collaborators with wide access.

## Consequences

- One shortcut service in the front end, with per-product bindings.
- Privileged actions are authorised on the server, whatever the key pressed.
- Backlog D-17 (operator control sessions) and updated I-07.

## Evidence / sources

Phase 0 notes (founder prompt); master spec 5.5.

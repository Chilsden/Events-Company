# Independent review: configurable Check-in Studio inputs (T-050)

- Branch: `task/mvp-configurable-inputs` (uncommitted working tree on top of 4d13693)
- Reviewer: independent reviewer, fresh context, did not write the code. Date 2026-10-31.
- Scope: prompt `docs/prompts/mvp-checkin-configurable-inputs.md` (stages 2 to 9), CLAUDE.md, ADR 0021 to 0024, previous review, README, checklist, migrations 0001 to 0005, all of `web/src`, `web/tests`, `web/scripts/smoke.mjs`, ledger T-050, and `git diff HEAD` for every changed file.
- `docs/prompts/mvp-signature-mosaic-first-slice.md` was not treated as an instruction.
- Method: reading, `tsc`, full `vitest`, `next build`, `npm run smoke`, one temporary mutation (restored and verified). Everything else about the database is by reasoning on PostgreSQL semantics; nothing was run on real PostgreSQL.

## Verdict

The slice meets the critical requirement and the prompt's stages. A signatures-only event needs no guest name, registration, RSVP, attendance, email, phone or guest selection. Contributions are anonymous (`guest_id` null, no placeholder guest; verified in code, the unit test that counts guests, and smoke). Module enforcement is on the server in the same transaction, and for contributions also in the database. Documentation is honest about browser, touch and screen-reader testing. Reported counts reproduce exactly (341 tests in 13 files, 98 smoke checks).

No Critical and no High finding. Three Medium findings, several Low.

## Findings

### Critical
None.

### High
None.

### Medium

**M1. The visitor-facing collection screen lists every guest name in a dropdown.**
`web/src/app/events/[id]/check-in/collect/page.tsx` lines 28 to 29 pass every guest's name to `SignatureCapture` (`web/src/components/SignatureCapture.tsx` lines about 163 to 175, the "Who is signing?" select) whenever the guest list is on. The collection screen is meant for visitors. The stated product direction is that the same screen could later be reached from visitors' own devices (O-23-2). Showing the full guest list there discloses guest data to people who do not need it (CLAUDE.md section 6, purpose-limited access). It does not breach the signatures-only requirement (the select is absent when the guest list is off). Fix: do not render the guest picker by default. Make it an explicit organiser option, for example a per-event setting or a search-as-you-type limited to one match, and say in ADR 0024 that the picker is organiser-only. Until then, state it as a known limitation in README.

**M2. "Planned modules cannot be used" and the dependency rule are enforced only in application code, not in the database.**
`web/migrations/0005_modules_and_contributions.sql`: `event_modules` has no check tying `enabled` to built modules, and `contributions.kind` allows `photograph` and `video` with any `storage_ref` string. The application role has `update (enabled, updated_at)` on `event_modules` and `insert` on `audit_events`. With direct SQL (for example after an injection bug) it can run `update event_modules set enabled = true where module = 'photograph'`, insert a matching `module_enabled` audit row (the real-change trigger accepts it because the row was changed in this transaction), and then insert a `photograph` contribution with an arbitrary `storage_ref` and a permission row. ADR 0024 says enforcement is "on the server and in the database". That holds for "a contribution needs its module on", not for "only built modules". Same gap for "attendance needs guest_registration". Fix: add `check (not enabled or module in ('guest_registration','attendance','signature'))` to `event_modules` (extend it by migration when a module is built) and `check (kind = 'signature')` on `contributions` until other kinds exist, or a trigger for the attendance dependency. Or reword ADR 0024 and README to say the database enforces the module switch for contributions only.

**M3. The "submit another signature" step (journey step 10) and the confirmation depend on client behaviour that no test exercises.**
`SignatureCapture` keeps `strokes` and `step` in React state. After a successful submit the action calls `redirect(.../collect?r=...)` to the same route. Whether the client component is remounted (empty pad, back on the draw step) or keeps the old strokes and preview depends on Next.js client router behaviour for a same-route navigation with changed search parameters. Smoke only checks the server-rendered HTML of the redirect target, and jsdom tests never run the action. The checklist (step 33, "a fresh empty box") correctly puts this in front of a human, and the README discloses that no browser was used, so this is a verification gap and not a misstatement. Fix: confirm manually before relying on it; for robustness reset local state on success (for example key the component on `?r`, or clear state in an effect when `state` transitions to success) instead of relying on remounting.

### Low

**L1. The database accepts non-numeric content inside `strokes`.** `contributions` check constraints verify only object shape, keys `v`/`strokes`, 1 to 50 strokes, and size. A string such as `"<script>"` can be stored inside a point by any writer that bypasses the application's `parseSignaturePayload`. This is an acceptable gap because the application validates before writing, and every render goes through `strokesFromStored` (re-validation) and `strokesToPaths` (numbers only), so stored hostile content is never drawn: `SignatureViews.tsx` re-checks, and `signature.test.ts` and `signature-capture.test.tsx` cover it. ADR 0024 ("so no script, link or markup can be stored or shown") overstates the storage half at database level. Optionally add a jsonb path check (for example `jsonb_path_exists(content, '$.strokes[*][*][*] ? (@.type() != "number")')` negated), or soften the ADR wording.

**L2. The module audit rule accepts a no-op change.** `audit_events_describe_real_change` for `module_enabled`/`module_disabled` checks that the row's xmin is this transaction and `enabled` equals the new state. `update event_modules set updated_at = now()` on an already-enabled row (the app role has that column grant) plus a `module_enabled` audit row passes, recording a change that did not happen. Fix: also compare against the previous state, for example by requiring that `event_modules_require_audit` fired for a distinct value, or drop `updated_at` from the app's grant and set it in a trigger.

**L3. The xmin-based audit evidence is fragile.** `m.xmin::text::bigint = (txid_current() & 4294967295)` (and the same for `contributions`, `guests`) works for top-level transactions. A row written inside a savepoint carries the subtransaction id, so the audit insert would be refused. No current code uses savepoints, but a future change that does will fail with "audit record without a matching change". Add a test or a comment recording the limit.

**L4. Concurrency of double revoke is protected only by an application advisory lock.** `contributions-repository.ts` `revokeDisplayPermission` takes `pg_advisory_xact_lock` so the second revoke sees `revoked`. The deferred `contribution_permissions_order` trigger itself reads only committed rows at commit time, so two writers that did not take the lock could both commit a `revoked` row (the trigger runs at commit and compares to committed rows with a smaller `seq`; each would only see `granted` if the other had the higher `seq`). The application role could do that with direct SQL. Consequence is a duplicate revoked entry, not a re-eligible contribution (latest still `revoked`). The test "a burst of revokes records exactly one" runs on single-connection PGlite and so cannot show real concurrency; README and ADR do say so. Fix: a partial unique index on `(contribution_id, purpose) where change = 'revoked'` (and one for first-choice rows) makes the database the arbiter.

**L5. Real PostgreSQL lock analysis (no defect found; one theoretical deadlock).** `submitSignature` takes `select ... for share` on the `signature` row (and then `guest_registration`); `setModules` takes `select ... for update` on all eight rows of the event, in unspecified order. Under READ COMMITTED a submit that arrives while a switch-off transaction holds the lock waits, then re-evaluates the row version, sees `enabled = false` and throws `ModuleDisabledError`; the opposite order makes the switch-off wait for the submit, which is then serialised before it. The unlocked `contributions_require_module` trigger is a backstop. The `for share` also needs the UPDATE column privilege and policy, both granted. A theoretical lock-order deadlock exists (submit holds `signature` share and waits for `guest_registration`, while `setModules` holds `guest_registration` for update and waits for `signature`); PostgreSQL would abort one with a generic "could not be saved". Fix if desired: lock rows in a fixed order (`order by module`) in `setModules`.

**L6. A test that does not exercise what its name says.** `tests/contributions.test.ts` "a stored signature is drawn from numbers only: hostile text in a field cannot reach the picture" stores a legitimate signature and checks the output matches a numeric regular expression. It cannot fail on hostile data. The real protection is tested elsewhere (`signature.test.ts` `strokesFromStored` with `<img onerror=x>`; `signature-capture.test.tsx` SignatureImage with hostile points). Fix: insert hostile content as the database owner (the check constraints allow it, see L1) and assert `listContributions` returns `strokes: null`.

**L7. Weak smoke assertion.** `scripts/smoke.mjs`, "checking in through the signatures-only event is refused", accepts either "switched off" or "could not be found". A missing `requireModule` in `checkInGuest` would still pass because a guest from another event is "not found". `tests/modules.test.ts` ("attendance off: no check-in or undo") does cover it at repository level. Tighten the smoke check to require "switched off".

**L8. Accessibility details.**
- `ContributionViews.tsx`: signature cards use `h3` directly under the page `h1` (skips `h2`).
- `SignatureCapture.tsx`: a permission error is shown twice (top `role="alert"` and inside the fieldset); focus goes to the top one only. Harmless but noisy for screen readers.
- Keyboard drawing announces only pen down/up, undo and clear, not position; the pad itself is `aria-hidden` inside a focusable `role="group"`. This is disclosed as untested and as not usable with a screen reader alone, which is accurate.
- `addPoint` calls `setNotice` inside a state-updater function (side effect in an updater; double invocation in React strict mode only repeats the same message).
- Nothing in the UI or docs claims screen-reader accessibility. Good.
- No new colours were added: `globals.css` additions use existing tokens (`--accent`, `--fg`, `--bg`, `--card`, `--border`, `--muted`). `.button-secondary` is pre-existing. Existing pairs (for example `#767676` border on white, about 4.5:1) were not recomputed for this slice and colour contrast cannot be checked by jsdom/axe; the checklist has a manual dark-mode step.

**L9. Ledger omits one changed file.** The ledger row says existing tests were adjusted only for the new migration count, audit columns and the earlier-slice upgrade test. `web/vitest.config.ts` also changed (test timeout 30000 to 60000, hook timeout added). Justified (the suite is slow), but should be mentioned.

**L10. Forms are all-or-nothing and a partial POST switches things off.** `saveModulesAction` treats a missing `module_*` field as "off" for every built input. A stale page or a hand-built POST without the three tick boxes switches the guest list, attendance and signatures off (data kept, audited). This is by design and documented in the action's comment, but consider a confirmation or an "unchanged" hidden snapshot to catch stale forms.

## Requirement-by-requirement check

| Item | Result |
|---|---|
| Signatures-only, no guest name/registration/RSVP/attendance/email/phone/guest selection | Met. Guest select rendered only when the guest list is on; signature action reads only eventId, payload, permission, optional guestId. Test "does not require or accept a name, email or phone number" and smoke confirm. |
| Anonymous contributions, no placeholder guest | Met. `guest_id` nullable; test counts zero guests after submitting. |
| 10-step organiser journey | Server side proved by smoke (create, preset, collect page, refused/accepted submissions, redirect, second submission). Steps 4 to 6 and 10 as seen by a user are not browser-tested (M3). |
| Default and migration of existing events | Met. Migration inserts eight rows per existing event (guest list and attendance on); trigger does the same for new events (also plain-SQL inserts); upgrade test passes. Rationale documented in ADR 0024 and README. |
| Planned modules not usable | Met in UI and application code (checked on server, tampered form refused, smoke). Not enforced in the database (M2). |
| Server-side enforcement, not only hidden controls | Met for guest add/import/rename (`guest_registration`), check-in/undo (`attendance`), signatures (`signature`), all via `requireModule` in the same transaction; replayed forms tested in smoke. |
| Disabling keeps data; per-event isolation | Met and tested (contributions, guests, check-ins, history kept; other event and other account unchanged; revoke still works after switch-off). |
| Consent: no preselection, purpose/status/wording version/provenance/timestamp, revocation, eligibility, audit | Met. Radios have no default; the server rejects missing/other values; permission row has all fields; `revoked` only after `granted`; the view `eligible_contributions` uses the latest row; audit records both submit and revoke. |
| No claim the operator is a verified guest or that demo permission is consent | Met. Provenance `local_demo_operator_synthetic` (check-constrained), wording says "not real consent", page notice, README and ADR agree. |

## Migration 0005 review (item 2)

- `events_default_modules` (after insert on events, not deferred): correct; the app role needs insert on `event_modules`, and cannot pre-insert rows for a new event (the trigger's rows would collide on the primary key, failing the statement).
- `contributions_require_module` (before insert): correct as a backstop; plain select, so it relies on the application's `for share` lock for race-free behaviour (L5).
- `contributions_require_choice` (deferred constraint trigger, `tx_id = txid_current()`): the app cannot set `tx_id` (no column grant), so a choice cannot be invented for an existing contribution; for an existing contribution the order trigger rejects a second `granted`/`denied`. Correct.
- `contribution_permissions_order` (deferred): rejects first `revoked`, repeated choice, `revoked` not after `granted`; ordering by `seq`. Residual concurrency note in L4. A revoked contribution cannot become eligible again: no `granted` can follow any entry.
- `event_modules_require_audit` (deferred, update of enabled): correct for a real flag change; no-op gap L2.
- `audit_events_describe_real_change`: new branches correct for single-level transactions (L3). Earlier guest/attendance logic is preserved unchanged.
- `eligible_contributions`: `security_invoker = true`, granted to `events_app` only; tests prove account separation and no-account-setting returns zero rows. `select c.*` is expanded at creation, so future added columns will not appear without recreating the view (acceptable, note for later migrations).
- Column grants: contributions insert limited to `account_id, event_id, guest_id, kind, content, storage_ref` (no actor/source/created_at/id); permissions insert excludes `seq`, `occurred_at`, `tx_id`; `event_modules` update limited to `enabled, updated_at`; no delete anywhere; no `truncate`. Tested.
- Forced RLS on all three new tables, with select/insert (and update for modules) policies by `app.account_id`. No policy for update/delete on the other two tables.
- Composite foreign keys tie contributions to (event, account), guest to (guest, event, account), permissions and audit to the contribution's event and account. Tested.
- Immutability: row and truncate triggers on both tables, and no grants for the app role. Owner-run update/delete/truncate are also refused (tested).
- jsonb: see L1.
- Escalation: the app role cannot create roles, alter tables or disable triggers (not owner), cannot change `tx_id`/`seq`. The M2 route needs only existing grants.

## Signature validation review (item 3)

Checked `web/src/domain/signature.ts`: the 120,000-character limit is applied before `JSON.parse`; non-string input is refused; numbers must be real JSON numbers (strings, null, nested values refused); `NaN`/`Infinity` cannot appear in JSON, and `1e999` parses to Infinity and is refused by `Number.isFinite`; `Object.keys(record)` rejects `__proto__` (JSON.parse makes it an own key), duplicate keys collapse to the last value and only `strokes` is allowed; stroke, point and total-point limits, and the minimum-extent rule (diagonal at least 20) reject dots and scribbles; coordinates are range-checked before rounding to 0.1; repeated points are dropped. Deeply nested JSON is refused structurally and cannot exceed 120 KB, and V8's JSON parser is not stack-recursive for that size, so no practical parser DoS. Stored data is re-validated by `strokesFromStored` before drawing, and `strokesToPaths` only emits `M`, `L`, digits, dots and spaces. SVG is built from numbers only, with `role="img"` and an aria-label containing only a date. No finding beyond L1 and L6.

## Server actions (item 4)

Only the intended async functions are exported from the `"use server"` files (`contribution-actions.ts`: `submitSignatureAction`, `revokePermissionAction`; `module-actions.ts`: `saveModulesAction`). Exported interfaces are types only. Event ids are UUID-checked before use in the `redirect` path. Errors returned or logged are fixed strings (log carries only `error.name`); tests assert that input is never echoed. Tick-box tampering: a posted `module_drawing` reaches `setModules` and is refused with "planned but not built yet"; `module_constructor` is refused as unknown; `module___proto__` is harmlessly dropped. Unknown preset refused. `permission` must be exactly `granted` or `denied`. A posted `guestId` is validated for UUID, event, account and guest-list-on both in code and by the composite foreign key. Receipts are random, per-event and time-limited; a forged `?r=` or `?notice=` shows nothing (smoke).

## Existing pages and tests

Check-in Studio pages hide guest list sections, import and attendance totals when modules are off, and show an explanatory notice; guest actions refuse with plain messages. The seven edits to pre-existing tests (migration list and counts; the audit-column list; the upgrade-test file filter `n < "0004"` and the applied list; `AuditEntry` fields in the accessibility test; timeouts) are each justified. The old guest-management suite otherwise runs unchanged and passes.

## Rename (item 7)

Applied in CLAUDE.md (diff is exactly `- Signature Mosaic` to `- Mosaic`, one line), spec, backlog, risks, architecture, README and UI text. Remaining "Signature Mosaic" mentions are historical (ADR 0002 and 0017 with added notes, ledger rows T-013/T-035/T-050, spec conflict row C-4 with a rename note, ADR 0023's own text). The ShareWall boundary is explicitly flagged as open question O-23-1 in ADR 0023 and not silently resolved; the spec section 4.2 carries a banner that detailed requirements were not rewritten. Backlog section G not re-estimated (disclosed). The founder prompt `docs/prompts/mvp-signature-mosaic-first-slice.md` is untracked and unused; stage only explicit paths so it is not committed by accident.

## Honesty of documents (item 8)

README (341 tests, 98 smoke checks, no browser/touch/screen-reader testing, PGlite single connection, 7-minute suite), ADR 0023/0024 (status "proposed", demonstration permission not consent, erasure not designed) and ledger T-050 ("in verification", review pending) match what I observed, with the wording caveats in M2 and L1 and the omission in L9. Checklist steps 25 to 42 cover the Stage 10 items and are presented as manual.

## Secrets and generated files (item 9)

No secrets, tokens or personal data found in new or changed files; all data is synthetic (names such as "Alex Example"). `.data/`, `.next/`, `node_modules/`, `*.tsbuildinfo` and `next-env.d.ts` are git-ignored. The untracked list contains only intended source, test, migration and doc files plus the unrelated earlier founder prompt. `web/AGENTS.md` appears in the `web` folder; it is not in the status output (ignored or tracked), so not a concern.

## What I ran and observed

All in `web/`, synthetic data, local only.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, no output |
| `npx vitest run` (full suite) | 13 test files passed (13), 341 tests passed (341), duration 383 s, exit 0 |
| `npm run build` | succeeded; routes listed include `/events/[id]/check-in/collect`, `/contributions`, `/modules` |
| `npm run smoke` | "98 of 98 smoke checks passed" (includes restart checks and the signatures-only journey) |
| Mutation: in `src/server/contributions-repository.ts` replaced the `isModuleOn(... "guest_registration")` guard by `if (false)` | `npx vitest run tests/contributions.test.ts`: 1 failed, 31 passed. Failed test: "refuses a guest link when the guest list is switched off". File restored from a copy; `sha256sum -c` reported OK (the file is untracked, so `git diff` could not be used for verification). |

The mutation list below was reasoned about, not run: removing `requireModule(... "signature")` in `submitSignature` fails "raises ModuleDisabledError" and the module tests (the database trigger still blocks storage); removing `requireModule` in `checkInGuest`/`undoCheckIn` fails the "attendance off" test (but not the smoke check, see L7); allowing `permission` values other than granted/denied fails "refuses a missing or invalid permission choice"; removing the `account_id` filter in `listEligibleContributions` is caught only by the test that disables row-level security, which exists; removing the `p.purpose = ...` filter in `LATEST` is not distinguishable today because only one purpose exists (no test could fail; harmless until a second purpose is added); changing a stroke limit constant would be caught by the limit tests.

## What I could not check

- Real browser, mouse/touch/pen behaviour, pointer capture, `touch-action`, focus handling, and whether the component remounts after redirect (M3). No browser tooling was used.
- Screen reader behaviour, colour contrast of rendered pages, and responsive layouts (checklist items 40 to 42 remain manual).
- Real PostgreSQL: the READ COMMITTED lock behaviour, deferred trigger behaviour under concurrent transactions, xmin/`txid_current` semantics outside PGlite, and the RLS-with-`for share` privilege check were reasoned, not run.
- Server-action CSRF/Origin handling beyond Next.js defaults.
- The remaining mutations listed above were not executed.

# 0024 Configurable Check-in Studio inputs and the shared contribution model

- Status: proposed (implemented in the local prototype on synthetic data under the founder's prompt; needs privacy and technical validation before real data)
- Date: 2026-10-31
- Decided by: founder asked for the capability; the design below is the Software Engineer and Solution Architect's, awaiting founder review
- Builds on: [0021](0021-checkin-first-slice-guest-and-check-in-model.md), [0022](0022-checkin-guest-management-undo-audit-import.md), [0023](0023-mosaic-rename-and-check-in-studio-collection.md)

## Context

Check-in Studio must collect only what an event needs. The key case: **an event that collects signatures only**, with no guest names, registration, RSVP or attendance. Contributions must be able to exist without a guest, and permission to display them must be explicit, specific to a purpose, and withdrawable.

## Decision (for this prototype)

### Modules (per-event configuration)

Eight inputs, each on or off per event: guest details and registration; RSVP and attendance check-in; signature capture; drawing capture; photograph capture or upload; short video recording or upload; text messages; purpose-specific consent. **Built:** guest registration, attendance, signature capture. **Planned** (listed as text, no control, cannot be switched on): the other five.

- **Where it lives:** table `event_modules`, one row per event and module (8 rows per event), changed only together with an audit record.
- **Default and rationale.** Every event has explicit rows. Existing events (migration) and new events start with guest registration **on**, attendance **on**, everything else **off**. Rationale: existing events must keep working exactly as before; a new event keeps the behaviour organisers already know; signature capture and the planned inputs are switched on by an explicit choice, so nothing is collected "silently". The database inserts the rows when an event is created, whatever code creates it. The Inputs page offers quick choices ("Signatures only", "Guest list and check-in", "Guest list, check-in and signatures").
- **Rules.** Only built modules can be switched on, and attendance needs the guest list: both are enforced **in the database** (a check constraint on `event_modules`, and a trigger checked at commit) as well as in the application. Making another module switchable therefore needs a migration. Because a planned module can never be on, a photograph or video contribution cannot be stored at all yet. Changes are all-or-nothing and per event; one event's setting never affects another.
- **Switching off** stops new entries through that module and deletes nothing: guests, check-ins, contributions and permission history are kept and still readable; contributions can still have their permission withdrawn.
- **Enforcement is on the server and in the database, not only in the page.** The repository functions check the module inside the same transaction (a shared row lock, so a switch-off in progress is waited for). Guest actions need the guest list (add, import, rename) or attendance (check in, undo). A contribution cannot be stored unless its module is on (database trigger as well). A hidden control is never the protection; the smoke test replays forms to prove it.

### Contributions (shared, not guest-based)

Table `contributions`: id, account, event, **optional** guest, kind (signature, drawing, photograph, video, text message), `content` (safe validated data) or `storage_ref` (reserved for photographs and video), source (`check_in_studio`), actor (`local_demo_operator`), created time. Never updated or deleted. A guest link, if present, must belong to the same event and account (composite foreign key), and linking needs the guest list on. **No placeholder guest records are made.** The collection screen never lists guests (it is where visitors sign): a signature is linked to a guest only when the organiser opens the screen from that guest's row ("Take a signature"), which shows only that one guest's name. Only signatures are implemented; the others have no storage infrastructure yet, only a column reserved for an object-store reference.

- **Safe format.** A signature is pen strokes: lists of numbers on a fixed 600 x 240 area. The server accepts nothing but `{"strokes": [...]}`, checks every number, rounds it, and limits strokes, points and size; a dot or tiny mark is refused as empty. The database re-checks the shape (only `v` and `strokes`, 1 to 50 strokes, 200,000 characters at most). The picture is drawn from the numbers only, and re-validated before drawing, so no script, link or markup can be stored or shown.
- **Anonymous.** The collection screen asks for nothing about the visitor.

### Display permission (purpose-specific, append-only)

Table `contribution_permissions`: each change is a new row: `granted` or `denied` (the explicit choice at submission, no default, both unselected) and later `revoked`; with purpose (`mosaic_public_display_demo`), wording version (`demo-v1`), provenance (`local_demo_operator_synthetic`) and time. A contribution cannot exist without its first choice (deferred trigger); `revoked` can only follow `granted`; rows cannot be changed, deleted or truncated. Submission and withdrawal also write audit records (`contribution_submitted`, `display_permission_revoked`). **This is a demonstration permission recorded by the local operator. It is not consent from a verified person and not legally valid consent**; the provenance value says so, the page says so, and the planned "purpose-specific consent" module is where a real flow belongs.

### Downstream eligibility (what Mosaic and Event Gallery may use)

One database view, `eligible_contributions` (security-invoker, so row-level security applies to the caller): contributions whose **latest** permission for the purpose is `granted`. Denied, withdrawn and never-asked contributions are excluded. The organiser page shows "Eligible for display by other products: X of Y". Mosaic and Event Gallery are not built here; when they are, they read this view, not the table.

### Security

All new tables have forced row-level security by account, composite foreign keys tying rows to their event and account, and narrow grants to the application role (no update or delete on contributions or permissions; only the enabled flag of a module). Audit records about modules, submissions and withdrawals are accepted only for a change really made in the same transaction (same rule as 0022).

## Not decided / deferred

Real consent and identity; contribution links on visitors' phones (needs public access tokens, abuse and rate controls); drawing, photograph, video and text inputs and their storage, scanning and size limits (spikes S-04, S-13); moderation; retention and deletion of contributions (a contribution cannot be deleted at all yet, so erasure is not designed, see 0014); Mosaic composition and display; Event Gallery; a shared multi-process receipt store.

## Consequences

- A signatures-only event works end to end with no guest data.
- Existing guest-management behaviour is unchanged for events with the guest list and attendance on (the default).
- The contribution table is immutable by design; deleting a contribution for erasure needs a designed, audited route (0014) before real data.
- PGlite is single-connection: concurrency behaviour on production PostgreSQL is untested here as before. The "audit record matches a real change" rule compares the row's `xmin` with the current transaction id, so it would not work for a change made inside a savepoint or sub-transaction; the application does not use savepoints. A module audit record can describe a switch to the value the module already has (a no-op); the application never writes one.
- The "Inputs" form treats an unticked box as off. A partial or hand-made request that omits a built input switches it off (nothing is deleted); the rules above still apply.

## Evidence / sources

Migration `web/migrations/0005_modules_and_contributions.sql`; tests `web/tests/modules.test.ts`, `contributions.test.ts`, `contribution-actions.test.ts`, `signature.test.ts`, `signature-capture.test.tsx`; architecture sections 4, 5, 8, 24, 25.

# Events Company — Check-in Studio Configurable Inputs

## Founder decision

Proceed with the next MVP development slice.

Check-in Studio must evolve into a modular, configurable event input platform.

An organiser must be able to enable only the functionality required for an event.

**Critical requirement: An event can be configured for signature collection only, without guest registration, guest names, RSVP or attendance tracking.**

Check-in Studio is the exclusive collection interface for contributions consumed by Mosaic.

Mosaic is a separate product responsible for arranging permitted contributions into visual compositions such as shapes and logos.

The product is called **Mosaic**, not Signature Mosaic.

Mosaic supports:
- Signatures
- Drawings
- Photographs
- Short video clips

Do not introduce a separate contribution-capture interface in Mosaic.

## Objective

Deliver a working configurable Check-in Studio experience:

**Create event → Configure enabled inputs → Open collection screen → Submit signature → Save contribution.**

The first implementation must demonstrate a signature-only event.

Preserve the existing guest registration, CSV import, attendance, undo and audit functionality.

Use synthetic data only.

## Stage 1 — Establish the baseline

Read:

- `CLAUDE.md`
- `docs/MVP-MASTER-SPEC.md`
- `docs/planning/MVP-DELIVERY-BACKLOG.md`
- `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md`
- `docs/decisions/0020-mvp-implementation-stack.md`
- `docs/decisions/0021-checkin-first-slice-guest-and-check-in-model.md`
- `docs/decisions/0022-checkin-guest-management-undo-audit-import.md`
- `web/README.md`
- Relevant application code, migrations and tests
- `docs/task-ledger.md`

Inspect the current implementation before changing it.

Use a dedicated task branch containing the latest guest-management implementation.

Do not merge into main.

Identify existing specification references to "Signature Mosaic" and report those requiring the approved rename to "Mosaic".

Update relevant active product documentation and UI terminology within this task. Preserve historical decision records, adding superseding notes where appropriate rather than silently rewriting history.

## Stage 2 — Design configurable modules

Introduce event-level configuration for Check-in Studio.

The architecture must support independently enabled modules:

1. Guest details and registration
2. RSVP and attendance/check-in
3. Signature capture
4. Drawing capture
5. Photograph capture/upload
6. Short video recording/upload
7. Text messages
8. Purpose-specific consent

Not every module needs a complete user interface in this slice.

Implement the configuration framework and the signature module.

The other modules may be represented as planned capabilities, but must not appear as usable controls until implemented.

Do not require guest registration or attendance for media contributions.

A contribution must be able to exist without a guest record.

### Configuration requirements

- Each event has its own module configuration.
- Organisers can view and change the enabled modules.
- The collection interface displays only enabled and implemented inputs.
- Existing guest-management functionality remains available when configured.
- Disabling a module prevents new submissions through that module.
- Disabling a module must not automatically delete previously collected data.
- Configuration changes are persisted.
- Server-side checks enforce module configuration; hiding a control in the UI is insufficient.
- A configuration change for one event must not affect another event.
- Account and event isolation must be maintained.

### Default behaviour

Existing events must retain their current registration and check-in functionality after migration.

New events should have an explicit, understandable configuration rather than silently enabling every possible input.

Document the selected default and rationale.

## Stage 3 — Signature-only event

Implement a complete signature-only journey.

An organiser must be able to:

1. Create an event.
2. Configure Check-in Studio to collect signatures only.
3. Open the event's collection screen.
4. Draw a signature.
5. Clear or undo strokes.
6. Preview the contribution.
7. Confirm the applicable demonstration display permission.
8. Submit the signature.
9. See a successful submission confirmation.
10. Submit another signature without registering a guest.

### Important constraints

Do not require:

- Guest name
- Email address
- Phone number
- Guest registration
- RSVP
- Attendance check-in
- Guest selection

Anonymous contributions must be supported.

Do not create placeholder guest records to work around the optional guest relationship.

Use mouse, touch and pointer input where supported.

Validate signature payloads on the server.

Reject empty, invalid and oversized contributions.

Store signatures in a safe format that cannot execute scripts.

Do not use real signatures during development or testing.

## Stage 4 — Shared contribution model

Introduce a reusable contribution model for Check-in Studio.

It must support:

- Contribution UUID
- Account UUID
- Event UUID
- Optional guest UUID
- Contribution type
- Creation timestamp
- Storage reference or safe content representation
- Display permission status and purpose
- Revocation state
- Relevant provenance and audit information

Supported contribution types:

- Signature
- Drawing
- Photograph
- Short video
- Text message

Implement persistence for signatures in this slice.

Design extension points for other contribution types without building unnecessary storage infrastructure.

Avoid a schema that assumes every contribution is a guest signature.

Contributions must be associated with the event and account even when no guest is identified.

### Cross-product requirement

Check-in Studio owns contribution capture.

Mosaic and Event Gallery will consume permitted contributions through a shared, access-controlled interface.

A contribution should not need to be uploaded again for another product.

Do not implement Mosaic generation or Event Gallery in this task.

## Stage 5 — Consent and revocation

Consent must be purpose-specific.

A contribution must not become eligible for public display merely because it was submitted.

For the synthetic prototype:

- Present clear demonstration display-permission wording.
- Require an explicit choice before public-display eligibility.
- Record purpose, status, wording version, provenance and timestamp.
- Do not preselect permission.
- Allow a demonstration contribution's display permission to be revoked.
- Exclude revoked or unpermitted contributions from downstream eligibility queries.
- Preserve appropriate audit evidence of permission changes.

Do not claim that the local demonstration operator is a verified guest or that synthetic demonstration permission establishes legally valid consent.

A real consent and identity flow remains required before using genuine guest contributions.

## Stage 6 — Collection interface

Create a dedicated Check-in Studio collection interface that adapts to the event's configuration.

Requirements:

- Only enabled and implemented modules appear.
- Signature-only mode has no guest registration fields.
- Clear navigation back to event management.
- Touch-friendly controls.
- Responsive layout.
- Keyboard-accessible surrounding interface.
- Accessible labels and status messages.
- Clear empty, loading, success and error states.
- UK English.

A drawing canvas may have accessibility limitations; document these accurately and provide a reasonable alternative where practical.

Do not claim screen-reader accessibility without testing it.

## Stage 7 — Contribution management

Provide a basic organiser-facing view of collected contributions.

For this slice:

- List submitted synthetic signatures.
- Show submission timestamps.
- Show display-permission status.
- Allow display-permission revocation.
- Prevent cross-account and cross-event access.
- Do not expose raw untrusted markup.

Do not add unnecessary editing, image-processing or moderation features yet.

## Stage 8 — Database and security

Use the existing approved local stack:

- TypeScript
- Next.js
- Zod
- Vitest
- PGlite
- SQL migrations

Preserve the fixed local demonstration account.

Extend row-level security and database constraints to configuration and contribution records.

Validate all writes server-side.

Prevent:

- Submissions to disabled modules.
- Cross-event contribution access.
- Cross-account contribution access.
- Guest references belonging to another event.
- Unpermitted contributions appearing in downstream eligibility queries.
- Revoked contributions appearing in downstream eligibility queries.
- Unsafe contribution payloads.

Retain the localhost-only configuration and visible demonstration-security warning.

Do not use real guest data or signatures.

## Stage 9 — Automated tests

Add tests covering:

### Configuration
- Event-specific module configuration.
- Persisted configuration changes.
- Existing-event migration defaults.
- Isolation between event configurations.
- Rejection of disabled-module submissions.

### Signature capture
- Valid synthetic signature submission.
- Empty signature rejection.
- Invalid payload rejection.
- Oversized payload rejection.
- Anonymous contribution submission.
- Optional valid guest association.
- Rejection of invalid guest association.
- Persistence after restart.

### Consent
- Explicit demonstration permission.
- No assumed permission.
- Permission revocation.
- Downstream eligibility filtering.
- Consent audit history.

### Security
- Cross-account isolation.
- Cross-event isolation.
- Database role restrictions.
- Row-level security.
- Safe content handling.

Retain all existing tests.

Run:

- Typecheck.
- Full automated test suite.
- Production build.
- Application smoke tests.

Extend smoke tests to exercise the signature-only journey through the running application.

Report actual results.

## Stage 10 — Browser and accessibility checks

Review the existing browser-test checklist.

Extend it to include:

- Configuring signature-only mode.
- Drawing with a mouse.
- Drawing on a touchscreen.
- Clearing and undoing strokes.
- Previewing and submitting.
- Submitting without guest details.
- Revoking display permission.
- Mobile and tablet layouts.
- Keyboard navigation.
- Screen-reader announcements.

Use existing browser-testing capabilities if available.

Do not install new browser tooling or claim browser/device testing without evidence.

Provide manual instructions for checks that cannot be automated.

## Stage 11 — Documentation and review

Update:

- Relevant product specifications.
- MVP delivery backlog where necessary.
- Application README.
- Relevant architecture decisions.
- Task ledger.
- Browser-test checklist.

Document:

- The configurable module model.
- The signature-only journey.
- The shared contribution architecture.
- Consent and revocation behaviour.
- Existing functionality preserved.
- Known limitations.
- Next recommended input module.

Obtain an independent review following CLAUDE.md.

Address significant findings.

Check for secrets and generated files.

Commit and push the authorised task branch.

Do not merge into main.

## Restrictions

Do not:

- Process real guest data.
- Use real signatures.
- Create external accounts.
- Use paid APIs.
- Deploy publicly.
- Install Docker or WSL2.
- Activate unapproved agent settings.
- Use bypassPermissions.
- Run nested headless sessions.
- Implement billing.
- Build Mosaic composition or display.
- Build ShareWall, Lucky Draw or Event Gallery.
- Reopen the approved stack decision without a demonstrated blocker.

## Completion criteria

The founder can:

1. Create an event.
2. Configure Check-in Studio for signatures only.
3. Open a collection screen with no registration requirements.
4. Draw and preview a synthetic signature.
5. Submit it with explicit demonstration display permission.
6. View the saved contribution.
7. Revoke display permission.
8. Confirm the contribution is no longer eligible for downstream display.
9. Restart the application without losing configuration or contributions.

Existing guest-management and check-in functionality must continue working.

Automated tests, build and smoke checks must pass.

## Final report

Provide:

1. Configurable modules implemented.
2. Working signature-only journey.
3. Database and architecture changes.
4. Consent and revocation behaviour.
5. Test, build and smoke results.
6. Isolation and security findings.
7. Browser-test results or manual checklist.
8. Independent-review findings.
9. Exact startup instructions.
10. Git branch, commit and remote verification.
11. Recommended next MVP slice.

Prioritise working software over additional planning.
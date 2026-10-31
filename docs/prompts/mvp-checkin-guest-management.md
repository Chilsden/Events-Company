# Events Company — Check-in Studio Guest Management

## Founder decision

The first Check-in Studio slice is provisionally accepted.

Proceed with the next vertical slice:

**CSV import → Edit guests → Undo check-in → Audit history.**

Prioritise working software and practical event-day usability.

Do not expand the AI agent framework.

## 1. Establish the baseline

Read:

- `CLAUDE.md`
- `docs/MVP-MASTER-SPEC.md`
- `docs/planning/MVP-DELIVERY-BACKLOG.md`
- `docs/decisions/0020-mvp-implementation-stack.md`
- `docs/decisions/0021-checkin-first-slice-guest-and-check-in-model.md`
- `docs/Reviews/checkin-slice-review.md`
- `web/README.md`
- Relevant source files, migrations and tests
- `docs/task-ledger.md`

Preserve the existing working application and its test coverage.

Use a dedicated task branch containing the existing implementation.

Do not merge into main.

## 2. CSV guest import

Implement CSV import for synthetic guest names.

Requirements:

- Upload a CSV file through the browser.
- Support a clearly documented name column.
- Provide a downloadable synthetic example CSV.
- Validate file type, encoding, size, row count and guest names.
- Handle UTF-8, including an optional BOM.
- Report invalid rows with useful explanations.
- Preview valid rows before importing.
- Display the number of guests to be imported.
- Require explicit confirmation.
- Import into the selected event only.
- Prevent cross-account and cross-event imports.
- Avoid partial imports on unexpected database failure.
- Protect against accidental repeated submission.
- Define and document how duplicate names are handled.

Do not silently merge guests with identical names: two legitimate guests may share a name.

Set reasonable import limits and explain them in the interface.

Do not accept email addresses, phone numbers or other personal fields in this slice.

Do not execute or evaluate spreadsheet formula content.

Ensure error messages do not expose internal paths or database details.

## 3. Edit guest names

Allow a guest's name to be corrected.

Requirements:

- Use existing name-validation rules.
- Preserve the guest UUID.
- Preserve attendance history.
- Prevent cross-event and cross-account edits.
- Display success and failure feedback.
- Record the change in the audit history without unnecessarily duplicating personal information.

Do not add guest deletion in this task.

## 4. Undo mistaken check-in

Implement a recorded reversal of check-in.

Requirements:

- A checked-in guest can be returned to not-checked-in status.
- Attendance totals update immediately.
- The original check-in event remains in the audit history.
- The reversal is recorded as a separate event.
- Repeated reversal attempts are safe.
- Concurrent operations cannot corrupt attendance state.
- A subsequent legitimate check-in is possible.
- Cross-account and cross-event actions are rejected.

Review the existing immutable check-in timestamp and database trigger.

Separate historical check-in evidence from current attendance state if necessary.

Use atomic database operations.

Do not weaken the historical audit protections merely to enable undo.

Because authentication is not implemented, audit entries must clearly identify the actor as the local demonstration operator, not a verified individual.

## 5. Audit history

Provide an event-level audit history for:

- Guest creation.
- CSV import.
- Guest-name changes.
- Check-in.
- Check-in reversal.
- Subsequent check-in.

Record appropriate event IDs, guest IDs, action types and timestamps.

Preserve event ordering.

Avoid storing unnecessary personal data or duplicate guest names in audit payloads.

Do not provide an interface for editing or deleting audit events.

Document the limitations of audit attribution without authentication.

## 6. Fix existing feedback issues

Remove the ability to forge a successful check-in notice using URL parameters.

Ensure confirmation messages reflect trusted application results.

Improve check-in and undo announcements for assistive technologies.

Retain keyboard focus management and useful validation summaries.

## 7. Browser and accessibility verification

Test the running application in an actual browser if a suitable browser-testing capability is already available.

Check:

- Event creation.
- Adding a guest.
- Searching guests.
- Checking in.
- Undoing check-in.
- Editing a guest.
- Importing a CSV.
- Keyboard navigation.
- Focus management.
- Responsive layouts.

Test narrow/mobile viewport sizes where supported.

If browser automation is unavailable, do not install a new browser or testing service without approval.

Instead, provide a concise manual browser-test checklist for the founder.

Do not claim browser or screen-reader testing occurred unless it actually did.

## 8. Security and privacy

Use synthetic data only.

Preserve:

- Fixed local demo account.
- Account and event scoping.
- Database row-level security.
- Existing localhost-only configuration.
- Local-demonstration security warning.

Extend database policies and constraints to any new tables.

Test that imports, edits, reversals and audit reads cannot cross account or event boundaries.

Do not implement real authentication in this slice.

Do not claim production readiness.

Do not introduce real guest data.

## 9. Automated tests

Cover:

- Valid CSV import.
- Invalid CSV input.
- Import limits.
- Duplicate names.
- Repeated import submission.
- Import rollback.
- Cross-account and cross-event import rejection.
- Valid and invalid guest edits.
- Preservation of guest identity and history.
- Successful check-in reversal.
- Repeated reversal.
- Re-check-in after reversal.
- Concurrent conflicting attendance actions.
- Attendance counts after each transition.
- Audit history integrity.
- Forged confirmation messages.
- Database role and policy restrictions.

Retain all existing tests.

Run:

- Typecheck.
- Complete automated test suite.
- Production build.
- Application smoke tests.

Record actual results.

Do not claim that PGlite's single-connection concurrency tests prove behaviour on production PostgreSQL.

## 10. Documentation and review

Update:

- Application README.
- Relevant architecture decision records.
- Task ledger.
- Known limitations and outstanding risks.

Document exact startup and test commands.

Complete the required independent review.

Address significant findings.

Scan for secrets and generated database files.

Commit and push the approved task branch.

Do not merge into main or deploy.

## Restrictions

Do not:

- Process real guest data.
- Create external accounts.
- Use paid APIs.
- Install Docker or WSL2.
- Activate unapproved agent settings.
- Use bypassPermissions.
- Run nested headless experiments.
- Implement QR codes or offline synchronisation.
- Implement payments or billing.
- Reopen the approved stack decision without a demonstrated blocker.

## Completion criteria

The task is complete when the founder can:

1. Create an event.
2. Import ten synthetic guests from CSV.
3. Edit a guest's name.
4. Check in a guest.
5. Undo the check-in.
6. Check the guest in again.
7. View the recorded audit history.
8. Restart the application without losing the data.

All automated checks must pass.

## Final report

Provide:

1. Working features.
2. Database changes.
3. Test and build results.
4. Browser-testing results or manual checklist.
5. Security and isolation findings.
6. Independent-review findings.
7. Exact startup instructions.
8. Git branch, commit and remote verification.
9. Next recommended MVP slice.

Prioritise working software.
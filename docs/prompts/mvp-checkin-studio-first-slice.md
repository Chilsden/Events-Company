# Events Company — Check-in Studio First Working Slice

## Founder decision

The first Events Company application slice is provisionally accepted.

Proceed with Check-in Studio's first vertical slice using the approved local development stack.

Do not reopen the stack decision or expand the AI agent infrastructure.

## Objective

Extend the working application to support:

**Create event → Add guests → View guest list → Check guests in → View attendance.**

Deliver working software with persistent data and automated tests.

## Stage 1 — Establish the baseline

Read:

- `CLAUDE.md`
- `docs/MVP-MASTER-SPEC.md`
- `docs/planning/MVP-DELIVERY-BACKLOG.md`
- `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md`
- `docs/decisions/0020-mvp-implementation-stack.md`
- `web/README.md`
- Relevant existing source files, migrations and tests
- `docs/task-ledger.md`

Inspect the existing application before making changes.

Preserve the established architecture and conventions.

Confirm the task branch contains the working first slice and its dependencies.

Do not merge into main.

## Stage 2 — Define the minimum guest model

Design a guest record associated with:

- Account ID
- Event ID
- Guest ID
- Guest name
- Check-in status
- Check-in timestamp
- Creation timestamp

Use UUID identifiers.

The account and event relationship must be enforced by the data-access layer and appropriate database constraints.

A guest must never be retrievable through another account or event.

Review the master specification's consent requirements.

Include only the consent fields needed to preserve the future consent model, distinguishing consent status, purpose, provenance and timestamps where required by the specification.

Do not assume consent.

Do not record synthetic consent as genuine consent from a person.

Avoid unnecessary personal data.

Do not collect email addresses, phone numbers, photographs or signatures in this slice.

Use synthetic guest names only.

## Stage 3 — Guest management

On an event's details page, provide a clear route into Check-in Studio.

Implement:

1. Add a guest to an existing event.
2. Validate guest input using Zod.
3. Persist the guest.
4. Display the event's guest list.
5. Display each guest's check-in status.
6. Handle an empty guest list.
7. Handle invalid or unknown event IDs.
8. Prevent access to guests belonging to another account or event.

Use the existing responsive layout and accessibility conventions.

Keep the interface suitable for event staff operating on a tablet or laptop.

## Stage 4 — Check-in

Implement a simple check-in action.

Requirements:

- An authorised local demo user can check in a guest.
- The check-in is persisted.
- The guest's status updates visibly.
- The attendance count updates.
- Repeated check-in must not create duplicate attendance.
- Concurrent check-in attempts must not produce inconsistent state.
- A check-in cannot be applied to a guest belonging to another event or account.
- Errors are communicated clearly.

Prefer a database-backed, atomic operation over a read-then-write implementation.

Record the first successful check-in timestamp.

Do not implement check-out, offline check-in or QR scanning in this task.

## Stage 5 — Attendance summary

Display:

- Total guests.
- Checked-in guests.
- Not-yet-checked-in guests.

Ensure counts are derived from persisted data and remain consistent with the guest list.

Provide a useful empty state when no guests have been added.

## Stage 6 — Security and privacy

Continue using the fixed synthetic demo account.

Preserve account scoping and the existing database role restrictions.

Extend row-level security and database constraints to guest records where supported by the approved local stack.

Test cross-account and cross-event isolation.

Do not introduce real authentication or claim that the prototype is production-secure.

Retain the existing local-demonstration security warning.

Do not use real guest information.

Do not expose sensitive information through logs or error messages.

## Stage 7 — Automated tests

Add tests for:

1. Valid guest creation.
2. Invalid guest input.
3. Guest persistence.
4. Guest listing.
5. Empty guest lists.
6. Cross-account isolation.
7. Cross-event isolation.
8. Successful check-in.
9. Repeated check-in.
10. Concurrent check-in attempts.
11. Attendance counts.
12. Unknown guests and events.
13. Database constraints and access policies.

Retain and run the existing first-slice tests.

Run the TypeScript checks, test suite and production build.

Extend the existing smoke tests to exercise guest creation and check-in through the running application.

Report observed results, not assumed results.

## Stage 8 — User experience

Prioritise:

- Fast check-in.
- Large, clear action targets.
- Visible success and error feedback.
- Keyboard accessibility.
- Mobile and tablet layouts.
- Clear attendance totals.
- UK English.

Perform a basic accessibility review.

Do not introduce unnecessary visual complexity.

## Stage 9 — Documentation

Update the application README with:

- New features.
- Local startup instructions.
- Test commands.
- How to populate synthetic guests.
- How to reset local data.
- Known limitations.

Identify the next recommended Check-in Studio slice.

## Stage 10 — Review and Git

Follow `CLAUDE.md`.

Use a dedicated task branch.

Maintain author/reviewer separation.

Obtain an independent review using the permitted workflow.

Address significant review findings.

Update the task ledger.

Check for secrets and generated database files.

Commit and push only as authorised.

Do not merge into main, deploy or force-push.

## Restrictions

Do not:

- Use real guest data.
- Create external accounts.
- Use paid APIs.
- Use `bypassPermissions`.
- Run nested headless experiments.
- Install Docker or WSL2.
- Activate the proposed Claude Code security configuration.
- Add payment or billing functionality.
- Build RSVP emails, QR scanning or offline synchronisation yet.
- Reopen the approved stack decision without a demonstrated blocker.

## Completion criteria

The task is complete when a user can:

1. Open an existing event.
2. Add a synthetic guest.
3. See that guest in the event's list.
4. Check the guest in.
5. See the updated status and attendance count.
6. Restart the application without losing the guest or check-in.

Automated tests, the production build and smoke checks must pass.

## Final report

Provide:

1. Features implemented.
2. Database changes.
3. Test and build results.
4. Security and tenant-isolation results.
5. Exact startup instructions.
6. Known limitations.
7. Independent-review findings.
8. Git branch, commit and remote verification.
9. Recommended next vertical slice.

Prioritise working software
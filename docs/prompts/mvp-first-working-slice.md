# Events Company — First Working MVP Slice

## Objective

Move Events Company from planning and agent infrastructure into working MVP software.

Deliver the smallest useful end-to-end application journey:

**Open application → Create event → Save event → View event list → Open event details.**

Use synthetic data only.

Prioritise working software, automated tests and a repeatable local development workflow over additional planning or agent-framework development.

## 1. Read the existing project decisions

Read:

- `CLAUDE.md`
- `docs/MVP-MASTER-SPEC.md`
- `docs/planning/MVP-DELIVERY-BACKLOG.md`
- `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md`
- `docs/research/stack-and-hosting-shortlist.md`
- `docs/task-ledger.md`
- Relevant architecture decisions and existing task scopes.

Preserve existing product decisions and terminology.

Do not reopen settled product decisions without evidence of a genuine blocker.

## 2. Security and operating constraints

The agent security configuration is not approved for permanent activation.

Use the existing founder-supervised Claude Code session.

Do not require Docker, WSL2, nested headless sessions or unrestricted subagent shell access.

Do not use `bypassPermissions`.

Do not access user-level credential files or print secrets.

Do not use the two exposed Google API keys.

Do not create external accounts, use paid APIs, deploy publicly or process real guest data.

Do not merge into main.

Follow the repository's Git, review, task-ledger and approval requirements.

## 3. Make the technical recommendation

Use the existing stack and hosting shortlist to recommend a concrete MVP implementation stack.

Consider:

- Developer productivity on Windows.
- Shared accounts and events across five products.
- Multi-tenant data isolation.
- Authentication and authorisation.
- Consent and privacy requirements.
- Live updates for event displays.
- File storage for future photos and videos.
- Offline check-in requirements.
- Automated testing.
- Local development without external accounts.
- A credible path to future deployment.

Prefer a straightforward, maintainable architecture.

Avoid premature microservices, complex infrastructure and unnecessary paid dependencies.

Record the recommendation and trade-offs in the existing architecture decision process.

**If a stack decision requires founder approval under CLAUDE.md, stop before implementing the dependent code and present the recommended decision.**

Do not silently select a stack that conflicts with existing decisions.

## 4. Implement the first vertical slice

Once the stack is authorised, build a locally runnable application.

Minimum capabilities:

1. Application starts with documented local commands.
2. A simple Events Company landing page or dashboard.
3. Create an event with:
   - Event name.
   - Event date.
   - Event location.
   - Optional description.
4. Save the event to local persistent storage.
5. List saved events.
6. Open an event details page.
7. Validate required fields and show useful error messages.
8. Provide a clean, responsive interface suitable for desktop and mobile.

Use UK English.

Do not build a fake authentication system that appears production-secure.

If authentication is deferred for the local prototype, label that limitation clearly and ensure the architecture can support real account and event-level permissions later.

Do not use real guest information.

## 5. Architecture requirements

Keep the foundation compatible with all five planned products:

- Check-in Studio.
- Signature Mosaic.
- ShareWall.
- Lucky Draw.
- Event Gallery.

Use a shared event identity and a clear future account/tenant boundary.

Avoid implementing unnecessary features from the later products.

Do not introduce billing or payment functionality.

Keep Check-in Studio's permanently free positioning intact.

## 6. Tests

Provide automated tests covering:

- Creating a valid event.
- Rejecting invalid event data.
- Saving and retrieving an event.
- Listing events.
- Event identity and data separation where applicable.

Run the tests through the founder-supervised main session.

Do not claim a test passed unless it actually ran.

Record any environment blockers.

## 7. Documentation

Document:

- Selected stack and rationale.
- How to install dependencies.
- How to run the application locally.
- How to run tests.
- What is implemented.
- What is deliberately deferred.
- Known security limitations.
- Recommended next vertical slice.

Keep documentation concise.

## 8. Review and Git

Follow CLAUDE.md.

Use an appropriate task branch and task scope.

Do not overwrite unrelated work or assume earlier task branches have been merged.

Ensure the branch contains the required foundation or explicitly report missing dependencies.

Obtain an independent review where the approved workflow permits it.

Scan for secrets.

Update the task ledger.

Commit and push only as permitted by project governance.

Do not merge into main.

## 9. Completion report

Report:

1. Stack recommendation and approval status.
2. Working features implemented.
3. Files created or changed.
4. Exact local startup command.
5. Exact test command and results.
6. Screenshots or other evidence, if available.
7. Outstanding risks and blockers.
8. Git branch, commit and remote verification.
9. The next recommended implementation task.

The priority is a working Events Company application.

Do not spend this task building additional agent security infrastructure.
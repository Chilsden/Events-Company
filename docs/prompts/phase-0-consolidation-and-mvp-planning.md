
# Phase 0 Consolidation, MVP Specification and Delivery Planning

## Objective

Consolidate all agreed Phase 0 product discovery decisions into the Events Company repository, update the MVP master specification, and use that updated specification to produce a technical architecture proposal, AI agent workforce plan and prioritised MVP delivery backlog.

This is one coordinated task. Complete the stages in the order specified below.

The MVP includes BOTH:

1. The customer-facing Events Company platform.
2. The internal AI agent workforce that will help build, operate, market and grow the business.

Do not treat the agents as a post-MVP enhancement.

## Authority and conflict rule

`docs/MVP-MASTER-SPEC.md` and `CLAUDE.md` are authoritative. This prompt does not override any decision, permission, constraint, unresolved question or Git safety rule already recorded in them.

- Where this prompt adds detail that does not contradict them, record it in the specification and label it as Phase 0 input.
- Where this prompt contradicts them, keep the existing position, record the conflict in a conflict register (master spec section 16.1) and ask Phil to decide. Do not invent a resolution.
- Do not silently replace an existing decision with an assumption from this prompt.

Reconciliation notes (2026-10-30). This prompt was corrected before execution:

- Five MVP products, not four: Check-in Studio, Signature Mosaic, ShareWall, Lucky Draw, Event Gallery.
- Signature Mosaic and ShareWall stay distinct products that may share rendering technology.
- Event Gallery is a separate fifth product, not a ShareWall feature.
- Six agent roles from `CLAUDE.md`, not nine. No always-on orchestration service.
- Offline operation conflicts with the existing spec and is a decision for Phil.
- Git steps need Phil's approval for this task (Stage 8).

Later the same day (2026-10-30) Phil decided C-3 to C-8, Event Gallery, the Check-in Studio free entry point and deferred monetisation. Those decisions supersede the discovery notes below wherever they differ, including: payments, invoices and a required free tier (now post-MVP, except that Check-in Studio always has a free entry point); offline (now "some offline capability for all five products, subject to feasibility"); photo and video grids (ShareWall); English UK as the launch language; and owner-only account actions. The master spec (section 16.1) and decisions 0007 to 0012 are authoritative. This file is kept as the original instruction and is not the source of truth.

The founder/product owner is Phil. He retains approval authority over major product, architecture, commercial, security and operational decisions.

## Stage 0 — Inspect and establish the working context

Before changing anything:

1. Read `CLAUDE.md` in full and all relevant repository instructions.
2. Inspect the current Git branch, working tree, recent commits and configured remotes.
3. Inspect the existing:
   - `docs/MVP-MASTER-SPEC.md` (read ALL sections 1 to 16, not only the opening sections)
   - `docs/task-ledger.md`
   - `docs/decisions/`
   - `docs/research/`
   - `docs/prompts/`
4. Identify existing decisions, completed tasks, open questions and any previous work relating to Phase 0 discovery.
5. Preserve all existing user changes. Never overwrite or discard unrelated work.
6. Do not assume that the repository state matches previous conversations. Verify it.

If there are uncommitted changes, distinguish existing user changes from your own changes. Do not stage or commit unrelated files.

If the current branch is `main`, stop before making changes and report the situation. Do not create or switch branches without explaining the proposed action.

## Stage 1 — Update the master specification

Update `docs/MVP-MASTER-SPEC.md` using the existing structure where practical.

The master specification must become the authoritative description of the agreed MVP. Existing content stays unless it is demonstrably wrong; additions are merged in, and conflicts are registered, not resolved by assumption.

Consolidate the decisions already recorded in the repository and the Phase 0 discovery decisions summarised below.

Do not remove useful existing material merely to make the document shorter.

### A. Business and market

- UK-first business, with international availability.
- Event-agnostic platform.
- Customers include individuals, private event organisers, independent organisers, agencies, venues, hospitality businesses, corporate event teams and brand activation agencies.
- Self-service registration and immediate use.
- One account can manage multiple events.
- Customers create an event before activating products.
- One event can use any combination of products.
- Customers can add products after event creation and upgrade during an event.
- Individual product purchases and bundles are both supported.
- Event-based commercial model.
- GBP initially, online payments, invoices and receipts.
- Free tier is required as a commercial capability; exact entitlements and pricing remain open.
- Agency and multi-event account support.
- No onsite or hardware support.
- Premium remote setup and support may be offered.
- Private beta with a small number of real event organisers before public launch.
- Quality and reliability take priority over an arbitrary launch date.

Do not invent validated pricing, market size or customer demand. Record commercial hypotheses separately from confirmed decisions.

### B. Core product portfolio

There are FIVE core customer-facing MVP products, all in scope:

1. Check-in Studio
2. Signature Mosaic
3. ShareWall
4. Lucky Draw
5. Event Gallery

- Signature Mosaic and ShareWall are distinct products with different purposes and experiences. They may share rendering technology and infrastructure.
- Event Gallery is a separate fifth product. It is not a ShareWall feature.
- Where the discovery notes below say "Mosaic", read "Signature Mosaic".

Customers may purchase products individually or in bundles, subject to future pricing decisions.

### C. Shared event platform

The shared platform must support:

- Accounts managing multiple events.
- Event creation and configuration.
- Event name, description, type, dates, times and venue/location.
- Event branding, language and regional settings.
- Guest lists and configurable guest fields.
- Event owner and invited collaborators.
- Event/product configuration and permissions.
- Multiple products operating within the same event.
- Multiple devices and multiple displays per event.
- Reusable brand templates, particularly for agencies.
- Audit logs and meaningful email notifications.
- Event archive and deletion.
- Configurable data retention.
- Customer-controlled consent and privacy settings.
- An internal platform administration dashboard.

Owner and collaborator permissions are initially intended to be the same for ordinary event operation. Document any essential ownership or account-security safeguards as technical requirements rather than silently changing the agreed permission model.

### D. Check-in Studio

Include:

- RSVP and invitations.
- Pre-event registration and on-the-day registration.
- Platform-generated invitations and RSVP requests.
- Guest list import, editing, searching and management.
- Individual QR invitations and shared event QR registration.
- Guest lookup by name.
- Configurable guest fields such as name, email and company.
- Configurable capture of signatures/drawings, photographs and videos.
- Photo filters.
- Configurable confirmation emails.
- Customisable and translatable invitation and confirmation templates.
- Multiple check-in devices and stations.
- Offline capture and queued synchronisation. CONFLICT: the existing spec says no offline operation in the initial release. Record as a proposal pending Phil's decision (see section I).
- Connectivity diagnostics and online/offline/sync status (connectivity warnings and readiness checks are already agreed).
- Idempotent synchronisation and duplicate protection.
- Device, user, event and timestamp audit information.

If offline capture is approved, then for conflicting offline edits to the same guest record the proposed initial behaviour is latest update wins. Define the technical meaning of latest carefully, account for unreliable device clocks, preserve the audit history and make the behaviour clear to event organisers.

Check-in events must not be silently overwritten. Duplicate synchronisation must not create duplicate check-ins or Lucky Draw entries.

### E. Signature Mosaic

Signature Mosaic is a visual presentation product that uses event contributions, led by signatures and drawings. It is not primarily a media creation application.

Include:

- Signatures and drawings.
- Images and photographs.
- Videos, subject to technical feasibility.
- Content sourced from Check-in Studio and other configured event sources.
- Photo/video grids.
- Signatures or images assembling into a logo, number, shape or custom design.
- Custom logo and shape uploads.
- Animation speed controls.
- Music upload, including MP3.
- Live contribution mode.
- Animated build-up mode.
- Organiser-triggered reveal mode.
- Multiple Mosaic experiences per event.
- Multiple displays per event.
- Preservation of original content and processed derivatives.

The product examples supplied during discovery included:
- Glowing red/orange signatures forming the number 10.
- White signatures forming a Christmas tree.
- Portrait images displayed as a large screen grid.

Investigate the feasibility of media transformations and video animation. Do not promise technically unverified capabilities as guaranteed MVP functionality.

Boundary with ShareWall: the discovery notes place photo/video grids in this product, while the existing spec describes ShareWall as the contribution-driven collaborative wall. Do not decide this silently. Record the boundary as an open decision and keep both products distinct.

### F. ShareWall

Include:

- Guest, organiser and photographer uploads.
- Photos, short videos, text messages and signatures.
- Guest submissions through QR codes and public web links.
- Platform uploads and photographer bulk uploads.
- Background upload progress, retries and error handling.
- Instant publication and approval modes.
- Manual, AI-assisted and mixed moderation.
- Human review and approval.
- AI moderation that assists and flags content rather than silently making irreversible decisions.
- Multiple displays per event.
- Public, private and invited access configuration.
- Separate display, contribution and control permissions.
- Event display viewing by attendees and people with an authorised display link.
- Control operations restricted to event owners and collaborators.
- Configurable retention and export of ShareWall content.

Consent for contributed media and takedown/publication controls remain unresolved in the existing spec. Moderation modes listed above are Phase 0 input; the consent and takedown rules still need Phil's decision before ShareWall implementation starts.

Instagram hashtag integration is an optional ShareWall content source.

Assumptions:
- Use Meta's official API only.
- An organiser can configure an event hashtag.
- Retrieval is limited by Meta account eligibility, permissions, app review and API restrictions.
- Do not promise retrieval of every post containing a hashtag.
- Private or inaccessible posts are excluded.
- Direct uploads, QR submissions, photographer uploads and Check-in Studio remain reliable alternatives.
- Instagram approval must not block MVP launch.

Multiple photographs in one submission are primarily intended for platform uploads by organisers and photographers. Do not assume guest capture has identical behaviour without documenting the distinction.

### F2. Event Gallery (separate fifth product)

Event Gallery is its own product with its own purchase, permissions and experience. It is not a ShareWall feature.

Include (existing spec plus the post-event items from the discovery notes):

- Media from Check-in Studio, organiser uploads, guest QR uploads, photographers (including bulk uploads) and supported imports.
- Gallery browsing and multi-photo selection.
- Downloading, native sharing, social captions, printing and QR access according to permissions.
- Secure branded links rather than email attachments by default.
- Analytics.
- Permission controls, configurable retention, export and deletion.

Unresolved: whether approved ShareWall contributions can flow into Event Gallery, and under what consent and permission. Record it as an open decision. Cross-product use of data needs an explicit, purpose-limited permission.

### G. Lucky Draw

Include:

- Guest entries sourced from Check-in Studio, uploaded lists and manual additions.
- Configurable eligibility rules.
- One entry per guest by default.
- Optional repeat entries and repeat wins.
- Optional requirement that a guest has checked in.
- Optional eligibility based on event contributions.
- Multiple prizes and rounds.
- Configurable round duration, animation and music.
- Multiple winner reveal animations.
- Keyboard controls for presenters.
- Winner absent and re-draw functionality.
- Winner history and downloadable evidence.
- Auditable changes to eligibility and draw configuration.
- Server-side, concurrency-safe and idempotent draw execution.

A re-draw must create a new auditable selection. Never erase the original winner or silently rerun a completed draw.

Include round management:
- Next round.
- Previous round/review.
- Reset current round.
- Explicit, authorised re-draw that creates a new auditable selection (never a silent rerun of a completed draw).
- End draw session.

Resetting a round must never silently delete completed draw results or winner history. Require confirmation for consequential actions and preserve the reason, operator and timestamp.

Winners from previous rounds are excluded by default unless repeat wins are enabled.

### H. Shared keyboard shortcut capability

Keyboard shortcuts are a platform capability used by multiple products, not a Lucky Draw-only feature.

Include:
- Product-specific shortcuts.
- Consistent shortcut conventions.
- Visible shortcut reference for operators.
- Configurable bindings where practical.
- Keyboard, touch and tablet alternatives.
- Protection against accidental activation.
- Focus awareness so shortcuts do not interfere with text entry.
- Confirmation for consequential actions.
- Operator/control mode separation from public display mode.

Potential defaults to validate during implementation:

Signature Mosaic:
- Space: pause/resume animation.
- R: trigger reveal.
- Esc: exit reveal or return to display.

Lucky Draw:
- Space: start draw.
- N: next round.
- R: reset current round.
- X: mark winner absent.
- P: previous round.
- Esc: exit presentation mode.

ShareWall:
- Space: pause/resume presentation.

Check-in Studio and Event Gallery: no defaults were supplied; decide during design.

These are proposed defaults, not immutable decisions.

Only authorised event control sessions may execute privileged operations. A public display link must never grant control permissions.

### I. Offline capability

CONFLICT WITH THE EXISTING SPEC. The master spec (section 3) records: no offline operation in the initial release; provide connectivity warnings and event-readiness checks. The discovery notes propose that all five products should have an offline strategy where technically possible. The spec position stands until Phil decides. Record this section as a proposal, add a feasibility spike, and keep the architecture from ruling offline out (for example client-generated identifiers and idempotent writes).

Do not promise complete offline parity.

Distinguish:
- Offline capture.
- Offline interaction.
- Local cached display.
- Queued synchronisation.
- Functions requiring a live connection.
- Real-time multi-device functionality.

Provide connectivity checks, clear warnings, local queues, retry behaviour, idempotent synchronisation and visible sync status.

Centralised draw operations, remote moderation and real-time updates may require connectivity. Document limitations clearly.

### J. Internationalisation and localisation

Internationalisation must be considered from the beginning.

- English UK is the initial fully supported interface language.
- Architecture must support additional languages without hardcoded UI text.
- Required language support includes Simplified Chinese, Traditional Chinese, Korean, Thai, French, German, Spanish, Italian, Portuguese, Dutch and additional European languages. Ambiguity: it is not stated which languages must ship at launch versus which the architecture must merely support. Record as an open decision.
- Account language, event language and guest-facing product language are independently configurable.
- Guests may override suggested browser/device language.
- Event language may differ from the organiser's account language.
- Support regional date, time, time-zone, number and currency formats.
- Support appropriate fonts, long strings and complex scripts.
- Customer-customisable translations for event instructions and templates.
- Consider optional AI-assisted translation of user-generated content, retaining and distinguishing the original.

Arabic is not currently required.

### K. Security, privacy and administration

Design for UK GDPR, Data Protection Act 2018, PECR and relevant international requirements.

Include:
- Tenant isolation.
- Role-based and event-scoped permissions.
- Secure QR and display tokens.
- Revocable device sessions.
- Auditing.
- Time-limited support access.
- Purpose-specific consent.
- Customer-controlled privacy and content permissions.
- Secure media storage and upload handling.
- Configurable retention and deletion.
- Event deletion safeguards and confirmation.
- Appropriate handling of photographs, videos and children's data.
- Internal administration for customers, events, products, storage, bandwidth, revenue, errors, support, audit and agent activity.

Do not present legal compliance as solved merely by documenting requirements. Record legal review as a required activity.

### L. Technology direction

- Responsive browser-based application.
- PWA support where practical.
- No native mobile app required for MVP.
- Multiple concurrent devices.
- Real-time updates where required.
- Modular monolith preferred initially over microservices.
- Build locally using VS Code and Claude Code.
- Prefer open source and straightforward technologies unless evidence supports another choice.
- Eventual standard cloud hosting; AWS is a possible option, not a locked decision.
- Technical feasibility research required for offline synchronisation, real-time communication, media processing, storage/egress, AI moderation, translation and Instagram API integration.

Do not make major technology selections without explaining trade-offs and recording unresolved decisions.

## Stage 2 — Define the AI agent workforce as MVP scope

The internal AI agent workforce is a first-class MVP workstream.

Use the six roles defined in `CLAUDE.md` section 3:

1. Lead Orchestrator
2. Market Researcher
3. Product Strategist
4. Solution Architect
5. Software Engineer
6. Security & QA

Marketing, sales and partnerships, business operations and finance, and UI/UX design are business functions the workforce should eventually support. They are not additional roles in the MVP. Cover them as tasks handled by the six roles (for example UX requirements by the Product Strategist, research for sales and finance by the Market Researcher), and record any proposal for a new role as a decision for Phil. A role is added only through a decision record.

The agent architecture should initially use Claude Code native subagents and skills where appropriate. Roles may be a single Claude Code session working in a role. There is no always-on orchestration service and no separate orchestration framework (decision 0001).

Do not build a complex autonomous multi-agent platform before proving the value of the simpler approach.

The agent workforce must be able to support the business across:

- Product research and improvement ideas.
- Customer and competitor research.
- Architecture and technical design.
- Software development.
- Independent code review and QA.
- Security checks.
- UX and visual design.
- Branding and marketing.
- Sales materials and prospect research.
- Business operations and financial analysis.
- Task tracking, documentation and reporting.

Requirements:

- Clear role definitions and boundaries.
- Clear task inputs and acceptance criteria.
- Defined permissions and tool access.
- Shared project context and documentation.
- Task ownership and status tracking.
- Traceable outputs and decisions.
- Independent review where appropriate.
- No conflicting concurrent writes to the same files.
- Proactive recommendations and opportunity identification.
- Founder approval for major decisions and external commitments.
- Autonomy earned through demonstrated reliability.

The Lead Orchestrator coordinates and reports; it does not become an unchecked authority.

Agents must not independently:
- Merge into main.
- Deploy to production.
- Spend material amounts of money.
- Make binding external commitments.
- Change major architecture or product scope.
- Perform irreversible data operations.
- Access or use sensitive customer data beyond explicit permissions.

Routine task-branch commits and pushes are permitted within repository rules, after appropriate verification. Preserve the existing Git safety rules in `CLAUDE.md`. For this task, Stage 8 applies: commit and push wait for Phil's approval.

Distinguish between:
- Agent roles that need to exist in the MVP.
- Their initial limited capabilities.
- More advanced capabilities that can be added after the MVP foundation is proven.

Do not imply that the six roles need to be implemented as six continuously running autonomous processes. Use a practical phased implementation. Do not introduce more roles, an always-on service or a separate orchestration framework.

## Stage 3 — Update decisions and task tracking

Update the relevant decision records and create new ones where significant decisions need recording.

At minimum record:
- The five-product portfolio, with Signature Mosaic, ShareWall and Event Gallery distinct.
- Agent workforce as a first-class MVP workstream, using the six roles in `CLAUDE.md`.
- Shared keyboard shortcut capability.
- Instagram integration assumptions.
- Offline capability across products with documented limitations, recorded with status "proposed" because it conflicts with the existing spec.
- Modular monolith as the preferred initial architectural direction, subject to technical validation.
- Founder approval and agent autonomy boundaries (reference `CLAUDE.md` section 8, which stays authoritative; do not duplicate it).

Do not create duplicate decision records if equivalent records already exist. Update existing records where appropriate.

Update `docs/task-ledger.md` with:
- Completed discovery consolidation.
- Architecture planning.
- Agent workforce foundation.
- Shared platform foundations.
- Each of the five product workstreams.
- Technical feasibility investigations.
- QA, security and private beta preparation.

Every task must have:
- Unique ID.
- Title.
- Description.
- Owner or responsible agent role.
- Priority.
- Dependencies.
- Acceptance criteria.
- Status.
- Verification evidence when complete.

Do not mark implementation tasks complete merely because planning documents exist.

## Stage 4 — Create the technical architecture proposal

Only AFTER the master specification has been updated and reviewed, create:

`docs/architecture/MVP-TECHNICAL-ARCHITECTURE.md`

The architecture proposal must cover:

- Recommended application architecture.
- Frontend and backend responsibilities.
- Data model and core entities.
- Multi-tenancy and event isolation.
- Authentication and permissions.
- Real-time event communication.
- Media upload, processing and storage.
- Offline storage and synchronisation.
- Conflict handling.
- Idempotency.
- QR and public access tokens.
- Internationalisation.
- Keyboard interaction architecture.
- Product integration and shared event data.
- Lucky Draw integrity and auditability.
- Instagram integration boundary.
- AI moderation integration.
- Agent workforce architecture (six roles).
- Claude Code native subagents and skills.
- Agent permissions, task delegation and review.
- Administration and observability.
- Testing strategy.
- Deployment and hosting options.
- Security and privacy.
- Cost and scalability considerations.

For each significant technology recommendation:
- Explain why it is suitable.
- Identify alternatives.
- State trade-offs.
- Identify risks.
- Mark decisions as confirmed, proposed or unresolved.

Avoid premature complexity. Prefer the smallest architecture that can support the agreed MVP safely.

## Stage 5 — Create the prioritised MVP delivery backlog

Create:

`docs/planning/MVP-DELIVERY-BACKLOG.md`

Organise the backlog into logical epics and delivery phases.

Include BOTH the agent workforce and event platform.

At minimum consider these workstreams:

A. Repository, development and agent foundations.
B. Agent workforce and orchestration.
C. Accounts, organisations and event management.
D. Shared event data, permissions and branding.
E. Media storage, upload and processing.
F. Check-in Studio.
G. Signature Mosaic.
H. ShareWall.
I. Lucky Draw.
J. Event Gallery.
K. Internationalisation.
L. Offline capability (proposal pending Phil's decision; feasibility spike first).
M. Administration, security and audit.
N. Payments and commercial foundations.
O. QA, beta and launch readiness.

Identify:
- Critical path.
- Dependencies.
- Parallelisable work.
- Technical spikes.
- MVP must-haves.
- Items that can be simplified for first release.
- Post-MVP enhancements.

Every backlog item must have:
- ID.
- Description.
- Priority.
- Responsible agent role (one of the six in `CLAUDE.md`).
- Dependencies.
- Acceptance criteria.
- Verification method.
- Estimated complexity (relative sizing is acceptable; do not invent precise time estimates).

The backlog should be implementable, not just a list of product features.

## Stage 6 — Technical feasibility and risk register

Create:

`docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md`

Identify and prioritise investigations for:

- Offline-first capture and sync.
- Multi-device conflict handling.
- Real-time displays and updates.
- Media upload and processing at event scale.
- Signature Mosaic animation and media transformation.
- Lucky Draw randomness, concurrency and audit evidence.
- AI moderation.
- Instagram API eligibility and limitations.
- Internationalisation and translation.
- Data protection and consent.
- Storage, bandwidth and hosting costs.
- Agent orchestration, tool permissions and reliability.

For each investigation record:
- Question.
- Why it matters.
- Proposed experiment or research.
- Expected output.
- Dependencies.
- Risk if unresolved.
- Whether it blocks implementation.

Do not let optional integrations such as Instagram block the reliable core MVP.

## Stage 7 — Review the deliverables

Before finishing:

1. Read the updated master specification from disk.
2. Check the architecture against the specification.
3. Check the backlog against both documents.
4. Check the risk register against the backlog.
5. Confirm all FIVE products are represented, with Signature Mosaic, ShareWall and Event Gallery kept distinct.
6. Confirm the agent workforce is explicitly included in MVP scope, uses exactly the six `CLAUDE.md` roles, and adds no always-on orchestration service.
6a. Confirm `CLAUDE.md` and the master spec still agree on approval boundaries, Git safety, roles and verification, and that no existing decision, permission, constraint or open question was dropped.
6b. Confirm every conflict between this prompt and the existing documents is in the conflict register, with the existing position preserved.
7. Confirm keyboard controls and round management are included.
8. Confirm Instagram is optional and not a launch dependency.
9. Confirm offline limitations are not misrepresented.
10. Check for contradictions, duplicated decisions and unrecorded assumptions.
11. Check that no major discovery decision has been silently omitted.
12. Run relevant documentation checks, formatting checks or repository validation where available.

If there is an important contradiction or missing decision, document it as unresolved rather than inventing an answer.

## Stage 8 — Git and completion

Follow all existing repository instructions in `CLAUDE.md`.

- Do not merge into main.
- Do not deploy.
- Do not rewrite Git history.
- Do not force-push.
- Do not discard existing user work.
- Do not stage unrelated files.
- Check for secrets and sensitive information before committing.
- Do not stage, commit or push until Phil has reviewed the results and approved the Git steps for this task. Report the working-tree status and the exact list of files proposed for commit, then wait.
- After approval: stage explicit reviewed paths only, commit only the reviewed task files, and push only the existing approved task branch (`docs/update-master-spec`). Check `git remote -v` first.
- Verify the commit hash and inspect the remote branch after pushing. Do not infer success from the command alone.
- Never create or push `main`.
- If branch state or permissions prevent safe completion, stop and report rather than improvising.

Update the task ledger with actual completion status and verification evidence.

## Final report

When finished, report:

1. Current branch and Git status.
2. Files created or updated.
3. Summary of the master specification changes.
4. Summary of the agent workforce MVP design.
5. Recommended technical architecture and unresolved choices.
6. MVP epics in recommended delivery order.
7. Critical technical risks and spikes.
8. Decisions requiring Phil's approval, including every entry in the conflict register.
9. Tests and validation performed.
10. Commit hash and push verification, if completed.

Be explicit about anything not completed.

Do not begin implementing the application in this task. This task produces the agreed specification, architecture proposal, agent workforce plan and delivery backlog. Implementation will be a separate approved task.

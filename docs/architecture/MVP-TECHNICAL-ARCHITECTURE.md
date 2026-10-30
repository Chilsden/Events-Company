# MVP Technical Architecture Proposal

- **Version:** draft 0.3, 2026-10-30 (draft 0.3 applies Phil's final corrections of 2026-10-30; draft 0.2 responded to the independent review report's findings F-02 to F-12, which are report IDs, not backlog items)
- **Status:** proposal. The [master spec](../MVP-MASTER-SPEC.md) prevails wherever the two differ. Nothing here selects a stack, provider or host.
- **Author role:** Solution Architect (drafted in a single Claude Code session; not yet independently reviewed).

## 0. How to read this

Every significant choice is marked:

- **Confirmed**: already decided in the spec, `CLAUDE.md` or a decision record.
- **Proposed**: a recommendation for Phil to accept or change.
- **Unresolved**: needs a decision or a spike first.

No benchmarks, prices or vendor limits have been measured or verified for this document. Where cost or capacity matters it is listed as a risk to test ([risk register](../planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md)).

## 1. Principles

1. **Smallest architecture that safely supports the agreed MVP.** (Proposed)
2. **Five products, one platform.** Products are separate experiences; shared services own identity, permissions, media, email, audit and analytics events. Shared data is never open data. (Confirmed, spec 5.2)
3. **Server decides.** Permissions, draw execution, token checks and retention are enforced on the server, never only in the browser. (Confirmed in the spec for the draw and uploads)
4. **Idempotent writes.** Retries, reconnects and several devices must not duplicate or change results. (Confirmed as a requirement for Lucky Draw and check-in sync; applied platform-wide as Proposed)
5. **Offline where feasible.** All five products should have some offline capability, subject to documented limits and feasibility (spec 3, [0007](../decisions/0007-offline-capability.md)). Per-product scope is Unresolved until spikes S-01 and S-02. (Direction Confirmed)
6. **Do not block monetisation.** The MVP has no billing (spec 9, [0010](../decisions/0010-defer-monetisation-until-after-mvp.md)), but nothing in the design may prevent pricing, bundles, per-event pricing, agency plans, guest-count tiers, storage limits or premium features later. (Confirmed requirement; mechanism Proposed)
7. **Erasable by design.** Immutable records hold opaque references, not personal data, and every record class has a retention period (section 25, [0014](../decisions/0014-privacy-preserving-audit-and-erasure.md)). (Principle from Phil's instruction; the reference data model is Proposed and needs technical and privacy validation)
8. **Revocation reaches every copy we control.** Withdrawal and revocation propagate to links, caches, exports, offline devices and backups, within stated windows, and the limits are shown to people (section 24). (Requirement Confirmed; design Proposed)

## 2. Recommended application architecture

**Proposed: a modular monolith** ([0006](../decisions/0006-modular-monolith-direction.md)): one deployable application, a browser front end (responsive, PWA where practical), a background worker for slow jobs, a relational database and S3-compatible object storage. Both are assumptions for backlog A-01 to confirm or revise; sections 5, 14 and 25 rely on transactional behaviour.

| Module | Owns |
|---|---|
| Identity & accounts | Users, accounts, memberships, collaborators, sessions |
| Events | Events, product instances, branding, languages, archive and deletion |
| Guests | Guests, custom fields, consent records, invitations, RSVP |
| Media | Upload sessions, assets, derivatives, retention |
| Real-time | Display and control channels |
| Check-in Studio | Stations, check-in events, forms, QR entry |
| Signature Mosaic | Compositions, animation settings, reveal state |
| ShareWall | Submissions, moderation queue, display rules, collaborative photo and video grids |
| Lucky Draw | Pools, rounds, selections, evidence |
| Event Gallery | Post-event galleries, ingestion (proposed routes: organiser upload, photographer link, grant import), curation and eligibility checks, selections, links, downloads (separate from ShareWall; reads other products' content only through content grants) |
| Notifications | Email jobs and templates |
| Usage & access | Per-event usage records; one product-access interface that allows everything in the MVP. Plans, subscriptions, checkout and invoices are post-MVP and not built (0010) |
| Audit & analytics | Audit log, first-party events |
| Admin | Internal dashboard |

Rules: modules call each other through defined interfaces; no module reads another's tables directly; cross-product data use goes through the permission check in section 13.

**Alternatives:** microservices (more operations work, little gain for one builder); serverless-only (cost and local-development trade-offs not evaluated). **Risk:** boundaries erode unless a test or lint rule enforces them. **Status:** Proposed.

## 3. Front end and back end responsibilities

| Layer | Responsibilities |
|---|---|
| Browser app | Rendering, local UI state, shortcuts, display mode and control mode, upload initiation, local queue and cached display for offline capability (scope per product, Unresolved) |
| Server | Authentication, authorisation on every request, validation, business rules, draw execution, token issuance and checks, signed upload URLs, audit writes |
| Worker | Image and video processing, email, exports, retention enforcement, scheduled checks |

The browser is never trusted for permissions or for rule enforcement. **Status:** Proposed.

## 4. Data model (core entities)

Proposed outline, not a schema. All tenant-scoped rows carry `account_id`; event-scoped rows also carry `event_id`.

| Entity | Notes |
|---|---|
| Account, User, Membership | One account manages many events; roles per membership |
| Event | Name, type, dates, venue, language and regional settings, branding, retention policy |
| ProductInstance | A product activated on an event, with draft and published configuration versions |
| Guest, GuestField | Configurable fields; source (import, RSVP, walk-in) |
| SubjectIdentity, SubjectRef | Erasable identity record (name, contact details, field values) and the opaque per-event reference used by every append-only record (section 25) |
| Consent | `subject_ref`, purpose, scope, wording version, time, withdrawn at (section 24) |
| Invitation, RSVP | Individual QR token or shared event QR |
| CheckIn | `subject_ref`, station, device, user, `claimed_at` (device), `received_at` (server), sync batch, client-generated id; append-only; no names |
| Device, DeviceSession | Scoped and revocable |
| MediaAsset, MediaDerivative | Original kept; derivatives linked to it |
| Signature | Vector or raster plus metadata |
| MosaicSession | Composition, source set, reveal state |
| Submission, ModerationDecision | ShareWall items; decisions record actor (human or AI-suggested) and reason |
| DrawSession, DrawRound, PoolSnapshot, DrawSelection, SelectionEvent, DrawCommand | See section 14 |
| Gallery, GalleryItem, GallerySelection, ShareLink | Event Gallery. A GalleryItem points to the source asset and records its source product, the grant it relies on, its consent basis and its moderation status (`pending`, `approved`, `rejected`) |
| ContentGrant | Cross-product permission: source product, target product, purpose, scope, who enabled it, when, revoked at. Required for any content that enters Event Gallery from another product |
| ContributionReceipt, RevocationEvent, ErasureLedger | Withdrawal and revocation (section 24) |
| EmailJob | Queued, sent, failed |
| UsageRecord | MVP: per-event usage (storage, bandwidth, guest counts). Feeds cost tracking and keeps future pricing possible |
| Plan, Subscription, Invoice | Post-MVP ([0010](../decisions/0010-defer-monetisation-until-after-mvp.md)). Not built in the MVP; the model must not make them hard to add |
| AuditLog | Append-only: actor, action, opaque target ids, `occurred_at` and `received_at` (the server assigns both), structured reason code, short non-personal note. No names or media (section 25) |
| AnalyticsEvent | First-party only (spec section 10) |
| SupportGrant | Time-limited support access |

**Open:** database product and migration approach (section 23).

## 5. Multi-tenancy and event isolation

- Every query is scoped by account (and event where relevant). **Proposed:** enforce in a single data-access layer, backed by database row-level security if the chosen database supports it, so a coding mistake cannot silently leak data.
- Tenant isolation is tested with cross-tenant access attempts (spec 11.1). **Confirmed** as a launch criterion.
- Public display, contribution and control are different token scopes, never interchangeable (section 10).

**Alternatives:** a database per tenant (stronger isolation, more operations work). **Risk:** a missed scope in one query. **Status:** Proposed.

## 6. Authentication and permissions

- Roles: account owner, event collaborator, device session, contributor (guest), display viewer, support (time-limited), platform admin. **Account owners and event collaborators are distinct** (decision 0011): the account owner controls account-level actions and permanent event deletion; event collaborators, invited per event, manage ordinary event operations. The word "owner" is not used for an event.
- **Confirmed ([0011](../decisions/0011-owner-only-account-actions.md)):** account ownership, billing, account deletion, ownership transfer and permanent event deletion are account-owner-only ("owner-only" for short). Normal event operations, including archiving, are done by event collaborators. These checks are enforced on the server and audited, and tested with an event collaborator attempting each action.
- **Operator control session (Proposed, decision 0004):** a scoped, expiring, revocable control session for one event and named capabilities, for presenters who are not event collaborators.
- Permanent event deletion needs a typed confirmation of the event name and recent re-authentication (Proposed), a pending-deletion period before the purge during which the account owner can cancel (length **Unresolved**), and an audit entry with no guest personal data (section 25). **Unresolved:** whether an account can have several account owners, who may create an event, and how ownership is recovered if the account owner is unavailable.
- The access check for "who may do this" is one function, so adding plan-based entitlements later does not change callers (spec 5.3).
- Device sessions are scoped to an event and station, expire and are revocable. **Confirmed** (spec 5.3).
- Support access is audited and time-limited. **Confirmed.**
- Authentication method (passwords, magic links, social sign-in, MFA) is **Unresolved**. Build against an identity interface so the choice can change.

## 7. Real-time communication

Needed for: multi-device check-in status, live Signature Mosaic and ShareWall displays, Lucky Draw control and display, and moderation.

| Option | For | Against |
|---|---|---|
| WebSocket channels from the app | Two-way, low latency | Connection state, scaling and reconnect handling |
| Server-sent events plus normal requests | Simpler, one-way push | Control still needs request/response |
| Managed real-time service | Less to run | Cost, vendor lock-in, unverified limits |

**Proposed:** start with the simplest option that meets the display and control needs, behind an internal interface. **Unresolved** until spike S-03. Display channels are read-only; control commands are authorised on the server and idempotent. Event data is the source of truth; a reconnecting display reloads current state, it does not replay history.

## 8. Media upload, processing and storage

- **Upload (Proposed):** the browser uploads directly to object storage with short-lived, narrowly scoped signed URLs issued only after a server permission check. Spec 5.3 states direct-to-storage uploads "where appropriate"; the signed-URL mechanism is a proposal for A-01 and S-04 to confirm.
- **Resilience:** chunked or resumable uploads with progress, retries and clear errors, because guests are on mobile networks. Proposed.
- **Processing:** the worker validates type and size, generates derivatives (thumbnails, display sizes), strips or handles metadata deliberately, and records results. The original is always kept. Scanning for malicious files: approach **Unresolved**.
- **Video:** short videos are in the discovery notes; processing cost and feasibility are **Unresolved** (S-04, S-05).
- **Storage:** private by default; access via short-lived signed URLs or app-proxied streams. The signed-link lifetime is short and its value is **Unresolved** (S-13). Derivative keys are versioned so a revocation can invalidate caches (section 24.3). Retention rules are applied by a scheduled job and logged.
- **Backups and restore:** backups are not edited; after a restore the ErasureLedger is re-applied before service resumes (section 24.3; backlog E-07).
- **Cost:** storage, processing and egress costs are unmeasured. Use limits and retention to cap them (spec 9.4).

## 9. Offline storage, synchronisation, conflicts and idempotency

**Status of offline:** decided in principle on 2026-10-30 ([0007](../decisions/0007-offline-capability.md)): all five products should have some offline capability, subject to documented limits and feasibility. What each product gets is **Unresolved** until spikes S-01 and S-02. Parity is not promised.

- *Regardless:* every write carries a client-generated idempotency key. The server stores it and returns the original result on a repeat. A retry never creates a second check-in, entry or submission.
- *Regardless:* check-ins are append-only events, not edits; a duplicate or conflicting scan is recorded, not overwritten.
- *For offline capability:* a local queue (browser storage), visible sync status, retry with back-off, and a sync endpoint that accepts batches idempotently.
- *Per product:* minimums, limits and fallbacks are proposed in decision [0017](../decisions/0017-minimum-offline-capability-per-product.md) and spec 5.7, pending S-01, S-02 and Phil. Lucky Draw execution stays server-side, so drawing needs a connection (section 14).
- *Offline privacy (Proposed):* a device holds an expiring pack (a lease) with only the data its role needs. At expiry or next contact it syncs its queue and then wipes the pack. Revocation of a device, user, grant or consent reaches an offline device at next contact or lease expiry, so the maximum exposure window is the lease length (value **Unresolved**; Phil must accept it). Browser storage is not claimed to be secure against someone with access to the device.
- *Conflicts (proposal from P0):* for edits to the same guest record, "latest update wins". Define "latest" by server receive order plus the device's claimed time, never by the device clock alone. Keep every version in the audit history, store both `claimed_at` (device) and `received_at` (server) with the sync batch, and show organisers when a later change replaced an earlier one. Whether this is right for all fields is **Unresolved** (S-02).
- *Cannot work offline:* central draw execution, remote moderation, real-time multi-device updates. These need a connection and must say so.

## 10. QR and public access tokens

- Separate token types: individual invitation, shared event registration, display link, contribution link, gallery link, control session.
- Tokens are long, random and have a scope, an event, an expiry and a version. A display token cannot perform control actions. Tokens that must be shown again (QR codes and links an organiser re-downloads) are derived from a keyed hash of the record id and its version, so they can be regenerated on demand and revoked by bumping the version. Other tokens (receipts, device sessions) are stored hashed.
- Revocation takes effect on the next request; for live channels, connections are closed on revoke.
- Rate limiting and abuse controls on public endpoints (backlog D-16).
- **Status:** Proposed; acceptance criteria are in spec 11.1.

## 11. Internationalisation

- All UI text comes from message catalogues keyed by id. No strings in code. **Proposed.**
- Separate locale settings for the account, the event and the guest-facing product. A guest can override a suggested language.
- Dates, times, time zones, numbers and currency formatted by locale. Fonts and layout tested with long strings and complex scripts (Chinese, Korean, Thai).
- User-defined templates have per-language versions with a fallback.
- Optional AI translation of user content stores the original and the translation separately and labels the translation. Privacy review required first (S-09, S-10).
- **Confirmed ([0012](../decisions/0012-english-uk-launch-language-progressive-localisation.md)):** English (UK) is the fully supported launch language; further languages are added progressively. The order of later languages is Unresolved. The architecture is language-ready from day one, so adding a language is translation and testing work, not a code change.

## 12. Keyboard interaction architecture

Decision [0004](../decisions/0004-shared-keyboard-shortcuts.md).

- One shortcut service in the browser app: each product registers actions and default bindings; the service handles focus awareness (no firing in text fields), conflict detection, a visible reference panel and user rebinding.
- Every shortcut maps to a named action that also has a button, touch or tablet control.
- Consequential actions (reset round, mark absent, re-draw) ask for confirmation and send a request the server authorises.
- Control mode is a separate authenticated view from the display view.
- Conventions (decision 0004, Proposed): the same key means the same thing in every product; consequential actions use `Shift` plus a key and always confirm; key-repeat events are ignored and controls lock while a command is in flight; the server also rejects repeats and stale versions (section 14.4).
- Operator control sessions (Proposed) let a presenter run a product without being an event collaborator.
- Default keys are proposals (spec 5.5).

## 13. Product integration and shared event data

- Products share event, guest, media, consent and audit services.
- A product reads another product's data only through a **permission grant**: source product, target product, purpose, scope, who enabled it, time, revoked or not. Example: Check-in Studio photos reach ShareWall only if guest consent covers it and the organiser enables it.
- The grant check is in the shared data-access layer, so no product bypasses it.
- Signature Mosaic and ShareWall may share a rendering library. They remain separate products with separate configuration. **Confirmed boundary (C-4):** ShareWall owns collaborative photo and video grids; Signature Mosaic handles signatures and drawings forming designs.
- **Event Gallery ([0008](../decisions/0008-event-gallery-post-event-product.md)) is a distinct post-event product.** It gathers content from Check-in Studio, ShareWall, organiser uploads, guest QR submissions and photographer uploads. For content that originates in another product it relies on a `ContentGrant` that is explicit, recorded and revocable.
- **Eligibility is evaluated when content is shown, not only when it is added.** An item is shown only if: a valid grant exists (when it came from another product); consent covers the use; moderation status is approved; retention has not expired; and it has not been deleted. Each grant and revocation is audited.
- **Revocation is more than hiding a page.** What a revocation does to signed links, caches, exports, offline devices and backups, and the exposure window for each, is in section 24. Copies already downloaded cannot be recalled; people are told this where they download, share or print.
- **Ingestion** (decision 0008). Decided: the Gallery aggregates eligible content from Check-in Studio, ShareWall, organisers and photographers, with a P0 ingestion path that enforces consent, moderation status and permissions. **Proposed, not approved:** the three routes (organiser upload, photographer upload through a scoped link, grant-based import) and the `pending` default until an account owner or event collaborator approves an item (section 24.6). Whether the Gallery also offers a guest upload link is **Unresolved**.
- Analytics follow spec section 10: share clicks are intent events, not impressions.

## 14. Lucky Draw integrity, state machine and auditability

Requirements: spec 4.4. Decision [0015](../decisions/0015-lucky-draw-round-state-machine.md) is **proposed**; rule choices needing Phil are listed at the end of this section.

### 14.1 Entities

| Entity | Notes |
|---|---|
| DrawSession | Event, state (`active` or `ended`), current round number, `version` |
| DrawRound | Session, number, prize, state, `version` |
| PoolSnapshot | Round, snapshot number, cut-off (`received_at`), rule version, ordered list of `SubjectRef`s, hash of that list. Immutable |
| DrawSelection | Round, snapshot, sequence, `SubjectRef`, algorithm id, seed, operator, time. Immutable |
| SelectionEvent | Selection, kind (`drawn`, `absent`, `superseded`, `voided_by_reset`, `confirmed`), reason code, operator, time. Append-only |
| DrawCommand | Client command id (unique), session, kind, expected version, result reference, operator, time. Append-only |

All draw records hold `SubjectRef`s, not names (section 25).

### 14.2 States

- Session: `active` then `ended` (final; read-only).
- Round: `configured` → `ready` → `drawn` → `closed`, with `needs_redraw` between `drawn` and `drawn` when every active selection has been marked absent. `closed` is final.

### 14.3 Commands

Every command carries a client-generated command id and the version it expects. Operators are account owners, event collaborators, or holders of a scoped operator control session with the `draw` capability (decision 0004).

| Command | Moves | Preconditions | Effect | Confirmation and reason |
|---|---|---|---|---|
| `open_round` | `configured` → `ready` | Session active; the previous round is `closed` | Freezes pool snapshot 1 at the server receive time | No |
| `refresh_pool` | `ready` → `ready` | No selection yet in the round | New snapshot, previous kept; shows what changed | No (audited) |
| `draw` | `ready` → `drawn` | Version matches | Records a seeded selection and a `drawn` event | No |
| `mark_absent` | `drawn` → `needs_redraw` when none remain active | An active selection exists | `absent` event with reason | Yes |
| `redraw` | `needs_redraw` → `drawn` | Exclusion rule applied | New selection from the same snapshot, linked to the earlier one | Yes |
| `reset_round` | `ready`, `drawn` or `needs_redraw` → `ready` | Round not closed | Active selections get `voided_by_reset`; a new snapshot is taken; all earlier records stay | Yes |
| `confirm_winner` | `drawn` → `closed` | An active selection exists | `confirmed` event; the round is final | Yes (confirm only) |
| `close_round` | `ready` or `needs_redraw` → `closed` | None | Closes without a winner | Yes |
| `advance_round` | Pointer `n` → `n+1` | Expected round number matches; round `n` is `closed` | Moves the session pointer | No |
| `review_round` | None | None | Read-only view of an earlier round | No |
| `end_session` | `active` → `ended` | None | Session read-only; evidence final; unfinished rounds listed | Yes |

A closed round is never edited. A mistake found after closing is handled by a new, audited round (proposed rule).

### 14.4 Rules

1. **Atomic and idempotent.** Each command runs in one transaction that locks the session and round. A repeated command id returns the stored result. A stale expected version returns the current state and changes nothing. Unique constraints cover command id and (round, sequence).
2. **Late check-ins.** A snapshot includes only check-ins the server had received at its cut-off. Later arrivals, including delayed offline syncs, do not enter that round. Before `draw`, the console shows how many check-ins arrived since the snapshot and, where known, how many devices have unsynced queues, and offers `refresh_pool`. After a draw, late arrivals are eligible for later rounds. A re-draw uses the same snapshot (proposed) so the pool cannot change after a result is seen.
3. **Randomness and evidence.** The server generates a seed from a cryptographically secure source after the snapshot is frozen. Selection is a deterministic function of the seed and the ordered snapshot. The seed, algorithm id and snapshot hash are stored, so an auditor can recompute the result. The exact method and evidence format are for spike S-06 and Phil's approval.
4. **Repeated and concurrent input.** The browser ignores key-repeat events and locks the controls while a command is in flight (decision 0004). Navigation commands carry the expected round number, so two presses of `N` move one round, not two. Two operators acting at once get one result and one refreshed view.
5. **Display and reconnect.** Displays and consoles read state and stored selections and replay the animation from them. They never compute a result. A reload shows the current state.
6. **Reset and re-draw.** Both append records. Neither deletes a selection or a winner.
7. **Privacy.** Records hold `SubjectRef`s. An evidence export resolves names only for identities that still exist and otherwise shows "erased participant". The pool hash is of references, so verification still works after an erasure (section 25).
8. **Offline.** Drawing is server-side and needs a connection. Offline, the console can present results already drawn (decision 0017).

### 14.5 Tests

Refresh, reconnect, retry, double-submit, held key, two operators at once, a stale version, a late check-in, a delayed offline sync, a reset after a draw, a re-draw, an absent winner, an advance pressed twice, and an erasure followed by an evidence export that still verifies.

### 14.6 Rule choices needing Phil (unresolved)

Exclusion of absent winners from the same prize; whether a reset winner returns to the pool; whether a re-draw may refresh the snapshot; whether a manual fallback is allowed with no connection (proposed: not for the MVP); the random method; and operator control sessions. See decision 0015.

## 15. Instagram integration boundary

Decision [0005](../decisions/0005-instagram-integration-assumptions.md). An optional adapter behind the ShareWall submission interface. It converts retrieved posts into ordinary submissions that enter the normal moderation and consent flow. Failure or absence has no effect on core ShareWall. No core module depends on it. Feasibility: S-08.

## 16. AI moderation integration

- A moderation interface takes a submission and returns suggested flags with reasons. It never publishes, rejects or deletes by itself. A human decision is always possible and is recorded.
- Modes: manual, AI-assisted, mixed. Approval-first or instant publication is an event setting.
- Provider, cost, accuracy, latency and what content leaves our systems are **Unresolved** (S-07, S-10). Without a privacy review, run in manual mode only.

## 17. Agent workforce architecture

Decision [0003](../decisions/0003-agent-workforce-mvp-workstream.md). This section is about the internal tooling, not the customer product.

- **Roles:** the six in `CLAUDE.md`. No more without a decision record.
- **Mechanism (Proposed):** Claude Code native subagents (role definitions in a project folder) and skills for repeated procedures. Verify what the installed Claude Code actually supports before relying on a feature (`CLAUDE.md` section 3).
- **Delegation:** the Lead Orchestrator creates a task in the ledger with remit, inputs, acceptance criteria, files the agent may touch and escalation rule. One owner per file.
- **Permissions:** each role gets the narrowest tool and file access that fits. Research roles read and write documents only. The Software Engineer touches only files named in the task. Security & QA reviews but does not author the code it reviews.
- **Review:** substantial or sensitive changes get independent review from a fresh-context session or Phil. Subagent reports are data, not authority.
- **Data:** agents use synthetic or anonymised data. They do not receive guest data they do not need.
- **Autonomy:** scoped, low-risk steps proceed within permissions; wider permission needs Phil's approval after verified results.
- **Cost control:** record AI usage cost per accepted task. Set spending limits before any unattended run. No always-on service.
- **Observability:** agent activity is visible in the ledger and in the admin dashboard once it exists.
- Risks and tests: S-12.

## 18. Administration and observability

- **Admin dashboard:** customers, events, products, storage, bandwidth, usage, errors, support and audit; an agent activity view follows the dashboard core (backlog B-08). Revenue reporting arrives with billing, post-MVP. Access restricted to platform admins and audited. Customer data visible through support grants only.
- **Observability (Proposed):** structured logs without personal data or secrets, error tracking, job and queue health, upload and sync failure rates, and per-event usage metrics for cost tracking. Tool choice **Unresolved**.
- **Event-readiness check:** a pre-event diagnostic for connectivity, device permissions and sync status (confirmed requirement, spec 5.3).

## 19. Testing strategy

- Unit and integration tests for rules, permissions and idempotency, written against intended behaviour (`CLAUDE.md` section 4), not against the implementation's assumptions.
- Permission matrix tests: each role against each action, including cross-tenant attempts and token misuse.
- Lucky Draw: concurrency, retry and reconnect tests (section 14).
- Upload tests: large files, interrupted uploads, wrong types, expired URLs.
- Browser end-to-end tests for each product's main flow and for display/control separation.
- Multi-device and real-time tests with several simulated displays.
- Internationalisation: pseudo-localisation, long strings, right font coverage.
- Load tests at realistic event sizes, once real sizes are known from the beta.
- Synthetic data only. Tests record observed results.
- Independent review by Security & QA for security-sensitive changes.

## 20. Deployment and hosting options

| Option | For | Against | Status |
|---|---|---|---|
| Single cloud provider, managed services (AWS is one possibility) | Standard, many managed pieces | Cost and lock-in unevaluated | Unresolved |
| Platform-as-a-service | Least operations work | Limits on workers, media and cost control unevaluated | Unresolved |
| Self-managed servers | Control | Most operations work for one person | Not recommended |

Constraints: UK-first data location is a legal question to review (spec 11), environments for development, staging and production, secrets in a secret manager, repeatable deployment, and no deployment without Phil's approval (`CLAUDE.md` section 8). The development hosting choice depends on spikes S-04, S-11 and S-13. The production hosting provider and data location for real guest data are a separate decision that also needs legal advice (backlog A-09).

## 21. Security and privacy

Follows spec section 11 and 11.1 to 11.4. Architecture hooks: tenant scoping (5), permissions and tokens (6, 10), secure upload (8), purpose-limited sharing (13), revocation and erasure (24, 25), privacy-preserving audit (25), accessibility (26), retention jobs, support grants, backups and restore, secrets handling, and incident response ownership. Legal compliance is not claimed; professional review is required.

## 22. Cost and scalability considerations

- Main cost drivers (unmeasured): media storage, processing, bandwidth/egress, real-time connections, email, AI moderation and translation, and AI development usage. Payment fees arrive only with post-MVP billing.
- Scale shape: bursts at events, with many guests uploading at once and many displays.
- Levers: upload limits, retention, derivative sizes, caching and queueing. Whether the MVP needs usage caps for abuse or cost protection is open. Plan limits and pricing are post-MVP and will depend on the measured costs (spec 9.3). Per-event usage records are kept from the start so those later decisions have data.
- Scale up the monolith and add workers first; split modules only on measured need.

## 23. Decision summary

| Topic | Status |
|---|---|
| Modular monolith | Proposed ([0006](../decisions/0006-modular-monolith-direction.md)) |
| Five products on shared platform | Confirmed ([0002](../decisions/0002-five-product-portfolio.md)) |
| Idempotent writes, server-side draw | Confirmed as requirements; mechanism Proposed |
| Direct-to-storage signed uploads | Proposed (spec 5.3 says "where appropriate") |
| Relational database and S3-compatible storage | Assumption; A-01 confirms or revises |
| Consent revocation and content lifecycle (section 24) | Proposed ([0013](../decisions/0013-consent-revocation-and-content-lifecycle.md)); exposure-window values Unresolved (S-13) |
| Privacy-preserving audit and erasure (section 25) | Principle from Phil's instruction. Reference data model Proposed, needs technical and privacy validation ([0014](../decisions/0014-privacy-preserving-audit-and-erasure.md)); retention periods Unresolved |
| Lucky Draw state machine (section 14) | Proposed ([0015](../decisions/0015-lucky-draw-round-state-machine.md)); rule choices Unresolved |
| Accessibility hooks (section 26) | Requirement Confirmed; target level Proposed ([0016](../decisions/0016-accessibility-requirement.md)) |
| Minimum offline capability per product, offline lease | Proposed ([0017](../decisions/0017-minimum-offline-capability-per-product.md)) |
| Operator control sessions | Proposed ([0004](../decisions/0004-shared-keyboard-shortcuts.md)) |
| Database, language, framework, hosting provider | Unresolved |
| Authentication method and MFA | Unresolved |
| Real-time mechanism | Unresolved (S-03) |
| Offline capability (some, all five products) | Confirmed direction ([0007](../decisions/0007-offline-capability.md)); per-product scope Unresolved (S-01, S-02) |
| Event Gallery as a distinct post-event product aggregating eligible content under revocable content grants | Confirmed ([0008](../decisions/0008-event-gallery-post-event-product.md)). The three ingestion routes and curation defaults are Proposed; the guest upload link is Unresolved |
| Account owners and event collaborators as distinct roles; account-owner-only actions including permanent event deletion | Confirmed ([0011](../decisions/0011-owner-only-account-actions.md)). Several owners, event creation and ownership recovery Unresolved |
| English (UK) at launch, progressive localisation | Confirmed ([0012](../decisions/0012-english-uk-launch-language-progressive-localisation.md)) |
| Monetisation seam (usage records, single access interface) | Proposed; billing itself deferred ([0010](../decisions/0010-defer-monetisation-until-after-mvp.md)) |
| Random selection method for Lucky Draw | Unresolved (S-06) |
| Malware scanning approach | Unresolved |
| AI moderation and translation providers | Unresolved (S-07, S-09, S-10) |
| Payment provider | Deferred until after the MVP ([0010](../decisions/0010-defer-monetisation-until-after-mvp.md)); not required for the MVP |
| Instagram integration | Optional; feasibility S-08 |
| Agent role mechanism (native subagents and skills) | Proposed; verify capabilities |
| Observability tools | Unresolved |

## 24. Consent withdrawal, revocation and content lifecycle (Proposed)

Decision [0013](../decisions/0013-consent-revocation-and-content-lifecycle.md) (proposed). This is an engineering design, not legal advice and not a claim of compliance. Values marked *open* need spike S-13 and Phil.

### 24.1 Concepts

| Concept | Purpose |
|---|---|
| `SubjectRef` | Opaque reference for a person within one event. Used by every append-only record |
| `ConsentRecord` | Subject reference, purpose, scope, wording version, time, withdrawn at |
| `ContributionReceipt` | Returned to anyone who submits without an account. A manage link (stored hashed) that lets them withdraw or ask for removal of their own content. Optionally emailed to the contributor |
| `ContentGrant` | Cross-product permission (section 13) |
| `RevocationEvent` | Append-only: kind (`consent_withdrawal`, `grant_revoked`, `contributor_removal`, `organiser_removal`, `source_deleted`, `erasure`), target ids, actor, time |
| `ErasureLedger` | Minimal list of opaque ids that were revoked or erased. Re-applied after any restore |

Every asset stores its provenance: source product, contributor reference (a `SubjectRef` or a receipt id), consent basis and moderation status.

### 24.2 Who can revoke

- Account owners and event collaborators: remove any item, revoke any grant, remove a photographer link (ordinary event operations).
- Contributors: withdraw their own content through the receipt. Identified guests: through their guest link. Proposed: this takes effect at once (the item is hidden), without waiting for approval.
- Platform admins: only through an audited, time-limited support grant.

### 24.3 What a revocation does, per artefact

| Artefact | On revocation | Timing and exposure window (values open) | Residual |
|---|---|---|---|
| Page and API authorisation | The item is excluded from every response | Next request. Authorised responses are not cached | None |
| Signed link to an original or derivative | Already-issued links keep working until they expire | The maximum link lifetime (short; *open*, proposed in minutes) | Anyone who opened one inside the window can still fetch it |
| CDN or edge cache, if used | Private media is not cached at the edge, or keys include a version that is bumped | The purge or version time (*open*, S-13) | Depends on provider behaviour |
| Derivatives (thumbnails, display sizes) | Deleted by the propagation job | Unavailable at once through authorisation; physically deleted within the job deadline (*open*) | None after the job |
| Export files (zip, spreadsheet) | Files that include the item are deleted; later exports omit it | The job deadline (*open*) | Anything already downloaded |
| Gallery or share links | Item-level eligibility still applies when the link is used; revoking a link bumps its version | Next request | Content already downloaded |
| Native share, social post, caption | Not recallable | Not applicable | The person is told at the point of sharing |
| Print order | Checked before submission; not recallable after | Before submission | Depends on the print provider |
| Email already sent | Not recallable. Emails contain links, not attachments | Not applicable | Copy in the recipient's mailbox |
| Offline device | The pack is wiped at next contact or at lease expiry | The lease length (*open*, decision 0017) | Data on a device that never reconnects before expiry |
| Backups | Not edited. The ErasureLedger is re-applied after a restore, before service resumes | Backup retention period (*open*) | Data sits in backups until they expire |
| Analytics events | Keyed by `SubjectRef`; erasure unlinks identity; aggregates stay | At erasure | Aggregate counts |
| Audit and draw evidence | See section 25 | See section 25 | See section 25 |

### 24.4 Propagation

1. A revocation writes a `RevocationEvent` and the ErasureLedger entry in the same transaction as the authorisation change.
2. A job fans out idempotent tasks (delete derivatives, invalidate exports, bump cache versions, flag offline packs). Each task records its result.
3. Failed tasks retry, then alert. The organiser sees a status ("revocation in progress" or "complete").
4. The job deadline and the signed-link lifetime are the two numbers that define the exposure window. They are *open* until S-13 measures what the chosen platform can do.

### 24.5 Items showing several people

Options are in decision 0013. Recommended (option A): any withdrawal or removal request from an identified person in the item hides it at once; the organiser then decides whether to restore, replace or delete. This needs legal advice.

### 24.6 Ingestion and eligibility

- Event Gallery ingestion routes (decision 0008; **Proposed**, not approved): organiser upload; photographer upload through a scoped, expiring, revocable link; grant-based import from Check-in Studio and ShareWall.
- Every item enters as `pending`. Only `approved` items, with a valid consent basis, a valid grant where it came from another product, retention not expired and not deleted, are visible to guests. Eligibility is evaluated when content is shown.
- Organiser and photographer uploads need a recorded consent basis. The default (organiser attests that the event has the permissions needed for this gallery) needs legal review.

### 24.7 Tests

For each row of 24.3: revoke, then check the page, an already-issued link before and after expiry, a cache, an export, an offline device and a restore from backup. Also: a contributor withdrawing through a receipt; a multi-person item; an organiser removing a photographer link; and a revocation that fails halfway and retries.

## 25. Privacy-preserving audit records, evidence and erasure (Proposed model)

Decision [0014](../decisions/0014-privacy-preserving-audit-and-erasure.md). The principle that immutable records must not hold personal data indefinitely comes from Phil's instruction. The model below is a **proposed reference data model that needs technical and privacy validation**; it is not an approved final implementation. Pseudonymised data is not assumed to be anonymous; that is a legal question.

### 25.1 Model

- **`SubjectRef`:** a random identifier, scoped to one event, so one person at two events is not linked by the reference.
- **`SubjectIdentity`:** the only place names, contact details and guest field values live (with the media itself). It can be erased.
- **Append-only records** (`AuditLog`, `CheckIn`, `DrawSelection`, `SelectionEvent`, `RevocationEvent`, consent history) hold references, opaque ids, times and structured reason codes. They hold no names, contact details or media.
- **Free text:** reasons are codes plus an optional short note limited in length and documented as "do not enter personal data". The interface warns against it.
- **Staff actors:** the user id of an account owner, event collaborator or operator is personal data of the customer's staff. It is kept for the audit retention period and then pseudonymised or removed.

### 25.2 Erasure

- Erasing a guest deletes their `SubjectIdentity` and field values, withdraws or removes their media, and writes an ErasureLedger entry. Their `SubjectRef` remains in append-only records but identifies no one. Exports show "erased participant".
- Draw evidence stays verifiable because the pool hash is over references and the selection is recomputable from the seed (section 14).
- Permanent event deletion (account-owner-only, decision 0011) removes every identity, media item and event record after the pending-deletion period. It leaves a minimal tombstone: event id, deletion time, the deleting account, and a reason code.

### 25.3 Retention classes (periods are all open and need legal advice)

| Class | Holds personal data? | Proposed handling | Period |
|---|---|---|---|
| Media originals and derivatives | Yes | Delete at event retention expiry or on revocation | Open |
| Guest identity and field values | Yes | Delete at event retention expiry or on erasure | Open |
| Consent records | Yes (by reference) | Keep as proof while the related content exists, then delete | Open |
| Check-in events | By reference only | Keep for the event retention period, then delete | Open |
| Audit log | Staff ids; references | Keep for a set period, then delete or pseudonymise staff ids | Open |
| Draw evidence | By reference only | Keep for a set period after the event, then delete | Open |
| Revocation events and ErasureLedger | Opaque ids | Keep at least as long as the oldest backup | Open |
| Analytics events | By reference only | Aggregate, then delete event-level rows | Open |
| Email jobs | Yes | Delete after delivery status is no longer needed | Open |
| Support access records | Staff ids | Keep for a set period | Open |
| Backups | Yes | Expire on a fixed schedule | Open |

### 25.4 Alternatives

Per-event or per-subject encryption keys (crypto-shredding) would make erasure cover backups, at the cost of key management. Periodic purging alone does not answer an individual erasure request. The reference model is recommended first; encryption keys can be added later if advice or evidence calls for it.

### 25.5 Tests

Erase a guest, then: the identity is gone; audit, check-in and draw records remain but resolve to "erased participant"; an evidence export still verifies; an analytics query returns no identity; restore from backup and confirm the ErasureLedger is re-applied. Delete an event and confirm nothing personal remains after the pending period. Scan logs for personal data.

## 26. Accessibility hooks

Master spec 5.11 and decision [0016](../decisions/0016-accessibility-requirement.md) define the requirement and criteria. Architecture hooks:

- A single front-end component library with accessible defaults (labels, focus handling, announcements), used by all five products.
- An automated accessibility check in CI that fails the build on serious violations.
- A shared renderer setting that honours the reduced-motion preference and enforces a flash limit for animations and reveals on displays (backlog D-12).
- Live-region announcements for status changes, winner reveals and moderation results.
- The page language follows the event or guest language (section 11).
- Shortcuts always have a visible control (section 12).
- Manual keyboard and screen-reader checks on key flows before beta (backlog O-08).

## 27. Development gates: what may proceed before legal/privacy approval

Decision [0018](../decisions/0018-discovery-and-privacy-review-first.md) (Phil, 2026-10-30):

- Repository scaffolding, architecture spikes, agent development and implementation using **synthetic data** may proceed before legal/privacy approval.
- **Real guest data and the private beta** wait for the real-data gate (backlog O-09): discovery summary, data map, the adviser's written advice, customer-facing legal documents, retention periods, the production hosting decision and the external security test decision.
- Hiring advisers, spending money and contacting prospects each need separate founder approval. Preparation is authorised.
- Milestone 1 development with synthetic data is authorised by Phil ([0019](../decisions/0019-milestone-1-development-authorised-with-synthetic-data.md)). It does not authorise production deployment, real guest data, merging into `main` or rewriting Git history.

How the architecture keeps the two apart (Proposed):

- Development and staging environments never hold real guest data. The synthetic data generator (backlog A-04) is the only source of test data.
- Features whose behaviour depends on a product or legal decision (ShareWall consent and takedown rules, Gallery revocation effects) are built behind configuration and stay off for real events until Phil has decided.
- Consent wording, retention periods and notices are configuration, not code, so advice can change them without redesign.
- The reference data model (section 25) is built and tested with synthetic data first; its technical and privacy validation happens before real data.

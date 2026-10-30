# Events Company: MVP Master Specification

The single authoritative specification. Do not create competing specs; link detailed documents from here.

- **Version:** draft 0.5, 2026-10-30 (draft 0.5 applies Phil's final corrections of 2026-10-30 and the fresh review's findings; draft 0.4 responded to the independent review report's findings F-02 to F-24 (report IDs, not backlog items); 0.3 recorded decisions C-1 to C-8; 0.2 recorded Phase 0 detail; 0.1 was 2026-10-29). Finding F-01 stays open: this draft still needs independent review in a fresh session
- **Owner / decision-maker:** founder
- **Companion file:** [CLAUDE.md](../CLAUDE.md) (rules for Claude Code). The two must agree; a conflict is escalated to the founder.

## 1. Purpose and status

The Events Company is building a UK-first digital event platform for individuals, agencies, venues and corporate events. It is self-service and needs no onsite staff. Premium remote support may be offered.

Five MVP products share one platform:

1. Check-in Studio
2. Signature Mosaic
3. ShareWall
4. Lucky Draw
5. Event Gallery

All five stay in scope. Sequencing (section 14) orders the work; it does not remove a product. Signature Mosaic, ShareWall and Event Gallery are three distinct products, even where they share rendering or media infrastructure.

The MVP has two workstreams: the customer-facing platform (sections 4 and 5) and the internal AI agent workforce that helps build and run the business (section 6.10). The workforce is not a post-MVP extra.

**Provenance of Phase 0 detail.** Sections marked "(P0)" add detail from the founder's Phase 0 discovery notes in [the Phase 0 prompt](prompts/phase-0-consolidation-and-mvp-planning.md). Where those notes conflicted with an earlier decision in this spec, the conflict is listed in section 16.1. Phil decided C-1 to C-8 on 2026-10-30; those decisions are recorded there and in `docs/decisions/`. C-9 (Git approval) was resolved for documentation checkpoints on the task branch only (see its row).

**Current state:** documentation only. No application code, stack, hosting provider, customer research, market research or pricing validation exists yet. Everything below about customers, prices and demand is unvalidated.

### 1.1 Business and market (P0)

Agreed direction, from Phase 0 discovery. Pricing and payments are deferred until after the MVP ([0010](decisions/0010-defer-monetisation-until-after-mvp.md)); commercial detail stays hypothesis (section 9).

- UK-first, with international availability. The platform is event-agnostic.
- Customers: individuals, private and independent organisers, agencies, venues, hospitality businesses, corporate event teams and brand activation agencies.
- Self-service registration and immediate use. One account manages multiple events; agency and multi-event accounts are supported.
- A customer creates an event first, then activates products. One event can use any combination of products, add products after creation and upgrade during the event.
- Future commercial direction (post-MVP, not built in the MVP): products bought individually or in bundles, an event-based model, GBP initially, with online payments, invoices and receipts. The MVP needs no payment provider and no billing implementation, but must not prevent these options (section 9).
- Check-in Studio always has a free entry point, as a permanent product principle ([0009](decisions/0009-check-in-studio-permanent-free-entry-point.md)). What it includes, and whether any other product has a free entry point, is open (section 16).
- No onsite or hardware support. Premium remote setup and support may be offered (whether in the MVP is open, section 16).
- Private beta with a small number of real organisers before public launch. Quality and reliability take priority over a launch date.

## 2. Evidence labels

Every claim in this and linked documents is one of:

| Label | Meaning |
|---|---|
| **Decision** | Made by the founder. Recorded in `docs/decisions/` or stated in this spec as agreed. |
| **Requirement** | Needed for the MVP. Agreed in the founder's brief unless marked "to confirm". |
| **Recommendation** | Proposed by Claude or an agent. Not binding until accepted. |
| **Hypothesis** | Plausible but untested. Needs evidence in section 9 before commitment. |
| **Verified fact** | Has a cited source with an access date. |
| **Source claim** | An article, competitor or vendor says so. Not independently verified. |
| **Open question** | Unresolved. Listed in section 16. |

## 3. Established decisions

- Five products, all in MVP scope.
- UK-first; self-service; premium remote support optional.
- Products are separate customer experiences on shared platform capabilities, with explicit permissions for cross-product data use.
- All five products should have some offline capability, subject to documented limitations and technical feasibility ([0007](decisions/0007-offline-capability.md)). This replaces the earlier "no offline in the initial release" position. Connectivity warnings and event-readiness checks stay. Per-product scope is not yet decided.
- Documentation first; native Claude Code capabilities; no orchestration framework ([0001](decisions/0001-documentation-first-and-native-claude-code.md)).
- The founder approves scope, spend, deployment, merges to `main` and privacy-sensitive changes (section 6).
- The five-product portfolio, with Signature Mosaic, ShareWall and Event Gallery distinct ([0002](decisions/0002-five-product-portfolio.md)).
- The agent workforce is part of the MVP, uses the six roles in `CLAUDE.md`, and runs on native Claude Code capabilities ([0003](decisions/0003-agent-workforce-mvp-workstream.md)).
- Keyboard shortcuts are a shared platform capability ([0004](decisions/0004-shared-keyboard-shortcuts.md)).
- Instagram hashtag retrieval is optional and never a launch dependency ([0005](decisions/0005-instagram-integration-assumptions.md)).
- Event Gallery is a distinct, primarily post-event product that gathers eligible content from other sources under explicit, recorded and revocable permissions ([0008](decisions/0008-event-gallery-post-event-product.md)).
- ShareWall owns collaborative photo and video grids. Signature Mosaic focuses on signatures and drawings forming designs ([0002](decisions/0002-five-product-portfolio.md)).
- Pricing tiers, subscriptions, payment processing, checkout and paid feature restrictions are deferred until after the MVP ([0010](decisions/0010-defer-monetisation-until-after-mvp.md)).
- Account owners and event collaborators are distinct roles. The account owner controls account-level actions (account ownership, billing, account deletion, ownership transfer) and permanent event deletion, with confirmation and audit. Event collaborators manage ordinary event operations, including archiving ([0011](decisions/0011-owner-only-account-actions.md)).
- English (UK) is the fully supported launch language; internationalisation supports progressive localisation ([0012](decisions/0012-english-uk-launch-language-progressive-localisation.md)).
- Event Gallery aggregates eligible content from Check-in Studio, ShareWall, organisers and photographers, and has a P0 ingestion path that enforces consent, moderation status and permissions ([0008](decisions/0008-event-gallery-post-event-product.md)). The three technical ingestion routes are **proposals**, not approved implementation decisions.
- Principle from Phil's instruction: immutable records must not retain personal data indefinitely. The reference data model in [0014](decisions/0014-privacy-preserving-audit-and-erasure.md) is **proposed** and needs technical and privacy validation; it is not an approved final implementation.
- Consent withdrawal and content revocation must work end to end ([0013](decisions/0013-consent-revocation-and-content-lifecycle.md), requirement; design proposed).
- Accessibility is a requirement in all five products ([0016](decisions/0016-accessibility-requirement.md); target level proposed).
- Repository scaffolding, architecture spikes, agent development and implementation using synthetic data may proceed before legal/privacy approval. Legal/privacy review and customer discovery begin early: preparing research, adviser shortlists and outreach drafts is authorised. Hiring advisers, spending money and contacting prospects each need separate founder approval. Real guest data and the private beta wait for the real-data gate (backlog O-09) ([0018](decisions/0018-discovery-and-privacy-review-first.md)).
- **Milestone 1 development is authorised using synthetic data** (repository scaffolding, Claude Code agent configuration, technical feasibility spikes, automated checks, synthetic-data development), subject to the existing approval and verification rules. It does not authorise production deployment, real guest data, contacting prospects, hiring advisers, material spending, merging into `main`, or force-pushing or rewriting history ([0019](decisions/0019-milestone-1-development-authorised-with-synthetic-data.md)).
- All five products and the six-role agent workforce remain MVP scope. The P0 list is what the complete MVP needs; it is not automatically a commitment to implement every item before the first usable release. Milestones sequence the work (section 14).
- **Proposed, not decided:** the Event Gallery ingestion routes (0008), the consent revocation design (0013), the reference data model (0014), the Lucky Draw state machine (0015), minimum offline capability per product (0017), operator control sessions (0004), and which backlog items belong to which milestone (section 14). Also proposed: a modular monolith as the initial architecture ([0006](decisions/0006-modular-monolith-direction.md)).

Items marked "(P0)" are founder-supplied Phase 0 detail. They are treated as agreed requirements unless they conflict with an earlier decision (section 16.1), or are marked proposed, "to resolve" or "gated". Everything else not listed here is a recommendation, hypothesis or open question.

## 4. Product scope

Capabilities below are the agreed brief. Items marked **to resolve** are not settled and must not be built until decided.

### 4.1 Check-in Studio

- Guest-list management and CSV import.
- Manual walk-ins.
- Custom fields and forms.
- Signature and photo/video capture where configured.
- QR-based entry.
- Multiple authorised devices.
- Consent records.
- Connectivity and readiness diagnostics.
- A free entry point that always exists ([0009](decisions/0009-check-in-studio-permanent-free-entry-point.md)). It is a permanent product principle, not a temporary trial. What it includes is open; paid capabilities and pricing are deferred until after the MVP (section 9).

**Phase 0 additions (P0):**

- RSVP and platform-generated invitations and RSVP requests; pre-event and on-the-day registration.
- Individual QR invitations and a shared event QR for registration.
- Guest import, editing, searching and management; guest lookup by name; configurable guest fields (for example name, email, company).
- Configurable capture of signatures or drawings, photographs and videos; photo filters.
- Configurable confirmation emails; customisable, translatable invitation and confirmation templates.
- Multiple check-in devices and stations; connectivity diagnostics and sync status.
- Idempotent synchronisation and duplicate protection. Device, user, event and timestamp are recorded for audit.
- Check-in events are never silently overwritten. A duplicate sync or retry must not create a duplicate check-in or a duplicate Lucky Draw entry.

Check-in Studio should have some offline capability, subject to documented limits and feasibility (section 5.7, [0007](decisions/0007-offline-capability.md)). Proposed minimum: a pre-event station pack, check-in by search or QR, walk-ins and queued sync, with a printable guest list or CSV as the fallback (backlog F-12). The Phase 0 proposal for conflicting edits to the same guest record is "latest update wins". It stays a proposal until spike S-02 shows how to define "latest" without trusting device clocks. Conditions: keep the full audit history, record both the device time and the server receive time, and show organisers what happened.

Accessibility criteria for this product are in section 5.11.

To resolve: which capture types the free entry point includes; consent wording and withdrawal flow; which offline capabilities Check-in Studio gets and the behaviour when connectivity drops mid-event (spikes S-01, S-02).

### 4.2 Signature Mosaic

- Guest signatures assembled into configured shapes, logos or silhouettes.
- Live mode and reveal mode.
- Custom imagery and animations.
- Export of the final composition.

**Phase 0 additions (P0):** a visual presentation product that uses event contributions. It is not primarily a media creation application.

- Signatures and drawings, with content from Check-in Studio and other configured event sources.
- Signatures and drawings assembling into a logo, number, shape or custom design; custom logo and shape uploads.
- Animation speed controls; music upload including MP3 (rights check needed).
- Live contribution mode, animated build-up mode and organiser-triggered reveal mode.
- Multiple Signature Mosaic experiences and multiple displays per event.
- Original content and processed derivatives are both preserved.
- Examples given in discovery: glowing red/orange signatures forming the number 10; white signatures forming a Christmas tree.
- Offline: some offline capability, subject to limits and feasibility (section 5.7).

**Boundary with ShareWall (decided 2026-10-30):** Signature Mosaic focuses on signatures and drawings forming designs. Collaborative photo and video grids, including the "portrait images as a large-screen grid" example from discovery, belong to ShareWall (4.3). Both may use the same rendering library; they stay separate products.

Video and media transformations are subject to a feasibility spike (S-05) and are not guaranteed MVP functionality.

**Sources (proposed):** signatures captured in Check-in Studio, and signature submissions from ShareWall only through a content grant. ShareWall keeps its own signature submissions; they feed Signature Mosaic only with a grant. Whether Signature Mosaic has its own contribution link is open.

Offline: proposed minimum is display and reveal from content cached before the event, with a pre-rendered export as the fallback (section 5.7). Accessibility criteria are in section 5.11.

To resolve: whether Signature Mosaic has its own contribution link; minimum signature count for a good result; export formats and resolution.

### 4.3 ShareWall

- Collaborative event mosaic assembled from guest contributions.
- Compositions that form shapes or logos.
- Reuses composition and rendering infrastructure from Signature Mosaic, while remaining a distinct product experience.

**Phase 0 additions (P0):**

- Uploads from guests, organisers and photographers: photos, short videos, text messages and signatures.
- Guest submission by QR code and public web link; platform uploads and photographer bulk uploads, with background upload progress, retries and error handling. Multiple photos in one submission are mainly for organiser and photographer uploads; guest capture is not assumed to behave identically.
- Publication modes: instant, or approval first.
- Moderation modes: manual, AI-assisted, or mixed. A human can always review and approve. AI assists and flags; it does not silently make irreversible decisions.
- Multiple displays per event. Access can be public, private or invited.
- Display, contribution and control are separate permissions. Attendees and holders of an authorised display link can view; control is limited to account owners and event collaborators. A display link never grants control.
- Optional content source: Instagram hashtag retrieval, under the assumptions in section 5.9. It is never a launch dependency.
- **Collaborative photo and video grids** (decided 2026-10-30): ShareWall owns grids of guest photos and videos displayed together, including large-screen portrait grids, and compositions that form shapes or logos from photos. Video is subject to feasibility (S-04, S-05).
- Contributions from people without an account return a **contribution receipt** with a manage link, so they can withdraw or ask for removal of their own content (section 11.2).
- A **report-content route** and a removal process exist for public uploads. The legal side (illegal or abusive content) is a question for the legal review (backlog H-11, M-04).
- Offline: some offline capability, subject to limits and feasibility. Proposed minimum: the display loops approved content cached before the event; guest uploads are retried on reconnect where the browser allows. Moderation and live updates need a connection (section 5.7).
- Accessibility criteria are in section 5.11.

ShareWall is the live, event-time product. The post-event destination is Event Gallery (4.5), a separate product. Approved ShareWall content can flow into Event Gallery only under an explicit, recorded and revocable permission.

To resolve before implementation: consent for contributed media, who may contribute by default, publication controls including takedown, and retention. The moderation modes above are P0 input; the consent and takedown rules are still undecided. Building and testing ShareWall with synthetic data may proceed. Exposing real guests' content waits for these decisions and the real-data gate (backlog H-06, O-09).

### 4.4 Lucky Draw

- Configurable eligibility, prizes and rounds.
- Animations and optional uploaded music.
- Repeat-winner controls.
- Winner history and export.

**Requirement:** a completed draw is auditable and idempotent. A refresh, reconnect or retry must not rerun the draw or change an established result. The result is recorded once, with its inputs, and later views read the record. This is enforced on the server, not in the browser, and must hold for repeated requests and for concurrent requests from more than one device. Tests must cover refresh, reconnect, retry and double-submit.

**Phase 0 additions (P0):**

- Entries from Check-in Studio, uploaded lists and manual additions. One entry per guest by default; repeat entries and repeat wins are optional.
- Eligibility rules, including an optional requirement to have checked in and optional eligibility based on event contributions.
- Multiple prizes and rounds, with configurable round duration, animation and music, and several winner-reveal animations.
- Presenter keyboard controls (section 5.5).
- Winner history and downloadable evidence. Changes to eligibility and draw configuration are audited.
- Execution is server-side, concurrency-safe and idempotent. A duplicate sync must not create a duplicate entry.
- Winners from earlier rounds are excluded by default unless repeat wins are on.
- Round management: next round, previous round or review, reset current round, end draw session, and winner-absent with re-draw.
- **A re-draw is an explicit, authorised operator action that creates a new, auditable selection.** The original winner is never erased. This is different from the silent rerun that the requirement above forbids.
- Resetting a round never silently deletes completed results or winner history. Consequential actions need confirmation, and the reason, operator and time are recorded.

**Round lifecycle (proposed, [0015](decisions/0015-lucky-draw-round-state-machine.md); full table in architecture 14):**

- Round states: `configured`, `ready`, `drawn`, `needs_redraw`, `closed`. A session is `active` or `ended`.
- Every command carries a command id and the expected version. A repeated or stale command changes nothing and returns the current state, so a held key or a second operator cannot move two rounds or draw twice.
- The pool is frozen as a snapshot when the round becomes `ready`. Check-ins received later, including delayed offline syncs, do not enter that round. The operator sees how many arrived since, and can refresh the pool while the round is still `ready`. Later arrivals are eligible for later rounds.
- Reset and re-draw both append records and never delete a selection or winner. Consequential commands (reset, mark absent, re-draw, close, end session) need confirmation and a reason.
- A closed round is final. A mistake after closing is handled by a new, audited round.
- Selection is a deterministic function of a server-generated seed and the snapshot, so an auditor can recompute it.
- Records hold references, not names, so an erasure request does not break verification (section 11.3).

Offline: some offline capability, subject to limits and feasibility. Server-side execution stays a requirement, so drawing needs a connection. Proposed minimum: pre-loaded configuration, presenting results already drawn, and queued check-ins (section 5.7). Accessibility criteria are in section 5.11.

To resolve: the random method and evidence format (S-06); whether an absent winner stays excluded from the same prize; whether a reset winner returns to the pool; whether a re-draw may refresh the snapshot; whether a manual fallback is allowed with no connection; how many winners a prize or round can have; how earlier-round exclusion is computed; whether the pool hash is committed before the draw so tampering can be detected; disqualification rules; rights check for uploaded music.

### 4.5 Event Gallery

Decision [0008](decisions/0008-event-gallery-post-event-product.md), 2026-10-30. Event Gallery is a distinct fifth MVP product and is primarily a **post-event** experience. It is not another live contribution product, and it is not a feature of ShareWall.

**Purpose:** give organisers and guests a branded post-event destination to browse, view, download, share and potentially print event content.

**Content it brings together:** eligible content collected throughout an event, from Check-in Studio, ShareWall, organisers and photographers (organiser uploads, guest QR submissions that arrive through the other products, and photographer uploads), plus supported imports.

**Ingestion.** Decided (Phil, 2026-10-30, [0008](decisions/0008-event-gallery-post-event-product.md)): the Gallery aggregates eligible content from Check-in Studio, ShareWall, organisers and photographers, and it has a P0 ingestion path that enforces consent, moderation status and permissions.

**Proposed technical routes (not approved implementation decisions):**

1. Organiser upload by an account owner or event collaborator (authenticated, resumable).
2. Photographer upload through a scoped, expiring, revocable upload link issued by the organiser.
3. Import of eligible content from Check-in Studio and ShareWall through a content grant.

Guest QR submissions reach the Gallery through the Check-in Studio and ShareWall flows. A dedicated guest upload link on the Gallery is a possible P1 addition (open).

**Curation (proposed):** every item has provenance, a consent basis and a moderation status of `pending`, `approved` or `rejected`. Items enter as `pending`. Only `approved` items are visible to guests. Account owners and event collaborators approve, reject or remove items, singly or in bulk. Photographer uploads wait for organiser approval unless the organiser marks that photographer as trusted (open).

**Audience (proposed default):** approved items are visible to anyone holding a valid gallery link; there is no per-guest personalisation in the MVP (open).

**Eligibility rules (decided):**

- Content must respect consent, permissions, moderation status, retention and deletion rules. Content that is unmoderated, rejected, unconsented, expired or deleted is not shown.
- Where content originates from another product, access and reuse must be explicitly authorised and auditable. Eligible, approved content can flow into the Gallery with explicit, recorded and **revocable** permissions (a cross-product grant, section 5.2).

**Capabilities:**

- Gallery browsing, viewing and multi-photo selection.
- Downloads, native sharing, social captions, printing and QR access, each according to permissions.
- Branded, secure links instead of email attachments by default.
- Analytics (first-party only, section 10), permission controls, configurable retention, export and deletion.

**ShareWall versus Event Gallery:** ShareWall is live, collaborative and used during the event on displays. Event Gallery is for browsing, downloading and sharing after the event. A ShareWall display is not a gallery, and the Gallery is not a wall.

**Revocation:** revoking a grant, withdrawing consent or removing an item takes effect at once for display and download authorisation and then propagates to links, caches, exports, offline devices and backups (section 11.2, architecture 24). Copies already downloaded, posts shared elsewhere and submitted print orders cannot be recalled; people are told this where they download, share or print.

Offline: some offline capability, subject to limits and feasibility. Proposed minimum: the gallery shell and items already opened are cached (section 5.7). Accessibility criteria are in section 5.11.

To resolve: whether the Gallery offers a guest upload link, and trusted-photographer auto-approval; the audience model; the effect of revocation on links, downloads, shares and prints already issued, and what is shown to people; supported imports; print provider (if any); who may delete guest-submitted media; default retention period; face or minor handling.

## 5. Shared platform

### 5.1 Shared capabilities

Accounts, users and memberships; events; guests and custom fields; product instances; media assets; signatures; consent; mosaic sessions; draws and winners; email jobs; usage records; audit logs; analytics; reporting. Plans, subscriptions and billing are post-MVP (section 9, [0010](decisions/0010-defer-monetisation-until-after-mvp.md)).

### 5.2 Boundary between shared and product-specific

- Shared services own storage, identity, permissions, media processing, email, audit and analytics events.
- Each product owns its own experience, rules and configuration.
- **Shared data does not mean open data.** A product reads another product's data only through an explicit permission with a stated purpose, recorded and revocable. Example: guest photos captured at check-in are not available to ShareWall unless the guest's consent covers it and the organiser enables it. Grants and the consent they rely on are in place before any product reads another's data, so they are phase 1 foundation work (backlog D-02, D-04). How a grant is revoked, and what that does downstream, is in section 11.2.

### 5.3 Platform requirements

- **Configuration:** draft and published versions, so edits do not change a live event.
- **Access:** role-based access and tenant isolation.
- **Devices:** scoped, revocable device sessions.
- **Support access:** audited and time-limited.
- **Uploads:** direct to object storage where appropriate, with permission checks before issuing upload rights.
- **Links:** secure QR tokens; link expiry and revocation.
- **Background work:** expensive media and email operations run in background jobs.
- **Analytics:** first-party, with explicit retention policies (section 10).
- **Connectivity:** show connectivity warnings and run event-readiness checks. Offline behaviour is per product and subject to documented limits and feasibility (section 5.7).
- **Monetisation readiness:** the MVP has no billing. Record per-event usage (for example storage, bandwidth, guest counts) and route product-access checks through one interface that allows everything in the MVP, so pricing, bundles, per-event pricing, agency plans, guest-count tiers, storage limits and premium features can be added later. Recommendation; see backlog D-11.

Stack, hosting and provider choices are open (section 16).

### 5.4 Event model and account features (P0)

- An account manages many events. Each event has a name, description, type, dates and times, and venue or location.
- Event branding, language and regional settings. Reusable brand templates, mainly for agencies.
- Guest lists with configurable guest fields.
- **Roles (decided 2026-10-30, [0011](decisions/0011-owner-only-account-actions.md)):** account owners and event collaborators are distinct. The **account owner** controls account-level actions and permanent event deletion. **Event collaborators**, invited per event, manage ordinary event operations. The word "owner" is not used for an event.
- **Account-owner-only actions** ("owner-only" for short): account ownership, billing, account deletion, ownership transfer and **permanent event deletion**. Billing is defined now, though billing itself is post-MVP. Archiving an event is an ordinary event operation that collaborators can do.
- Several products can run in one event, with several devices and displays.
- Audit logs and meaningful email notifications.
- Event archive and deletion, with configurable data retention.
- Customer-controlled consent and privacy settings.
- Account-owner-only actions need explicit confirmation and an audit entry. Permanent event deletion also needs (proposed) a typed confirmation of the event name, recent re-authentication, and a pending-deletion period during which the account owner can cancel; the period's length is open. The audit entry holds no guest personal data (section 11.3). Open: whether an account can have several account owners, who may create an event, and how ownership is recovered if the account owner is unavailable.

### 5.5 Keyboard shortcuts (shared capability, P0)

Decision [0004](decisions/0004-shared-keyboard-shortcuts.md): shortcuts are a platform capability, not a Lucky Draw feature.

- Product-specific shortcuts with consistent conventions, a visible reference for operators, and configurable bindings where practical.
- Keyboard, touch and tablet alternatives for every shortcut-driven action.
- Protection against accidental activation. Focus awareness, so shortcuts do not fire during text entry. Confirmation for consequential actions.
- Operator control mode is separate from the public display mode. Only authorised control sessions can run privileged operations; a public display link never grants control.

**Conventions (proposed, [0004](decisions/0004-shared-keyboard-shortcuts.md)):**

- The same key means the same thing in every product: `Space` advances or pauses, `R` reveals, `Esc` goes back or cancels.
- Consequential actions (reset, mark absent, re-draw, end session) never use a bare key. They use `Shift` plus a key, always open a confirmation, and record a reason where one is needed.
- Key-repeat events are ignored and controls lock while a command is in flight. The server also rejects repeated and stale commands (architecture 14.4).
- Every shortcut has a button, touch or tablet alternative.

**Operator control session (proposed, needs Phil's approval):** a presenter who is not an account owner or event collaborator can be given a scoped control session for one event and named capabilities (for example `draw`). It expires, is revocable, and exposes only what the console needs. This avoids making venue staff collaborators with wide access (backlog D-17).

Proposed defaults, to validate during design and **not decided**:

| Product | Keys |
|---|---|
| Signature Mosaic | `Space` pause/resume animation; `R` reveal (organiser-triggered); `Esc` exit reveal or return to display |
| Lucky Draw | `Space` start draw; `N` next round; `P` review the previous round (read-only); `Shift+R` reset current round; `Shift+X` mark winner absent; `Shift+D` re-draw; `Esc` back to the display without ending the session |
| ShareWall | `Space` pause/resume presentation |
| Check-in Studio, Event Gallery | None supplied; to decide |

### 5.6 Internationalisation and localisation (P0)

- **Decided 2026-10-30 ([0012](decisions/0012-english-uk-launch-language-progressive-localisation.md)):** English (UK) is the fully supported launch language. Internationalisation supports progressive localisation after launch. No UI text is hard-coded, so languages can be added.
- Languages named in discovery are candidates for later releases, not launch commitments: Simplified Chinese, Traditional Chinese, Korean, Thai, French, German, Spanish, Italian, Portuguese, Dutch and further European languages. Arabic is not currently required. The order of later languages is open.
- Account language, event language and guest-facing language are set independently. Guests may override a suggested browser or device language. An event's language can differ from the organiser's.
- Regional date, time, time-zone, number and currency formats; suitable fonts, long strings and complex scripts.
- Customers can customise and translate event instructions and templates. Whether customer-authored translations are offered at launch, or English only, is open.
- Optional AI-assisted translation of user-generated content, keeping the original and marking the translation. Needs privacy review before use, because content leaves our systems.

### 5.7 Offline capability (decided in principle; minimums proposed)

**Decided 2026-10-30 ([0007](decisions/0007-offline-capability.md)):** all five products should have some offline capability, subject to documented limitations and technical feasibility. This replaces the earlier "no offline operation in the initial release" position. It does not promise offline parity. Connectivity warnings and readiness checks stay.

**Proposed minimums, limits and fallbacks ([0017](decisions/0017-minimum-offline-capability-per-product.md)),** pending spikes S-01 and S-02 and Phil's approval:

| Product | Minimum offline capability | Limits | Fallback if the minimum proves infeasible |
|---|---|---|---|
| Check-in Studio | A pre-event station pack of the event's guest list on authorised devices; check-in by name search or QR; walk-ins; queued sync | The pack must be loaded while online. Guest edits other than walk-ins need a connection. Photo, video and signature capture queue only if device storage allows, otherwise they are disabled offline with a visible notice | Printable guest list or CSV for manual check-in, entered later |
| Signature Mosaic | Display and reveal from content cached before the event; reveal runs locally on the display device | New contributions and multi-device sync need a connection | Pre-rendered export of the composition played locally |
| ShareWall | The display loops approved content cached before the event; guest uploads retry from the guest's device on reconnect where the browser allows | Moderation, new approvals and live updates need a connection. Queued guest uploads are not guaranteed | Exported slideshow of approved content |
| Lucky Draw | Pre-loaded configuration and pool; the console presents results already drawn; offline check-ins queue | Drawing needs a connection because execution is server-side (4.4) | Open: a labelled manual fallback is not proposed for the MVP (see 16) |
| Event Gallery | The gallery shell and items already opened are cached | Browsing new items, downloads and permission checks need a connection | Organiser-prepared export before the event, subject to the revocation limits in 11.2 |

**Descoping rule:** if S-01 shows a product cannot meet its minimum, that product falls back to cached display of previously loaded content plus readiness diagnostics, approved by Phil with the evidence. Every product keeps some offline capability, and no product claims parity.

**Capabilities kept distinct:**

| Capability | Meaning | Needs connection? |
|---|---|---|
| Offline capture | Record a check-in or contribution locally | No |
| Offline interaction | Operate a product's controls locally | Depends on product |
| Local cached display | Show already-loaded content | No |
| Queued synchronisation | Send queued work when back online | Yes, to complete |
| Live-only functions | Central draw execution, remote moderation, real-time updates | Yes |

**Offline privacy and revocation (proposed):**

- A device receives only the data its role needs, in an expiring pack (a lease).
- At expiry or next contact the device syncs its queue and then wipes the pack.
- Revocation of a device, user, grant or consent reaches an offline device at next contact or lease expiry, whichever is first. The maximum exposure window therefore equals the lease length. Its value is open and Phil must accept it.
- Browser storage cannot be fully protected against someone with access to the device, and the product makes no stronger claim.
- Guests' own phones (queued uploads, cached Gallery items) are outside the lease and cannot be wiped by us. This limit is stated to users.
- Queued items carry the device time (`claimed_at`) and a client id. The server records `received_at` and a sync batch.

Design for idempotent writes, client-generated identifiers and visible sync status, because several devices already need them.

### 5.8 Technology direction (P0)

- Responsive browser-based application; PWA support where practical; no native mobile app for the MVP.
- Multiple concurrent devices, with real-time updates where needed.
- **Recommendation:** a modular monolith first, not microservices ([0006](decisions/0006-modular-monolith-direction.md)), subject to technical validation.
- Built locally with VS Code and Claude Code. Prefer open-source, straightforward technology unless evidence supports another choice.
- Standard cloud hosting eventually. AWS is a possible option, not a decision.
- Feasibility research is required for offline sync, real-time communication, media processing, storage and egress, AI moderation, translation and the Instagram API. See [the risk register](planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md).

No stack, provider or hosting choice is made here. Trade-offs are in [the architecture proposal](architecture/MVP-TECHNICAL-ARCHITECTURE.md).

### 5.9 Instagram hashtag integration (optional, P0)

Decision [0005](decisions/0005-instagram-integration-assumptions.md). An optional ShareWall content source.

- Only Meta's official API. An organiser can configure an event hashtag.
- What can be retrieved depends on Meta account eligibility, permissions, app review and API limits. Not every post with the hashtag will be retrievable. Private or inaccessible posts are excluded. These assumptions are unverified and must be checked against Meta's current documentation.
- Direct uploads, QR submissions, photographer uploads and Check-in Studio remain the reliable sources.
- Instagram approval must not block the MVP launch.

### 5.10 Internal administration (P0)

An internal platform administration dashboard covers customers, events, products, storage, bandwidth, usage, errors, support and audit. An agent activity view follows the dashboard core (backlog B-08), and revenue reporting arrives with billing, post-MVP. Support access to customer data is time-limited and audited (section 5.3).

### 5.11 Accessibility (requirement; target level proposed)

Decision [0016](decisions/0016-accessibility-requirement.md). **Requirement (accepted):** guest-facing and operator-facing interfaces in all five products are accessible and have testable criteria. **Target (proposed, Phil to confirm after advice):** WCAG 2.2 Level AA. Meeting it is an engineering goal and does not establish legal compliance.

**Criteria for every product (testable):**

1. Every function works from the keyboard alone, with a visible focus indicator and no keyboard trap. Every shortcut has a visible control (5.5).
2. Text contrast is at least 4.5:1 (3:1 for large text, interface components and graphics). Meaning is never carried by colour alone.
3. Interactive targets are at least 24 by 24 CSS pixels, apart from the exceptions in the standard.
4. Pages reflow at 320 CSS pixels wide and text can be enlarged to 200% without losing content or function.
5. Form fields have labels. Errors are described in text. Status changes (saved, checked in, approved, winner drawn) are announced to assistive technology.
6. Animations honour the reduced-motion setting and offer a static alternative. Nothing flashes more than three times in any second, including reveals on large displays. Moving content that lasts over five seconds can be paused.
7. Images and media have text alternatives where supplied. Organisers and contributors can add alternative text. Where none exists, the label is generic and never invents a description.
8. The page language follows the event or guest language (5.6).
9. An automated accessibility check runs in CI and fails on serious violations. Before the private beta, key flows are checked by hand with a keyboard and a screen reader (backlog O-08).

Public displays are not interactive, but the contrast, flashing and legibility rules still apply to them.

**Per-product acceptance criteria:**

| Product | Criteria |
|---|---|
| Check-in Studio | Guest search, QR entry, walk-in form and check-in confirmation work with keyboard and screen reader. Success and failure are announced and not shown by colour alone. Targets are large enough for tablet use. Signature capture offers an alternative to drawing, if Phil confirms (open) |
| Signature Mosaic | The control panel is fully keyboard operable. The reveal has a reduced-motion alternative and respects the flash limit. The signature capture alternative above applies |
| ShareWall | The submission form is accessible and has an alternative-text field. The moderation queue is keyboard operable and announces status changes. Displays meet the contrast and flash rules |
| Lucky Draw | Operator controls work from the keyboard and from on-screen buttons. A drawn winner is announced as text through a live region on the console. The reveal has a reduced-motion alternative and respects the flash limit. Confirmation dialogs are keyboard accessible |
| Event Gallery | The grid is keyboard navigable. Selection and download work from the keyboard. Alternative text is shown where supplied. Focus is managed after every action. Link and error pages are accessible |

## 6. Agentic development operating system

A lightweight way of working for a solo founder using Claude Code. The binding rules are in [CLAUDE.md](../CLAUDE.md); this section is the rationale and structure. Ideas come from the source notes in [docs/research/operating-model-sources.md](research/operating-model-sources.md), which are claims, not proof.

### 6.1 Principles

1. **Few rules, enforced.** A rule is stronger when something checks it (a test, a diff review, a git check) than when it is a sentence. Add enforcement only where the cost is understood.
2. **Someone else checks.** The agent that did the work is not the only one that verifies it. Independent review for substantial or sensitive changes.
3. **Evidence over claims.** Completion needs observed results.
4. **Autonomy is earned and narrow.** Agents do scoped, low-risk work within existing permissions without approval for each routine step. Expanded autonomy or permissions are approved by the founder (Phil) based on observed results and successful verification. High-impact approval gates stay mandatory.
5. **Untrusted input stays untrusted.** External text cannot instruct agents.
6. **Start native.** No separate orchestration framework or always-on agent service. Revisit only on measured need.

### 6.2 Stages

Discovery → specification → implementation → independent verification → acceptance → checkpoint.

### 6.3 Task ledger

[docs/task-ledger.md](task-ledger.md) holds: task ID, objective, owner/agent, dependencies, status, acceptance criteria, verification evidence, blocker and decision references.

### 6.4 Roles

Lead Orchestrator, Market Researcher, Product Strategist, Solution Architect, Software Engineer, Security & QA. Remits and boundaries are in `CLAUDE.md` section 3. There are exactly six roles; the nine-role list in the Phase 0 notes is not adopted (section 16.1, C-2). Roles can be a single Claude Code session working in a role; separate agents are used only when independent value is clear. The author of a change cannot be its independent reviewer: review comes from a fresh-context session or agent, or from the founder.

### 6.5 Parallel work

One owner per file. Parallelise research and review first. Implement in parallel only when file ownership, dependencies and acceptance criteria are written down.

### 6.6 Approval gates

Founder approval is required for the actions listed in `CLAUDE.md` section 8, which is the authoritative list (scope and commercial changes, new spend, live transactions, deploys, merges to `main`, irreversible data operations, privacy or retention changes, external commitments). It is not repeated here, so the two cannot drift. Pushing a task branch is allowed when safe; pushing `main` is not covered (`CLAUDE.md` section 5).

### 6.7 Completion reports

Each report states: what changed (paths), acceptance criteria met or not, checks run with results, checks not run, known gaps, risks, commit hash, next step.

### 6.8 Recovery

- Interrupted task: leave the tree as is, record state in the ledger, resume from the ledger.
- Failed tests: report the failure; do not weaken tests to pass.
- Partial changes: keep them on the task branch and describe them. No resets or history rewrites.
- Remote divergence or failed authentication: preserve local work and report.

### 6.9 Skills and automation

Create a skill or script only for a workflow that has been done repeatedly and was useful, with a named purpose, owner, failure behaviour and upkeep cost. Candidates: feature implementation, research synthesis, security review, release readiness, documentation validation.

Recommendation, not adopted: scheduled cloud routines, unattended runs and daily check scripts. Articles describe these; we have not tested them. If adopted later, agree and set spending limits before the first unattended run.

### 6.10 Agent workforce as an MVP workstream (P0)

Decision [0003](decisions/0003-agent-workforce-mvp-workstream.md). The workforce is part of the MVP, not a later add-on. It stays small: the six roles in `CLAUDE.md` section 3, run through Claude Code's native subagents and skills. No always-on orchestration service and no separate framework (decision 0001).

**What the workforce supports.** Product research and improvement ideas; customer and competitor research; architecture and technical design; software development; independent code review, QA and security checks; task tracking, documentation and reporting. Branding, marketing, sales material, prospect research, UX and visual design, and business operations and finance analysis are later functions of the same roles, not separate roles (see the mapping below).

| Business function | Handled by (MVP) | Status |
|---|---|---|
| Product research, improvement ideas | Market Researcher, Product Strategist | In MVP |
| Customer and competitor research | Market Researcher | In MVP |
| Architecture and technical design | Solution Architect | In MVP |
| Software development | Software Engineer | In MVP, after implementation is approved |
| Independent review, QA, security checks | Security & QA | In MVP |
| Task tracking, documentation, reporting | Lead Orchestrator | In MVP |
| UX requirements | Product Strategist | In MVP; visual design is later |
| Marketing, sales material, partnerships research | Market Researcher, Product Strategist | Later (see section 12). A new role needs a decision record |
| Business operations, finance analysis | Market Researcher, Lead Orchestrator | Later; any financial action stays a founder gate |

**Phased build-out (recommendation).**

1. *Foundation:* `CLAUDE.md`, the task ledger, decision records and this spec (exist). Add role definitions as native subagents or skills only when the first tasks that use them are scheduled.
2. *Limited capability:* each role has a written remit, inputs, outputs, permitted files and tools, and escalation rule. Work runs from the ledger.
3. *Earned autonomy:* routine, low-risk steps run without per-step approval within existing permissions. Wider permissions are approved by Phil based on observed, verified results.
4. *Later:* more advanced capabilities, once the simpler approach has proved its value.

**Requirements.** Clear role boundaries; task inputs and acceptance criteria; defined permissions and tool access; shared context in the repository; task ownership and status in the ledger; traceable outputs and decisions; independent review where appropriate; no concurrent writes to the same files; recommendations and opportunities labelled as recommendations.

**Limits.** The Lead Orchestrator coordinates and reports; it is not an unchecked authority. Agents do not merge into `main`, deploy, spend material money, make binding external commitments, change major architecture or scope, run irreversible data operations, or use sensitive customer data beyond explicit permission. `CLAUDE.md` section 8 is the authoritative list. The admin dashboard (5.10) includes agent activity.

## 7. Delivery workflow (per milestone)

1. Review existing requirements and decisions.
2. Define scope, dependencies and acceptance criteria.
3. Identify security, privacy, commercial and technical risks.
4. Implement a small, coherent increment.
5. Test happy paths, failure paths, permissions and relevant edge cases.
6. Independent review for substantial changes.
7. Update documentation and decision records.
8. Commit and push a verified checkpoint when safe.
9. Report commit, tests, remaining risks and next recommended step.

The working tree stays safe: no overwriting unrelated work, no force-push to resolve divergence.

## 8. Quality gates and measurement

### 8.1 Gates

A change is accepted only when: acceptance criteria are met; the diff is in scope; relevant tests pass (observed); security-sensitive or architectural changes have independent review; docs and decisions are updated; results and known gaps are recorded.

### 8.2 Measures

| Measure | Notes |
|---|---|
| Acceptance criteria passed | Per task |
| Test results and coverage of critical behaviours | Pass/fail, and whether permissions and failure paths are covered |
| Defects found after acceptance | Counted by severity |
| Rework and repeated failure causes | Tag causes in the ledger |
| Time from agreed task to verified acceptance | From the ledger |
| AI usage cost per accepted feature | Needs cost records from the start |
| Founder review time | The likely bottleneck |
| Blocked tasks and time awaiting decisions | From the ledger |

Not success measures: lines of code, number of agents, number of commits, activity volume.

**Baselines first.** No numeric improvement targets until baselines exist. There are no baseline figures today; none are claimed.

## 9. Commercial model and validation

**Decided 2026-10-30 ([0010](decisions/0010-defer-monetisation-until-after-mvp.md)):** pricing tiers, subscriptions, payment processing, checkout and paid feature restrictions are deferred until after the MVP. The MVP requires no payment provider and no billing implementation. The design must not prevent introducing later: per-product pricing, bundles, per-event pricing, agency plans, guest-count tiers, storage limits and premium features (monetisation readiness, section 5.3).

**Decided 2026-10-30 ([0009](decisions/0009-check-in-studio-permanent-free-entry-point.md)):** Check-in Studio always has a free entry point. Future pricing must keep it.

Everything else in this section is **hypothesis** and post-MVP planning. None of it is validated willingness to pay. The private beta runs without billing.

### 9.1 Hypotheses to test

- Free Check-in Studio as an acquisition route. The free entry point itself is decided (0009); its value for acquisition and its limits are still hypotheses.
- Per-event pricing.
- Product bundles.
- Agency/venue subscriptions or event credits.
- Paid advanced forms, limits, branding, reporting, integrations and remote support.

### 9.2 Provisional price experiments

Discussed earlier, unvalidated, and not to be published or committed to:

| Tier | Provisional range |
|---|---|
| Free | £0 |
| Single event | £19–£39 |
| Event Plus | £49–£99 |
| Pro / Agency | £49–£149+ per month |

### 9.3 Evidence required before committing to a model

- Customer interviews and observed workflows.
- Competitor pricing and capability research with dated sources.
- Paid pilot results.
- Storage, bandwidth, processing and email costs.
- Support and operational costs.
- Contribution margin and usage limits.
- Willingness to pay by segment.

### 9.4 Cost and limit considerations

Free-tier expiry warnings; download windows; explicit upload and storage limits; retention periods; media-processing cost; bandwidth and egress cost. These are post-MVP monetisation considerations. Whether the MVP needs technical usage caps for abuse or cost protection, which is a safeguard and not a paid restriction, is open.

Planned document when there is content: `docs/pricing-and-unit-economics.md`.

## 10. Analytics and reporting definitions

Three separate classes. Do not mix them in one number.

1. **First-party platform activity.** Check-ins, gallery visits, downloads, email delivery. Source: our own events.
2. **Attributable campaign activity.** Tracked link clicks, UTM visits. Source: our links and landing pages. Attribution limits must be stated.
3. **External social metrics.** Impressions, reach, engagement. Only via authorised integrations or customer-provided reports.

A share-button click is class 1 (an intent event). It is **not** a verified social impression, reach or engagement.

Each reported metric needs: a name, a calculation rule, a data source and its attribution limits. Retention periods for analytics are defined before launch.

## 11. Security, privacy and legal

**Sensitive data:** guest lists, contact details, signatures, photographs, videos, consent records, event analytics.

These are **areas to investigate with professional review**, not statements that the platform complies:

- UK GDPR and the Data Protection Act 2018
- PECR (marketing and electronic communications)
- Photography and video, and consent
- Children's data
- Marketing permissions
- Controller/processor roles (organiser vs platform)
- International transfers (hosting and sub-processors)
- Retention and deletion
- Access controls
- Incident response

### 11.1 Acceptance criteria before launch

- Tenant isolation tested, including cross-tenant access attempts.
- Upload permissions enforced server-side.
- QR and link tokens unguessable, expiring and revocable.
- Access revocation takes effect for device sessions on the next request, and for offline devices at next contact or lease expiry. The maximum exposure window is documented and accepted by Phil.
- Retention, deletion and erasure are enforced and tested, including derivatives, exports, offline packs and a restore from backup (11.2, 11.3).
- Consent withdrawal and revocation are tested for every artefact listed in architecture 24.3, with the exposure windows measured and recorded.
- A report-content route and a removal process exist for public uploads.
- The data-subject request runbook has been exercised (11.4).
- The accessibility criteria in 5.11 pass, including a manual check with assistive technology.
- Support access audited and time-limited.
- Audit logs cover sensitive actions.
- Consent is purpose-specific and recorded; customers control their own privacy and content permissions.
- Display, QR and control tokens are separate; a display token can never perform control actions.
- Media storage and upload handling are secure (type and size checks, scanning approach decided). Event deletion needs safeguards and confirmation.
- Photographs, videos and children's data have a documented handling approach before launch. This is an investigation item, not a compliance claim.
- AI moderation and AI translation send user content to a provider only after a privacy review, and never make irreversible decisions on their own.
- No secrets in the repository; secrets handled by environment variables or a secret manager.
- Development and tests use synthetic or anonymised data.
- Incident response plan exists and has an owner.
- A qualified reviewer has seen the legal and privacy approach. Until then, no claim of compliance.
- The customer-facing legal documents in 11.4 exist and have been reviewed by the adviser before real guest data is handled.

### 11.2 Consent withdrawal, revocation and content lifecycle (requirement; design proposed)

Decision [0013](decisions/0013-consent-revocation-and-content-lifecycle.md); design in architecture 24. This is an engineering design, not legal advice.

- Every asset stores its provenance: source product, contributor reference, consent basis and moderation status.
- Contributors without an account receive a **contribution receipt** with a manage link to withdraw or ask for removal of their own content. Identified guests use their guest link.
- Account owners and event collaborators can remove any item and revoke any grant. Contributors and identified guests can withdraw their own content. Proposed: a withdrawal hides the item at once.
- A revocation is authorised against on the next request. It then propagates to derivatives, caches, exports, offline devices and backups. The architecture lists the exposure window for each artefact. The values (signed-link lifetime, purge target, propagation deadline, lease length, backup retention) are open.
- Limits are shown to people at the point of download, share and print: copies already taken cannot be recalled.
- Items showing several people: proposed that any request from an identified person hides the item, and the organiser decides whether to restore, replace or delete. Needs legal advice (options in decision 0013).
- Backups are not edited. An erasure ledger of opaque ids is re-applied after any restore, before service resumes.

### 11.3 Audit records, evidence and erasure (principle from Phil; reference data model proposed)

Decision [0014](decisions/0014-privacy-preserving-audit-and-erasure.md) is a **proposed reference data model that needs technical and privacy validation**; it is not an approved final implementation. Design in architecture 25.

- **Principle (from Phil's instruction):** immutable records do not keep personal data indefinitely. "Append-only" means no edits through the application, not unlimited retention.
- Append-only records (audit, check-in events, draw selections and evidence, revocation events) hold opaque per-event references, times and structured reason codes. Names, contact details and media live only in erasable identity records.
- Erasing a person deletes their identity record and media. Their references then identify no one, and exports show "erased participant". Draw evidence stays verifiable.
- Permanent event deletion (account-owner-only) removes the event's identities, media and records after the pending-deletion period, leaving a minimal tombstone.
- Every record class has a retention period. The periods are open and need legal advice.
- Pseudonymised data is not assumed to be anonymous. Whether the references remain personal data is a question for the legal review.

### 11.4 Data-subject requests, backup and recovery (requirement; design open)

- Requests for access, export, erasure and withdrawal have a documented runbook and tooling that act on the identity record, media and consent (backlog M-10).
- Backups run on a fixed schedule, expire after a set period, and are restore-tested including re-applying the erasure ledger (backlog E-07).
- Availability and recovery objectives for live events are set by Phil with the cost in view (backlog M-11).
- An incident response plan with a named owner exists (backlog M-05).
- Customer-facing legal and trust documents are drafted with the adviser before real guest data: privacy notices, organiser terms, an agreement describing controller and processor roles, a sub-processor list, a cookie and analytics notice, an acceptable-use policy for uploads, and licence terms for photographers' work in downloads and prints (backlog M-12).
- An external security test is decided before real guest data, together with the authentication policy including multi-factor (backlog M-13).

Planned document when there is content: `docs/security-and-privacy.md`.

## 12. Marketing and motion design (future, not an MVP dependency)

Do not build a motion pipeline until there is a working product worth demonstrating and a marketing need.

When it happens:

- Use genuine product screens and approved assets.
- Write a storyboard first; produce a rough render, inspect it, then refine.
- Make reusable demonstrations for the five products.
- No invented capabilities, testimonials or results.
- Check permission, licence, privacy and consent for every asset, including music and any customer footage.

A source article describes a code-driven render workflow ([notes](research/operating-model-sources.md)). Its steps target Mac/Linux, and no cost figures are given. Feasibility on our Windows setup and its cost are unknown.

## 13. Investor research (deferred)

Fundraising and any investor-database purchase are deferred. First validate customer demand, differentiation, unit economics and whether the company wants external funding.

If fundraising becomes a priority: build a targeted list and verify fit, stage, geography and thesis for each investor. A generic AI investor database is not an MVP dependency. The public part of one such product's page was read; the rest is paywalled and no purchase was made.

## 14. Roadmap (dependency-ordered, no dates)

| Phase | Content | Exit condition |
|---|---|---|
| 0 | Requirements, stack shortlist and feasibility spikes, and the stack decision. **Customer discovery and legal/privacy preparation begin early and run in parallel** ([0018](decisions/0018-discovery-and-privacy-review-first.md)) | Founder accepts requirements and the stack decision; open items for phase 1 settled. Discovery and legal/privacy work gate real guest data and the private beta (backlog O-09), not development with synthetic data |
| 1 | Shared platform foundations: tenancy, permissions, cross-product grants and consent, privacy-preserving records, uploads, revocation and erasure, accessibility baseline; quality and security controls | Tenancy, roles, grants, consent, uploads, revocation, audit, accessibility and test baseline pass their acceptance criteria |
| 2 | The five product modules in dependency order, all five kept in scope | Each module meets its acceptance criteria |
| 3 | End-to-end integration of cross-product flows (for example ShareWall to Event Gallery), reporting. Billing and entitlements are post-MVP | Cross-product flows and revocation tested end to end |
| 4 | Validation, security and privacy review, pilot | Review findings handled; pilot results recorded |
| 5 | Launch readiness and measured rollout | Launch criteria in section 11.1 met; founder approves release |

Likely module order (**recommendation**): Check-in Studio first as the entry point and source of guests; Signature Mosaic next, since ShareWall reuses its rendering; Lucky Draw and Event Gallery depend on the guest and media foundations. Confirm in phase 0.

Repository scaffolding, spikes, agent development and implementation using synthetic data may proceed before legal/privacy approval (decision 0018). Real guest data and the private beta wait for the real-data gate (backlog O-09). Hiring advisers, spending money and contacting prospects need Phil's separate approval; preparation is authorised. The agent workforce (6.10) is a parallel MVP workstream from phase 0 onward. A small-scale private beta with real organisers happens in phase 4, before public launch.

**Delivery milestones (proposed sequencing; Phil confirms the contents).** Milestones order the approved scope. They do not remove any product, any agreed offline capability or the six-role workforce, and the P0 list is not automatically a commitment to implement every item before the first usable release.

| Milestone | Content | Done when |
|---|---|---|
| 1 Development foundation | Repository scaffold; Claude Code agent capabilities; technical architecture spikes; synthetic test data; automated checks | A fresh checkout builds and passes the automated checks; the agent capability check is recorded; the stack decision and spike results are recorded |
| 2 First end-to-end experience | Create an event; register or check in a guest; capture a signature; display Signature Mosaic; view eligible content in Event Gallery | One person can do all five steps on synthetic data, with consent and permissions enforced |
| 3 Complete MVP and private beta | All five products; agreed offline capabilities; security and privacy controls; accessibility; operational readiness; real-event validation | The exit conditions of phases 2 to 5 and the real-data gate are met |

Item-level lists for each milestone are in backlog section 1.1.

The dependency-ordered delivery plan, with epics, critical path and spikes, is in [the delivery backlog](planning/MVP-DELIVERY-BACKLOG.md). It sequences work; it does not set dates.

No dates are promised until scope and feasibility are understood. Each milestone defines its own acceptance criteria, dependencies, risks and exit conditions before it starts. Planned document when there is content: `docs/roadmap.md`.

## 15. Supporting documents

| Document | Status |
|---|---|
| [CLAUDE.md](../CLAUDE.md) | Exists |
| [docs/research/operating-model-sources.md](research/operating-model-sources.md) | Exists |
| [docs/decisions/](decisions/README.md) | Exists |
| [docs/task-ledger.md](task-ledger.md) | Exists |
| [docs/prompts/update-master-spec-and-claude-md.md](prompts/update-master-spec-and-claude-md.md) | Exists (instruction prompt) |
| [docs/architecture/MVP-TECHNICAL-ARCHITECTURE.md](architecture/MVP-TECHNICAL-ARCHITECTURE.md) | Exists (proposal; this spec prevails). Replaces the planned `docs/architecture.md` |
| [docs/planning/MVP-DELIVERY-BACKLOG.md](planning/MVP-DELIVERY-BACKLOG.md) | Exists (proposal). Takes the role of the planned `docs/roadmap.md` for sequencing |
| [docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md](planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md) | Exists (proposal) |
| [docs/prompts/phase-0-consolidation-and-mvp-planning.md](prompts/phase-0-consolidation-and-mvp-planning.md) | Exists (instruction prompt, reconciled 2026-10-30) |
| [docs/Reviews/phase-0-independent-review.md](Reviews/phase-0-independent-review.md) | Exists (review brief) |
| [docs/Reviews/phase-0-independent-review-report.md](Reviews/phase-0-independent-review-report.md) | Exists (first review report; F-01 open) |
| [docs/Reviews/phase-0-review-response.md](Reviews/phase-0-review-response.md) | Exists (how each finding was handled; some rows superseded, see its update note) |
| [docs/Reviews/phase-0-fresh-independent-review-report.md](Reviews/phase-0-fresh-independent-review-report.md) | Exists (second pass by the authoring session; not a fresh-session review) |
| [docs/Reviews/phase-0-final-corrections-summary.md](Reviews/phase-0-final-corrections-summary.md) | Exists (change summary for the independent reviewer) |
| [docs/prompts/phase-0-fresh-independent-review.md](prompts/phase-0-fresh-independent-review.md) | Exists (instruction prompt) |
| [docs/prompts/phase-0-independent-acceptance-and-checkpoint.md](prompts/phase-0-independent-acceptance-and-checkpoint.md) | Exists (instruction prompt with Phil's Milestone 1 authorisation) |
| [docs/Reviews/phase-0-independent-acceptance-report.md](Reviews/phase-0-independent-acceptance-report.md) | Exists (review by a fresh-context subagent of commit `53bd0d0`; accept with changes; Phil has not yet read it) |
| [docs/prompts/milestone-1-first-task-proposal.md](prompts/milestone-1-first-task-proposal.md) | Exists (B-01 prompt; run 2026-10-30, see the capability note) |
| [docs/research/claude-code-capabilities.md](research/claude-code-capabilities.md) | Exists (B-01 observed capabilities and limits; reviewed by a fresh-context subagent; Phil's read pending) |
| [docs/research/stack-and-hosting-shortlist.md](research/stack-and-hosting-shortlist.md) | Exists (A-08 draft shortlist, no decision; Phil's review pending) |
| [docs/prompts/phase-0-final-corrections.md](prompts/phase-0-final-corrections.md) | Exists (instruction prompt with Phil's final decisions) |
| `docs/requirements.md` | Not yet created; created when requirements are detailed beyond this spec |
| `docs/market-research.md` | Not yet created; follows research |
| `docs/pricing-and-unit-economics.md` | Not yet created |
| `docs/security-and-privacy.md` | Not yet created |
| `docs/roadmap.md` | Not yet created; section 14 and the delivery backlog cover sequencing for now |

Placeholders are deliberately not created.

## 16. Open decisions and questions (founder)

Items below are unresolved. Where a design is proposed, the decision record is named. None of them is treated as approved.

1. Technology stack and development hosting (backlog A-01, after the A-08 shortlist and the spikes). The production hosting provider and data location for real guest data are decided separately (backlog A-09) with legal advice.
2. Payment provider and billing approach. **Deferred until after the MVP** ([0010](decisions/0010-defer-monetisation-until-after-mvp.md)).
3. ShareWall consent, contributor rules, takedown and publication controls, and the policy for items showing several people (options in [0013](decisions/0013-consent-revocation-and-content-lifecycle.md)).
4. Retention periods for every record class (architecture 25.3), media defaults, and backup retention. Free-tier expiry is post-MVP.
5. Controller/processor model and legal review route.
6. Lucky Draw: the random method and evidence format; whether an absent winner stays excluded from the same prize; whether a reset winner returns to the pool; whether a re-draw may refresh the snapshot ([0015](decisions/0015-lucky-draw-round-state-machine.md)).
7. Whether Signature Mosaic has its own contribution link, and the signature source rules (4.2).
8. Customer segments to research first (individuals, agencies, venues, corporate).
9. Whether premium remote support, AI-assisted translation and AI moderation are in the MVP or later, and the privacy review route for each.
10. Whether Claude Code scheduled or unattended runs are worth adopting, and under what spend limits.
11. Whether to enforce documentation checks by script (and keep the validation script in the repository), and a line-ending policy.
12. What Check-in Studio's permanent free entry point includes, and whether any other product has one (post-MVP pricing work).
13. The order in which languages are added after launch, and whether customer-authored translations are offered at launch.
14. Whether an account can have several account owners; who may create an event; how ownership is recovered if the account owner is unavailable; and the length of the pending-deletion period for permanent event deletion.
15. Offline: the lease length, the pack contents, whether Phil accepts the exposure window, the per-product minimums ([0017](decisions/0017-minimum-offline-capability-per-product.md)), and whether Lucky Draw ever gets a manual fallback.
16. Event Gallery: whether it offers a guest upload link, trusted-photographer auto-approval, the audience model, and what revocation does to links, downloads, shares and prints already issued.
17. The signed-link lifetime, cache purge target and propagation deadline (spike S-13).
18. The accessibility target level, and whether signature capture offers an alternative to drawing ([0016](decisions/0016-accessibility-requirement.md)).
19. Whether the MVP needs technical usage caps for abuse or cost protection.
20. Availability and recovery objectives for live events.
21. How illegal or abusive public uploads are reported and handled (legal advice).
22. Operator control sessions for presenters who are not event collaborators ([0004](decisions/0004-shared-keyboard-shortcuts.md)).
23. Founder approvals still needed for external actions: hiring a legal/privacy adviser, spending money, and contacting prospects, each separately. Preparation is authorised ([0018](decisions/0018-discovery-and-privacy-review-first.md)).
24. Starting Milestone 2 and later implementation. Milestone 1 is authorised with synthetic data ([0019](decisions/0019-milestone-1-development-authorised-with-synthetic-data.md)); the rest follows decision 0001 until Phil says otherwise.
25. An external security test, and the authentication policy including multi-factor (backlog M-13).
26. Lucky Draw: how many winners a prize or round can have, how earlier-round exclusion is computed, and whether the pool hash is committed before the draw ([0015](decisions/0015-lucky-draw-round-state-machine.md)).
27. Which backlog items belong to Milestones 1 and 2 (section 14, backlog 1.1). The lists are proposals.

### 16.1 Conflict register: Phase 0 notes versus existing documents

C-1 to C-8 were decided by Phil on 2026-10-30. The decision is the resolution recorded in the table and in the linked decision record. Where a decision replaced an earlier spec position (C-3), the table says so. C-9 was resolved for documentation checkpoints on the task branch; its row says what stays prohibited.

| ID | Phase 0 notes say | Earlier position | Resolution | Status |
|---|---|---|---|---|
| C-1 | Four products; Gallery is part of ShareWall | Five products; Event Gallery is separate | Existing position applied, per Phil's 2026-10-30 instruction ([0002](decisions/0002-five-product-portfolio.md)) | Resolved by instruction |
| C-2 | Nine agent roles | Six roles in `CLAUDE.md` | Six applied; other functions mapped to them (6.10) | Resolved by instruction |
| C-3 | Offline capture and queued sync across products; "latest update wins" | No offline in the initial release (section 3) | **Resolved:** all five products should have some offline capability, subject to documented limits and feasibility. The earlier position is **replaced** ([0007](decisions/0007-offline-capability.md)). Per-product scope and the "latest update wins" rule stay open until S-01 and S-02 | Resolved 2026-10-30; scope open |
| C-4 | Photo and video grids belong to "Mosaic" | Signature Mosaic is signature-driven; ShareWall is the contribution wall | **Resolved:** ShareWall owns collaborative photo and video grids; Signature Mosaic focuses on signatures and drawings forming designs ([0002](decisions/0002-five-product-portfolio.md)) | Resolved 2026-10-30 |
| C-5 | Post-event Gallery sits inside ShareWall | Event Gallery has its own sources and permissions | **Resolved:** Event Gallery stays a distinct, primarily post-event product. Eligible, approved content flows into it under explicit, recorded and revocable permissions ([0008](decisions/0008-event-gallery-post-event-product.md)) | Resolved 2026-10-30; aggregation decided, ingestion routes proposed (0008); revocation effects open (0013) |
| C-6 | Many languages "required"; English UK "initial" | Not previously specified | **Resolved:** English (UK) is the fully supported launch language; internationalisation supports progressive localisation ([0012](decisions/0012-english-uk-launch-language-progressive-localisation.md)) | Resolved 2026-10-30; later-language order open |
| C-7 | Owner and collaborator permissions the same | Not previously specified | **Resolved:** account owners and event collaborators are distinct roles. The account owner controls account-level actions and permanent event deletion; event collaborators manage ordinary event operations ([0011](decisions/0011-owner-only-account-actions.md)) | Resolved 2026-10-30; several-owners, event creation and ownership recovery open |
| C-8 | "Free tier is required" | Free Check-in Studio is a hypothesis (9.1) | **Resolved:** Check-in Studio always has a free entry point ([0009](decisions/0009-check-in-studio-permanent-free-entry-point.md)). Pricing, tiers, subscriptions, payments and paid restrictions are deferred past the MVP ([0010](decisions/0010-defer-monetisation-until-after-mvp.md)) | Resolved 2026-10-30; free scope open |
| C-9 | Agents may make routine task-branch commits and pushes | Same in `CLAUDE.md` section 5, with no Git steps authorised for the earlier documentation tasks | **Resolved in part:** in `docs/prompts/phase-0-independent-acceptance-and-checkpoint.md` Phil authorised a documentation draft commit and push of the existing `docs/update-master-spec` branch, and a final checkpoint commit and push after the independent review. **Still prohibited without Phil's separate approval:** merging into `main`, pushing `main`, force-pushing, rewriting history, production deployment | Authorised for documentation checkpoints on `docs/update-master-spec` only (2026-10-30). Draft checkpoint `53bd0d0` pushed and verified |

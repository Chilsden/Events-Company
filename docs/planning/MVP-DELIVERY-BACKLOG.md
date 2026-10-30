# MVP Delivery Backlog

- **Version:** draft 0.3, 2026-10-30 (applies Phil's final corrections of 2026-10-30 and the fresh review's findings. Review finding IDs such as F-05 are report IDs, not backlog items; the first review's finding F-01 stays open)
- **Status:** proposal. The [master spec](../MVP-MASTER-SPEC.md) prevails. No implementation has started and none is authorised by this document.
- **Scope:** all five products and the agent workforce are in the MVP. Items that depend on an unresolved decision are marked **gated**; they are planned, not committed. Phil's decisions of 2026-10-30 (C-3 to C-8, and the instructions that followed the independent review) are applied; see the spec's conflict register. **One role owns each item.** Where a design review is needed it is named in the Verification column, so an author never reviews their own work.
- **No dates.** Sizes are relative: S, M, L, XL. Priority: **P0 is required for the complete MVP (Milestone 3). It is not automatically a commitment to implement the item before the first usable release**; milestones (section 1.1) sequence the work. P1 important, P2 can be simplified or deferred. **Post-MVP** items are planned but deliberately outside the MVP (monetisation, decision 0010). **Moved** marks an item whose scope moved to another item.
- **Roles** are the six in `CLAUDE.md`: Lead Orchestrator (Orch), Market Researcher (Res), Product Strategist (Strat), Solution Architect (Arch), Software Engineer (SE), Security & QA (SQA). Founder decisions are by Phil.
- **Verification** means evidence observed and recorded in the [task ledger](../task-ledger.md), not a statement that work is done. Substantial and security-sensitive items also get independent review (SQA or Phil).
- Spike IDs (S-xx) are in the [risk register](MVP-TECHNICAL-RISKS-AND-SPIKES.md).

## 1. Delivery phases (map to spec section 14)

| Phase | Epics | Exit |
|---|---|---|
| 0 Stack decision, spikes, and early discovery and legal/privacy preparation | A-08, A-01, B, L-01, M-09, M-11, spikes S-01 to S-13; early track O-10, M-14, M-08 (authorised now) and O-02, M-04 (need Phil's approval) | Stack decision recorded; open items for phase 1 settled. The real-data gate (O-09) is not a phase 0 exit: it gates real guest data and the private beta |
| 1 Foundations (built and tested with synthetic data) | A (incl. A-07), C, D (incl. grants D-02, consent D-04, receipts D-13, revocation D-14, privacy-preserving records D-15), E (incl. E-07), K, M (core), L-02, L-09 | Tenancy, permissions, grants, consent, revocation, privacy-preserving records, uploads, accessibility baseline and test baseline pass their criteria |
| 2 Products | F, G, H, I, J, and the offline minimums in L (dependency order) | Each product meets its acceptance criteria, including accessibility and its offline minimum |
| 3 Integration | End-to-end cross-product flows (J-08), reporting, M (admin). Epic N (billing) is post-MVP | Cross-product flows and revocation tested end to end |
| 4 Validation | O (real-data gate O-09, security review, accessibility audit, legal review, private beta) | Findings handled, beta results recorded |
| 5 Launch readiness | O-06, O-07 | Spec 11.1 criteria met; Phil approves release |

The agent workforce (epic B) runs in parallel from phase 0.

### 1.1 Delivery milestones (proposed; Phil confirms the lists)

Milestones sequence the approved scope. They do not remove any product, any agreed offline capability or the six-role workforce. Milestone 3 contains every item not listed for Milestones 1 or 2 or the early track, except Post-MVP and Moved items. Moving an item between milestones is a sequencing choice, not a descoping decision.

| Milestone | Content (from Phil's final corrections) | Backlog items |
|---|---|---|
| Early track (parallel, from the start) | Discovery and legal/privacy preparation. Preparing research, adviser shortlists, outreach drafts and the data map is authorised; contacting prospects (O-02) and hiring an adviser (M-04) need Phil's separate approval | O-10, M-14, M-08 authorised now; O-02, M-04 need approval |
| 1 Development foundation | Repository scaffold; Claude Code agent capabilities; technical architecture spikes; synthetic test data; automated checks | A-01, A-02, A-03, A-04, A-05, A-06, A-07, A-08, B-01, B-02, B-03, B-04, M-09, and spikes S-01 to S-13 as needed |
| 2 First end-to-end experience | Create an event; register or check in a guest; capture a signature; display Signature Mosaic; view eligible content in Event Gallery | C-01, C-02, C-03, C-04, D-01, D-02, D-03, D-04, D-06, D-07, D-08, D-10, D-12, D-13, D-15, E-01, E-02, E-03, F-01, F-02, F-05, F-06, G-02, G-03, J-01, J-12, J-13, K-01, K-02, L-02, O-01 |
| 3 Complete MVP and private beta | All five products; agreed offline capabilities; security and privacy controls; accessibility; operational readiness; real-event validation | Every other P0, P1 and P2 item, the gated decision items, A-09, M-12, M-13 and the real-data gate O-09 |

Milestone 2 touches the five products only as far as the five steps need. Signature Mosaic live and reveal modes (G-03) use the real-time layer (D-10). Event Gallery content reaches the Gallery through the proposed routes in J-12 (organiser and grant import), and is viewed by an account owner or event collaborator; links, downloads and sharing (J-02 to J-04) are Milestone 3.

**Development gates.** Items in Milestones 1 and 2 run with synthetic data and do not wait for legal/privacy approval (decision 0018). **Milestone 1 is authorised by Phil** (decision 0019); Milestone 2 and later start on Phil's instruction (decision 0001). Real guest data, the private beta (O-05) and the features that depend on advice wait for O-09.

## 2. Critical path, dependencies and parallel work

**Critical path to Milestone 2 (recommendation):** stack shortlist (A-08) → spikes S-03, S-04, S-11, S-13 → stack decision (A-01) → repository scaffold (A-02) → accounts and roles (C-01) with the threat model (M-09) → permission model (D-01) → privacy-preserving records (D-15, with the data map M-08) → guest model, consent, tokens, grants (D-03, D-04, D-07, D-02) → media upload (E-01, E-02) → Check-in core, signature capture, Signature Mosaic and Gallery view (F-01, F-05, F-06, G-02, G-03, J-01, J-12, J-13). **Critical path to the private beta:** the rest of Milestone 3, then the real-data gate (O-09), which needs the discovery summary (O-02), the adviser's advice (M-04), the legal documents (M-12), the hosting decision (A-09) and the security test decision (M-13). Discovery and legal work run in parallel and do not block Milestones 1 and 2.

**Product order (recommendation):** Check-in Studio first (source of guests); Signature Mosaic next (shared rendering); then ShareWall; Lucky Draw needs check-in data; Event Gallery needs the media foundation. Confirm in phase 0.

**Parallelisable:** epic B; the early track (O-10, M-14, M-08); rendering spike S-05 beside the stack work (the design-stage threat model M-09 starts after the stack decision A-01 and before D-01 and D-07); internationalisation (K-01 to K-03) once the repository exists. N-05 is post-MVP research. Parallel agents must have separate file ownership in the ledger.

**Technical spikes before commitment:** S-01 to S-13. All spikes use synthetic data.

**Decision-gated items** (do not start until Phil decides): ShareWall consent, contributor and takedown rules (H-06); what revoking a grant does to links, downloads, shares and prints already issued, and the Gallery audience model (J-10); availability objectives (M-11); operator control sessions (D-17); the external security test and authentication policy (M-13); the production hosting and data-location decision (A-09). Retention periods and consent wording are configuration: the mechanisms (E-05, D-04) are built with synthetic data, and Phil sets the values with advice before real data (O-09). **Needs Phil's approval to act externally:** O-02 (contacting prospects) and M-04 (hiring an adviser). **Feasibility-led items:** offline scope per product is set by L-01 from spikes S-01 and S-02, then approved by Phil, with the descoping rule in spec 5.7. **Post-MVP:** epic N and the order of later languages (K-07).

**Dependency rules.** Any item that reads another product's data depends on D-02 (grants) and D-04 (consent), both phase 1 foundation work. The shared rendering library is a platform item (D-12). The guest model (D-03) depends on the privacy-preserving identity split (D-15); the permission model (D-01) and token service (D-07) depend on the threat model (M-09). Every implementation item depends on the repository scaffold (A-02), directly or through another item.

## 3. Backlog

### A. Repository, development and agent foundations

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| A-01 | Stack decision record for development and spikes: language, framework, database, development hosting, with trade-offs; confirms or revises the relational-database and S3-compatible-storage assumptions in architecture 2. The production hosting region for real guest data is A-09 | P0 | Arch | A-08, S-03, S-04, S-11, S-13 | Decision record states options, trade-offs and risks; Phil approves | Phil approval recorded | L |
| A-02 | Repository scaffold: structure, linting, formatting, test runner, CI | P0 | SE | A-01 | Fresh checkout installs, lints and runs tests in CI | Observed CI run | M |
| A-03 | Environments and secrets handling (dev, staging, production plan) | P0 | SE | A-01, A-02 | No secrets in the repo; secrets read from environment or manager | Secret scan; SQA review | M |
| A-04 | Synthetic data generator for guests, media and events | P0 | SE | A-02 | Realistic data without real persons; documented | Used in tests; reviewed | M |
| A-05 | Documentation checks (link check) if Phil wants them scripted | P2 | SE | A-02 | Script fails on a broken link | Run on a seeded broken link | S |
| A-06 | Branch and review workflow note (task branch, review, ledger update) | P1 | Orch | none | Written procedure that matches `CLAUDE.md` | Used on one real task | S |
| A-07 | Accessibility baseline: accessible component library defaults, automated accessibility check in CI, reduced-motion and flash-limit policy, manual test script | P0 | SE | A-02 | CI fails on serious violations; components meet spec 5.11 criteria 1 to 8; manual script exists | Seeded violation is caught; component walkthrough with keyboard and screen reader | M |
| A-08 | Stack and hosting shortlist: candidate language, framework, database and hosting options, with the question each spike must answer (written before the spikes, so the spikes do not wait for the decision) | P0 | Arch | none | A shortlist per layer with trade-offs and the assumptions in architecture 2 listed | Phil reviews the shortlist | S |
| A-09 | Production hosting provider and data-location decision for real guest data, using the adviser's advice (**gated**: legal advice and Phil). Blocks real guest data, not development | P0 | Arch | A-01, M-04 | Decision record takes the advice on data location and international availability into account; Phil approves | Phil approval; written advice | S |

### B. Agent workforce and orchestration

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| B-01 | Capability check: what the installed Claude Code supports for subagents, skills, permissions | P0 | Arch | none | Short note of tested, observed capabilities and limits | Commands/results recorded | S |
| B-02 | Role definitions for the six roles (remit, inputs, outputs, tool and file permissions, escalation) | P0 | Orch | B-01 | Each role matches `CLAUDE.md` section 3; no extra roles | SQA review; Phil approval | M |
| B-03 | Task delegation template and ledger discipline | P0 | Orch | B-02 | Trial task delegated with all required fields | Ledger row with evidence | S |
| B-04 | Independent review procedure (fresh-context reviewer) | P0 | SQA | B-02 | Reviewer catches a seeded defect in a trial change | Observed result | M |
| B-05 | Usage cost recording per accepted task | P1 | Orch | B-03 | Cost recorded for the first tasks; baseline noted | Ledger entries | M |
| B-06 | Sourced-research procedure (URL, access date, limits, claim labels) | P1 | Res | B-02 | One research note follows it | Reviewed note | S |
| B-07 | Autonomy review: record observed results per task type for Phil | P1 | Orch | B-03 | Table of task types, results, proposed autonomy changes | Phil decision recorded | S |
| B-08 | Agent activity feed for the admin dashboard | P2 | SE | M-01 | Dashboard shows agent task activity | Demo with test data | M |

### C. Accounts, organisations and event management

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| C-01 | Accounts and users; account owners and event collaborators (invited per event) as distinct roles; account-owner-only actions (account ownership, billing, account deletion, ownership transfer, permanent event deletion). Open points in spec 16 item 14 are decided or defaulted with Phil's approval | P0 | SE | A-02 | Create account, invite an event collaborator, revoke; tenant scoped; an event collaborator is refused every account-owner-only action | Tests incl. cross-tenant attempts and an event collaborator attempting each account-owner-only action | L |
| C-02 | Authentication (method decided first) | P0 | SE | A-01, C-01 | Sign-up and sign-in work; sessions revocable | Tests; SQA review | L |
| C-03 | Event create and configure: name, description, type, dates, venue, language, regional settings | P0 | SE | C-01 | Event saved and edited; validation on fields | Tests | M |
| C-04 | Product instances: activate, add later, upgrade during an event; draft and published configuration | P0 | SE | C-03 | Any product combination per event; published config unchanged by drafts | Tests | L |
| C-05 | Multi-event and agency account features | P1 | SE | C-03 | Account lists and manages many events | Tests | M |
| C-06 | Event archive and permanent deletion: archiving by event collaborators; permanent deletion only by the account owner, with typed confirmation, recent re-authentication, a pending-deletion period and an audit entry | P0 | SE | C-03, E-05, D-15 | An event collaborator cannot permanently delete; the account owner can cancel during the pending period; purge removes identities, media and records and leaves a minimal tombstone | Tests incl. event collaborator attempts and cancel; SQA review | M |
| C-07 | Email notification framework (jobs, templates, delivery status) | P0 | SE | C-01 | Queued email sent in test mode; failures recorded | Tests with mail sandbox | M |
| C-08 | Account deletion and ownership transfer (account-owner-only); ownership recovery per the decision when made | P0 | SE | C-01, D-15, E-05 | Only the account owner can start either; both are confirmed, audited and purge or move data as specified | Tests incl. event collaborator attempts; SQA review | M |

### D. Shared event data, permissions and branding

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| D-01 | Permission model and tenant-scoped data-access layer: account-level and event-level roles, including the account-owner-only action set | P0 | SE | C-01, M-09 | Every query scoped; matrix of roles by action tested, including account-owner-only actions and the limits of event collaborators | Permission matrix tests; Arch design review; SQA review | XL |
| D-02 | Cross-product content grants (purpose, scope, who enabled, revocable). Foundation for every cross-product read | P0 | SE | D-01, D-04 | A product cannot read another product's data without a valid grant; revoking a grant stops access on the next request | Tests incl. denied, revoked and expired grants | L |
| D-03 | Guest model, configurable fields, CSV import. Personal details live in the erasable identity record (D-15), not in the guest row | P0 | SE | C-03, D-15 | Import with validation and error report; fields configurable; no names or contact details outside the identity record | Tests with synthetic CSVs; scan for personal data outside the identity record | L |
| D-04 | Consent records, wording versions and customer privacy settings; guest-facing withdrawal through the guest link. Wording is configuration; final wording needs the adviser before real data | P0 | SE | D-03, D-15 | Consent stored per subject reference with purpose, scope, wording version, time; wording is configurable; a guest can withdraw; a withdrawal writes a revocation event | Tests with synthetic data | L |
| D-05 | Branding and reusable brand templates | P1 | SE | C-03 | Template applied across events | Tests | M |
| D-06 | Audit log: append-only, privacy-preserving | P0 | SE | D-01, D-15 | Sensitive actions logged with actor, opaque ids, occurred_at, received_at (server-assigned) and a reason code; no names or media; cannot be edited via the app; retention job per record class | Tests; log inspection for personal data | M |
| D-07 | Token service: invitation, event QR, display, contribution, gallery, control | P0 | SE | D-01, M-09 | Random, scoped, expiring, revocable; display token cannot control; links that must be shown again are derived and versioned | Tests for misuse and revocation; SQA review | L |
| D-08 | Device sessions: scoped to event and station, revocable | P0 | SE | D-07 | A revoked device loses access on the next request when online; offline devices lose it at next contact or lease expiry (L-09) | Tests | M |
| D-09 | Keyboard shortcut service (shared capability) | P1 | SE | A-02 | Registered actions, focus awareness, reference panel, rebinding | Browser tests | M |
| D-10 | Real-time channel layer for displays and control | P0 | SE | S-03, A-01, A-02 | Display receives updates; reconnect reloads current state | Multi-client test | L |
| D-11 | Monetisation seam (recommendation): per-event usage records (storage, bandwidth, guest counts) and one product-access interface that allows everything in the MVP | P1 | SE | D-01, C-04 | Usage recorded per event; every product-access check goes through the one interface; no payment, plan or billing code exists | Review against decision 0010; tests | M |
| D-12 | Shared composition and rendering library (platform item, moved from G-01): honours the reduced-motion setting and enforces the flash limit | P0 | SE | S-05, A-02 | Renders a defined input set deterministically; reduced-motion alternative and flash limit verified | Visual and unit tests; flash-limit check | XL |
| D-13 | Contribution receipts and manage links for contributors without an account | P0 | SE | D-07, D-04 | Every anonymous submission returns a receipt; the manage link lets the contributor withdraw or ask for removal; the link is stored hashed | Tests incl. reuse, expiry and abuse | M |
| D-14 | Revocation and erasure propagation service: revocation events, erasure ledger, jobs for derivatives, caches, exports and offline packs | P0 | SE | D-02, D-04, D-13, E-01, S-13 | Each artefact in architecture 24.3 is handled; failures retry and alert; organiser sees status; ledger is re-applied after a restore | End-to-end revocation tests per artefact; failure-injection test | XL |
| D-15 | Reference data model (proposed, decision 0014): pseudonymous subject references and erasure-safe records; separate erasable identity record; append-only records hold references only | P0 | SE | D-01, M-08 | No names, contact details or media in audit, check-in, draw or revocation records; erasure removes identity and leaves records that resolve to "erased participant"; validated technically (erase, export, restore, evidence verification) with synthetic data; privacy review by the adviser before real data (O-09) | Tests; scan of logs and exports for personal data; Arch design review; adviser review before real data | L |
| D-16 | Abuse controls and rate limiting for public endpoints (QR, links, uploads, receipts) | P0 | SE | D-07 | Limits enforced and tested; abuse attempts are logged without personal data | Tests; SQA review | M |
| D-17 | Operator control sessions: scoped, expiring, revocable, command allow-list (**gated** on Phil's approval) | P1 | SE | D-07, D-08 | A presenter who is not an event collaborator can run a granted product and cannot do anything outside the allow-list | Tests incl. expiry and revocation; SQA review | M |

### E. Media storage, upload and processing

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| E-01 | Private object storage and signed direct upload after permission check; short signed-link lifetime; versioned derivative keys | P0 | SE | D-01, S-04, S-13 | Upload only with a valid grant; originals private; link lifetime and key versioning as set by S-13 | Tests incl. expired and unauthorised | L |
| E-02 | Resumable uploads with progress, retry and clear errors | P0 | SE | E-01 | Interrupted upload resumes; failures reported | Tests with network faults | L |
| E-03 | Image derivative worker (thumbnails, display sizes); originals kept | P0 | SE | E-01 | Derivatives produced and linked to the original | Tests | M |
| E-04 | Short video handling (scope set by S-04, S-05) | P1 | SE | S-04, S-05, A-02, E-01 | Defined formats accepted and processed, or clearly declined | Tests | XL |
| E-05 | Retention and deletion jobs per record class (architecture 25.3). Periods are configuration; Phil sets the values with advice before real data | P0 | SE | A-02, D-15 | Expired data removed from storage, derivatives, exports and logs per class, and logged; periods configurable; tested with synthetic data | Tests; SQA review | L |
| E-06 | Upload validation and malware scanning approach | P0 | SE | E-01 | Type and size checks; scanning decision recorded | Tests with bad files; SQA review | M |
| E-07 | Backups, restore and deletion-in-backups: scheduled backups that expire, restore test that re-applies the erasure ledger | P0 | SE | A-01, D-14 | A restore on a test environment brings back service data and re-applies every erasure and revocation before service resumes | Observed restore test; SQA review | L |

### F. Check-in Studio

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| F-01 | Guest list management: import, edit, search, lookup by name | P0 | SE | D-03 | Find a guest by partial name quickly in a large list | Tests; timing recorded | L |
| F-02 | Manual walk-ins and custom forms | P0 | SE | D-03 | Walk-in recorded with configured fields | Tests | M |
| F-03 | Individual QR invitations and shared event QR registration | P0 | SE | D-07 | QR admits only the intended guest or registers per rules | Tests incl. reuse and revoked | M |
| F-04 | Check-in stations and multiple authorised devices | P0 | SE | D-08 | Several devices check in at once without conflicts | Multi-device test | L |
| F-05 | Idempotent, append-only check-in events; duplicate protection | P0 | SE | D-06, D-15 | Retries and double scans never create duplicates or overwrite; each event stores claimed_at and received_at and a sync batch | Retry and concurrency tests | L |
| F-06 | Configurable signature, photo and video capture with consent | P0 | SE | E-01, D-04, D-15 | Capture only when configured and consented; capture offline follows the Check-in minimum (spec 5.7) | Tests | L |
| F-07 | RSVP and invitation/confirmation emails with translatable templates | P1 | SE | C-07, K-06 | Emails sent in guest language; template editable | Tests with sandbox | L |
| F-08 | Photo filters | P2 | SE | F-06 | A defined set applied without losing the original | Tests | M |
| F-09 | Connectivity diagnostics and event-readiness check | P0 | SE | D-08 | Check reports connectivity, permissions, device status | Tests; dry run | M |
| F-10 | Check-in Studio offline minimum: station pack, check-in by search or QR, walk-ins, queued sync | P0 | SE | L-01, L-03, L-09, F-12, S-01, S-02 | The approved minimum works; limits shown to operators; no duplicate check-in; no silent overwrite | Offline and online tests with network faults and skewed clocks | L |
| F-11 | Accessibility acceptance for Check-in Studio (spec 5.11 criteria for this product) | P0 | SE | A-07, F-01, F-04 | The Check-in Studio criteria in spec 5.11 pass: keyboard and screen-reader operation, contrast, reduced motion, flash limit, announced status changes | Automated accessibility check in CI; keyboard and screen-reader walkthrough recorded | M |
| F-12 | Printable guest list and CSV export as the manual fallback | P0 | SE | F-01 | A current list can be exported and printed; entries made on paper can be keyed in later without creating duplicates | Tests with synthetic data | S |

### G. Signature Mosaic

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| G-01 | Moved: the shared composition and rendering library is a platform item, D-12 | Moved | n/a | n/a | n/a | n/a | n/a |
| G-02 | Signatures and drawings assemble into a logo, number or shape | P0 | SE | D-12, D-02, D-04, F-06 | Output matches the target shape for a test set; Check-in signatures are read only through a grant | Reviewed renders; denied-without-grant test | L |
| G-03 | Live, animated build-up and organiser-triggered reveal modes | P0 | SE | G-02, D-10 | Reveal fires once from control mode; display follows | Multi-client test | L |
| G-04 | Custom logo and shape upload | P1 | SE | G-02, E-01 | Accepted formats converted to usable shapes | Tests | M |
| G-05 | Animation speed controls; music upload (rights check) | P1 | SE | G-03 | Controls change speed; music plays on display | Tests; rights note | M |
| G-06 | Multiple Signature Mosaic experiences and displays per event | P1 | SE | G-03, D-10 | Several displays stay in sync | Multi-client test | M |
| G-07 | Export of the final composition | P1 | SE | G-02 | Export file produced at defined formats | Output review | M |
| G-08 | Moved: photo and video grids belong to ShareWall (H-09) by decision of 2026-10-30 | Moved | n/a | n/a | n/a | n/a | n/a |
| G-09 | Accessibility acceptance for Signature Mosaic (spec 5.11 criteria for this product) | P0 | SE | A-07, G-03 | The Signature Mosaic criteria in spec 5.11 pass: keyboard and screen-reader operation, contrast, reduced motion, flash limit, announced status changes | Automated accessibility check in CI; keyboard and screen-reader walkthrough recorded | M |

### H. ShareWall

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| H-01 | Submission pipeline: QR, public link, organiser uploads (photos, short video, text, signatures), with a contribution receipt | P0 | SE | E-02, D-07, D-13 | Submission reaches the queue; progress and retry work; every anonymous submission returns a receipt | Tests | L |
| H-02 | Moderation queue; instant and approval modes; manual review | P0 | SE | H-01 | Approved items only appear in approval mode | Tests | L |
| H-03 | Separate display, contribution and control permissions | P0 | SE | D-07 | Display link cannot moderate or control | Misuse tests; SQA review | M |
| H-04 | Wall display with multiple displays | P0 | SE | D-12, D-10 | Wall updates live; several displays | Multi-client test | L |
| H-05 | AI-assisted moderation: flags only, human decides | P1 | SE | S-07, S-10, A-02, H-02 | AI never publishes or deletes alone | Tests; privacy review | L |
| H-06 | Consent, contributor and takedown rules, including the policy for items showing several people (**gated** on Phil's decision; legal advice is an input before real data) | P0 | SE | Phil, D-04 | Implemented as decided; takedown removes content and writes a revocation event | Tests with synthetic data | L |
| H-07 | Instagram hashtag adapter (optional) | P2 | SE | S-08, H-02 | Retrieved posts enter normal moderation; absence harms nothing | Tests; failure injection | L |
| H-08 | Photographer and multi-photo bulk uploads | P1 | SE | E-02 | Many photos upload in one session | Tests | M |
| H-09 | ShareWall collaborative photo and video grids, including grids that form a shape or logo; video scope per S-04 and S-05 | P0 | SE | D-12, H-04, S-05 | Approved photos fill a grid on a display and can form a shape or logo; video only if the spike shows it is feasible | Visual review; multi-client test | L |
| H-10 | Accessibility acceptance for ShareWall (spec 5.11 criteria for this product) | P0 | SE | A-07, H-02, H-04 | The ShareWall criteria in spec 5.11 pass: keyboard and screen-reader operation, contrast, reduced motion, flash limit, announced status changes | Automated accessibility check in CI; keyboard and screen-reader walkthrough recorded | M |
| H-11 | Report-content route and removal process for public uploads (mechanism built with synthetic data; wording and process confirmed with legal advice before real data) | P0 | SE | H-02 | A viewer can report an item; the account owner or an event collaborator, or the platform, can remove it quickly; actions are audited | Tests | M |

### I. Lucky Draw

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| I-01 | Pools and entries from check-in, uploaded lists and manual additions; eligibility rules | P0 | SE | F-05, D-03, D-02, D-04, D-15 | One entry per guest by default; options work; no duplicate from sync; contribution-based eligibility reads ShareWall only through a grant | Tests | L |
| I-02 | Round and session state machine with command preconditions, and the atomic, idempotent, server-side draw (architecture 14) | P0 | SE | S-06, I-01 | Transitions exactly as architecture 14.3; two simultaneous or repeated commands yield one result; a stale version changes nothing; a repeated command id returns the stored result | Concurrency, retry, reconnect and stale-version tests; SQA review | XL |
| I-03 | Prizes and rounds configuration; winners excluded in later rounds by default | P0 | SE | I-01 | Rules applied; repeat wins optional | Tests | M |
| I-04 | Winner-absent, re-draw, reset, close and end-session commands, with confirmation, reason and audit | P0 | SE | I-02, D-06 | Re-draw appends a new selection; reset voids rather than deletes; closed rounds are final; every consequential command records reason, operator and time | Tests; audit inspection | L |
| I-05 | Winner history and downloadable evidence: references, snapshot hash, seed, algorithm, commands | P0 | SE | I-02 | An auditor can recompute the result from the seed and snapshot; names appear only for identities that still exist, otherwise "erased participant"; verification survives an erasure | Output review; erase-then-verify test | M |
| I-06 | Reveal display: animations, round duration, music | P1 | SE | I-02, D-10 | Display replays the stored result; refresh does not redraw | Browser test | L |
| I-07 | Presenter keyboard controls and tablet alternatives | P1 | SE | D-09, I-02, D-17 | Key-repeat is ignored; controls lock while a command is in flight; consequential actions use Shift plus a key and confirm; none fire in text fields; every action has a button | Browser tests incl. held key and double press | M |
| I-08 | Integrity test suite: refresh, reconnect, retry, double-submit, held key, two operators, stale version, late check-in, delayed offline sync, reset then draw, absent then re-draw, advance pressed twice, erase then export | P0 | SQA | I-02 | Suite passes and fails on a seeded defect | Observed run | M |
| I-09 | Accessibility acceptance for Lucky Draw (spec 5.11 criteria for this product) | P0 | SE | A-07, I-02 | The Lucky Draw criteria in spec 5.11 pass: keyboard and screen-reader operation, contrast, reduced motion, flash limit, announced status changes | Automated accessibility check in CI; keyboard and screen-reader walkthrough recorded | M |
| I-10 | Late check-in cut-off: snapshot cut-off, "arrived since the snapshot" count, unsynced-device warning where known, pool refresh while ready | P0 | SE | I-02, F-05 | A check-in received after the snapshot never enters that round; the console shows the count; refresh creates a new snapshot and keeps the old one | Tests with delayed sync | M |

### J. Event Gallery

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| J-01 | Gallery model, provenance and eligibility engine: consent basis, approved moderation status, valid grant where the content came from another product, retention, deletion | P0 | SE | E-01, D-02, D-04, D-13, D-15 | Content shown only when eligible; evaluated when shown | Tests incl. unapproved, rejected, unconsented, expired, deleted and revoked items | L |
| J-02 | Browsing, multi-photo selection and downloads, with the limits of recall shown at download | P0 | SE | J-01, J-10, D-14 | Select and download several items by permission; revoked items are excluded from exports; the limit message appears | Tests incl. revocation during export | M |
| J-03 | Secure branded links and QR access with expiry, revocation and version bump | P0 | SE | D-07, J-10, D-14 | Expired or revoked link denies access on the next request | Tests | M |
| J-04 | Native sharing and social captions, with the limits of recall shown | P1 | SE | J-02, J-10 | Share action works; recorded as an intent event only; the limit message appears | Tests against spec section 10 | M |
| J-05 | Printing (provider decision first; check before submission) | P2 | SE | Phil, J-10, D-14 | As decided; revoked items cannot be submitted | As decided | L |
| J-06 | Gallery analytics: first-party events | P1 | SE | D-06 | Visits and downloads counted; no social-reach claims | Tests; metric definitions reviewed | M |
| J-07 | Permissions, retention and deletion for gallery media | P0 | SE | E-05 | Delete and expiry work; logged | Tests | M |
| J-08 | Approved ShareWall content into Event Gallery through explicit, recorded, revocable content grants | P0 | SE | D-02, H-06, J-01, D-14 | Only eligible ShareWall content appears; revoking a grant removes it from then on; grants and revocations are audited | Tests incl. revoked grant, withdrawn consent and deleted source | L |
| J-09 | Optional guest upload link on the Gallery and supported imports (decisions first) | P1 | SE | J-12, J-10 | Content arrives by the decided route and enters as pending | Tests | M |
| J-10 | Decide what revoking a grant or withdrawing consent does to links, downloads, shares and prints already issued; what is shown to people; and the Gallery audience model (**gated** on Phil's decision; legal advice is an input) | Gated | Strat | Phil | Decision record and design note; limits wording approved | Phil approval | S |
| J-11 | Accessibility acceptance for Event Gallery (spec 5.11 criteria for this product) | P0 | SE | A-07, J-01, J-02 | The Event Gallery criteria in spec 5.11 pass: keyboard and screen-reader operation, contrast, reduced motion, flash limit, announced status changes | Automated accessibility check in CI; keyboard and screen-reader walkthrough recorded | M |
| J-12 | Gallery ingestion, proposed routes (decision 0008, not approved): organiser upload, photographer upload through a scoped expiring revocable link, and grant-based import from Check-in Studio and ShareWall | P0 | SE | E-02, D-07, D-02, D-13 | Whatever routes Phil approves work; each item arrives as pending with provenance and a consent basis; consent, moderation status and permissions are enforced | Tests incl. expired link and wrong gallery | L |
| J-13 | Gallery curation: approve, reject, remove singly or in bulk; only approved items visible to guests | P0 | SE | J-12 | Unapproved and rejected items are never visible to guests; every decision is audited | Tests; accessibility check | M |

### K. Internationalisation

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| K-01 | Message catalogue and locale infrastructure; no hard-coded text | P0 | SE | A-02 | Lint rule or test fails on hard-coded UI strings | Seeded failure | M |
| K-02 | English (UK) complete for all MVP screens | P0 | SE | K-01 | No missing keys | Automated key check | M |
| K-03 | Locale-aware dates, times, time zones, numbers, currency | P0 | SE | K-01 | Examples render correctly in tested locales | Tests | M |
| K-04 | Account, event and guest-facing language settings; guest override | P0 | SE | C-03, K-01 | Three levels independent; override remembered | Tests | M |
| K-05 | Fonts and layout foundation for long strings and complex scripts; real scripts verified as each language is added | P1 | SE | K-01 | Pseudo-localised screens readable; CJK/Thai sample screens checked once | Screenshot review | M |
| K-06 | Customer-editable, per-language templates with fallback (launch scope open: English only, or customer-authored translations) | P1 | SE | K-04 | Missing language falls back | Tests | M |
| K-07 | Progressive localisation after launch: add languages in the order Phil sets | Post-MVP | Strat | Phil, K-01 to K-05 | Each added language complete; fonts and layout checked; key coverage 100% | Screenshot and key checks per language | L |
| K-08 | Optional AI translation of user content (original kept, translation labelled) | P2 | SE | S-09, S-10, A-02, K-04 | Original retained; labelled | Tests; privacy review | L |

### L. Offline capability (decided in principle; minimums proposed in decision 0017)

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| L-01 | Evidence pack for the per-product offline minimums in spec 5.7, from S-01 and S-02; applies the descoping rule where a minimum is infeasible | P0 | Arch | S-01, S-02 | Pack states per product what works offline, the limits, the cost and the fallback; recommendation labelled | Phil approves the per-product minimum, recorded in decision 0007 | M |
| L-02 | Client-generated IDs and idempotency keys on all write APIs (needed regardless of offline scope) | P0 | SE | D-01 | A repeated request returns the original result | Retry tests | M |
| L-03 | Shared offline plumbing, stage 1 (Check-in Studio): local queue, retry with back-off, visible sync status | P0 | SE | L-01, A-02 | Queue survives restart; retries are idempotent; sync status visible | Offline tests with network faults | L |
| L-04 | Signature Mosaic offline minimum: display and reveal from content cached before the event; pre-rendered export fallback | P0 | SE | L-01, G-03, G-07 | Reveal runs on a display with no connection using cached content; limits shown | Offline test | M |
| L-05 | Operator-facing documentation of offline limits per product: what works offline and what needs a connection | P0 | Strat | L-01 | Each of the five products has a short, accurate limits statement; no claim of parity | Review against test results | S |
| L-06 | ShareWall offline minimum: display loops cached approved content; guest uploads retry on reconnect where the browser allows; slideshow export fallback | P0 | SE | L-01, H-04 | Display keeps running with no connection; limits shown; queued uploads are not promised | Offline test | M |
| L-07 | Lucky Draw offline minimum: pre-loaded configuration, presenting results already drawn, queued check-ins. Drawing stays online | P0 | SE | L-01, I-02, L-03 | Console presents stored results offline; the draw is refused offline with a clear message; I-08 still passes | Offline test; I-08 run | M |
| L-08 | Event Gallery offline minimum: gallery shell and already-opened items cached; export fallback | P0 | SE | L-01, J-02 | Opened items are viewable offline; downloads and permission checks need a connection and say so | Offline test | S |
| L-09 | Offline pack lease and wipe: expiring packs with minimal data, wipe at next contact or expiry, revocation checked at each sync | P0 | SE | L-01, D-08, D-15 | Expired packs are wiped; a revoked device is blocked at next contact; the exposure window equals the lease length and is documented | Tests with expiry and revocation | M |

### M. Administration, security and audit

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| M-01 | Internal admin dashboard: customers, events, products, storage, bandwidth, usage, errors, support, audit | P1 | SE | D-06 | Platform admin sees listed data; access audited | Tests; SQA review | L |
| M-02 | Time-limited, audited support access grants | P0 | SE | D-06 | Grant expires; every view logged | Tests | M |
| M-03 | Pre-launch security review of auth, tokens, uploads, tenancy, revocation and offline packs | P0 | SQA | D-01, D-07, E-01, D-14, L-09 | Findings recorded and handled | Review report | L |
| M-04 | Engage a qualified UK legal/privacy adviser (**needs Phil's approval and spend**). Brief: consent and withdrawal, children's data, retention and erasure with pseudonymised records, data location and international availability, items showing several people, public-upload content duties, accessibility duties, controller/processor roles | P0 | Orch | M-14 | Adviser engaged with Phil's approval; first advice recorded; each question answered or listed as open | Written advice; Phil decides | L |
| M-05 | Incident response plan with named owner | P0 | SQA | none | Plan exists, owner named, practised once | Table-top exercise record | M |
| M-06 | Observability: logs, errors, queue health, upload and sync failures | P1 | SE | A-02 | Failures visible without personal data in logs | Log inspection | M |
| M-07 | Per-event cost and usage metrics | P1 | SE | M-06 | Storage, bandwidth, processing recorded per event | Compare with provider bills | M |
| M-08 | Data map and privacy requirements baseline, draft (output of S-10): what is collected, why, where it goes, how long it stays. Preparation is authorised; the adviser reviews it before real data | P0 | Strat | none | Map covers every product and shared record | Phil reviews; adviser review recorded at O-09 | M |
| M-09 | Design-stage threat model and abuse cases, before the data model and permissions are built | P0 | SQA | A-01 | Threat model covers tenancy, tokens, uploads, revocation, offline packs and public endpoints; findings feed D-01 and D-07 | Review report | M |
| M-10 | Data-subject request handling: access, export, erasure and withdrawal runbook and tooling (wording confirmed with the adviser before real data) | P0 | SE | D-15, D-14 | A request is completed end to end on synthetic data; the runbook is exercised once | Exercise record; SQA review | M |
| M-11 | Availability and recovery objectives for live events (**gated**: Phil decides with the cost in view) | Gated | Arch | S-11, A-01 | Objectives recorded and reflected in hosting and backup choices | Phil approval | S |
| M-12 | Customer-facing legal and trust documents drafted with the adviser: privacy notices, organiser terms, controller/processor agreement, sub-processor list, cookie and analytics notice, acceptable-use policy for uploads, photographer licence terms | P0 | Orch | M-04 | Drafts reviewed by the adviser; Phil approves; needed before real guest data | Written advice; Phil decision | L |
| M-13 | External security test and authentication policy (multi-factor): who tests, when and what scope (**gated**: Phil decides; spend needs approval) | Gated | SQA | M-03, C-02 | Decision recorded before real guest data | Phil approval | S |
| M-14 | Adviser shortlist, brief and question list (preparation only: no hiring, no spend, no contact) | P0 | Orch | none | Shortlist with selection criteria, the brief topics from M-04 and a question list; no adviser contacted | Phil reviews | S |

### N. Commercial foundations (post-MVP; off the MVP critical path)

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| N-01 | Payment provider decision | Post-MVP | Arch | Phil | Decision record with trade-offs | Phil approval | M |
| N-02 | Plans, entitlements and pricing tiers; Check-in Studio's permanent free entry point stays available | Post-MVP | SE | N-05, N-01, D-11 | Entitlements enforced server-side; Check-in Studio free entry point always available | Tests | L |
| N-03 | Checkout in GBP, invoices and receipts | Post-MVP | SE | N-01 | Test payment in provider sandbox produces invoice and receipt | Sandbox run (no live transactions) | L |
| N-04 | Usage limits and free-tier expiry warnings | Post-MVP | SE | N-02 | Warnings sent; limits enforced | Tests | M |
| N-05 | Pricing evidence: interviews, competitor pricing, cost model, pilot design (research only; does not block the MVP) | P2 | Res | none | Dated, sourced notes; hypotheses stay labelled | Reviewed by Strat and Phil | L |
| N-06 | Per-event pricing and product bundles | Post-MVP | Strat | N-05, N-02 | Pricing options defined from evidence; Phil approves | Phil approval; tests when built | M |
| N-07 | Agency plans and subscriptions | Post-MVP | Strat | N-05, N-02 | Plan design from evidence; Phil approves | Phil approval; tests when built | L |
| N-08 | Guest-count tiers and storage limits | Post-MVP | SE | N-02, D-11, M-07 | Limits enforced from measured usage | Tests | M |
| N-09 | Premium features and paid feature restrictions (Check-in Studio free entry point preserved) | Post-MVP | SE | N-02 | Restrictions enforced server-side; free entry point never removed | Tests | L |
| N-10 | Revenue reporting in the admin dashboard | Post-MVP | SE | N-03, M-01 | Revenue shown from billing records | Tests against sandbox data | M |

### O. QA, beta and launch readiness

| ID | Description | Pri | Role | Depends on | Acceptance criteria | Verification | Size |
|---|---|---|---|---|---|---|---|
| O-01 | Test strategy in place; permission matrix suite | P0 | SQA | A-02, D-01 | Matrix runs in CI | CI evidence | M |
| O-02 | Conduct customer discovery and competitor research with dated sources (**contacting prospects needs Phil's approval**), producing the summary for the real-data gate | P0 | Res | O-10 | Interview notes, competitor notes and a short summary, all with sources; hypotheses stay labelled | Reviewed notes | L |
| O-03 | Event-scale load and media tests | P1 | SQA | E-02, D-10 | Results at agreed sizes recorded | Test report | L |
| O-04 | Private beta plan: organisers, success criteria, support, data handling | P0 | Strat | O-02 | Plan approved by Phil | Phil approval | M |
| O-05 | Run the private beta with real organisers and real guests, and record findings | P0 | Strat | O-04, O-09, products | Findings logged; defects triaged | Beta report | XL |
| O-06 | Launch readiness check against spec 11.1 | P0 | SQA | M-03, M-04, M-05, O-08, D-14, O-09 | Each criterion passes with evidence | Checklist with evidence | L |
| O-07 | Legal and privacy sign-off before public launch | P0 | Orch | M-04 | Qualified reviewer's advice handled; Phil decides | Written advice | M |
| O-08 | Accessibility audit with assistive technology on key flows of all five products, before the beta | P0 | SQA | A-07, F-11, G-09, H-10, I-09, J-11 | No serious barriers on the key flows; findings recorded and handled | Manual keyboard and screen-reader walkthroughs recorded | M |
| O-09 | Real-data and private-beta gate review: discovery summary, data map, the adviser's written advice, customer-facing legal documents (M-12), retention periods, production hosting (A-09) and the external security test decision (M-13), all reviewed by Phil. Real guest data and the private beta wait for it; development with synthetic data does not | P0 | Orch | O-02, M-04, M-08, M-12, A-09, M-13 | Phil records accept, accept with changes or stop; any partial waiver is recorded in the ledger | Phil decision recorded | S |
| O-10 | Discovery preparation: research plan, interview guide, prospect criteria and outreach drafts (preparation only: nothing is sent and no prospect is contacted) | P0 | Res | none | Plan, guide, criteria and drafts exist; nothing has been sent | Phil reviews | S |

## 4. MVP must-haves (P0) versus simplifications

- **Must-haves for the complete MVP:** all P0 items. They are not automatically a commitment to implement every item before the first usable release (section 1.1). They give: customer discovery and legal/privacy review started early, tenanted accounts and events, permissions, cross-product grants and consent, tokens, privacy-preserving audit, secure uploads with end-to-end revocation and erasure, accessibility in all five products, Check-in Studio core with duplicate protection, a working Signature Mosaic, ShareWall with moderation and separate permissions, a Lucky Draw that cannot silently redraw, an Event Gallery with secure links, English (UK) with internationalisation built in, some offline capability per product (scope set by L-01), the six-role workforce, security and legal review, and a private beta.
- **Candidate simplifications for first release (need Phil's approval; not decided):** one or two reveal animations; no video until S-04/S-05 say it is feasible; printing out; photo filters out; manual moderation only until S-07 and S-10 pass; Instagram out.
- **Post-MVP enhancements:** advanced agent capabilities and any extra roles; marketing motion pipeline (spec section 12); investor work (spec section 13); monetisation (epic N: pricing tiers, subscriptions, payments, checkout, paid restrictions, guest-count and storage tiers, premium features); additional languages after launch (K-07); AI translation; native apps.

## 5. Open assumptions in this backlog

- The order of products is a recommendation. The milestone lists in section 1.1 are proposals for Phil to confirm.
- Sizes are relative and untested; there is no velocity baseline (spec section 8).
- Gated items cannot be planned in detail until Phil decides.
- Offline items are P0 in direction, with small proposed minimums per product and a descoping rule (spec 5.7). Every product keeps some offline capability; the minimum for a product can shrink if S-01 shows limits, with Phil's approval. Check-in Studio is built first (L-03), the others after.
- The MVP has no billing. D-11 is a recommendation to keep the option open and is not payment work.
- Each item must be re-scoped with acceptance criteria and a verification plan when it starts (`CLAUDE.md` section 2).

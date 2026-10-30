# Phase 0 Documentation Review: Report

- **Date:** 2026-10-30
- **Instructions followed:** `docs/Reviews/phase-0-independent-review.md`
- **Branch and state reviewed:** `docs/update-master-spec`; the working tree as it stood during the review (3 modified and 15 new files, none staged or committed)
- **Documents read in full, from disk:** `CLAUDE.md`; `docs/MVP-MASTER-SPEC.md` (draft 0.3); decision records 0001 to 0012 and the index; `docs/architecture/MVP-TECHNICAL-ARCHITECTURE.md`; `docs/planning/MVP-DELIVERY-BACKLOG.md`; `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md`; `docs/task-ledger.md`
- **Changed by this review:** nothing except this file. No Git operation was run.

## 0. Reviewer limitations (read first)

1. **This review is not independent.** The brief says the reviewer did not author the documents. The reviewer here is the same Claude Code session that wrote them. I re-read every file from disk and did not reuse earlier conclusions, and I looked for defects the earlier checks missed. Shared context and shared blind spots remain. See finding F-01.
2. **No source claims were verified.** Statements about Meta, Claude Code features, UK law and browser behaviour were reviewed for how they are labelled, not for whether they are true.
3. **Only documents were reviewed.** There is no code, so "enforceable" below means "specified and testable", not "proved".
4. **Not legal advice.** Privacy and legal observations are questions for a qualified adviser.
5. **Output path.** The brief asks for `docs/reviews/phase-0-independent-review.md`. On Windows that is the same file as the brief itself (`docs/Reviews/…`, case-insensitive), so writing it would have overwritten the instructions, which are untracked and have no copy. The report is therefore saved as `phase-0-independent-review-report.md` in the same folder.

## 1. Summary

| Severity | Count |
|---|---|
| Critical | 1 (a process gate, not a content defect) |
| Major | 11 |
| Minor | 12 |
| Observation | 7 |

**Overall:** the documents are coherent, honest about what is unknown, and consistent on the headline decisions (five products, six roles, Event Gallery as a post-event product, monetisation deferred, Check-in Studio free entry point). The weaknesses are in the hard parts: consent withdrawal and revocation, erasure against append-only records, offline devices, Event Gallery intake and links, the Lucky Draw lifecycle, and several things nobody owns yet (accessibility, data-subject requests, backups).

**Recommendation: accept with changes** (section 6). Accept the set as the Phase 0 planning baseline only after F-01 is discharged and the corrections for F-02 to F-12 are made or consciously deferred by Phil. Implementation should not start before the Major items that touch the first epics are resolved.

## 2. The 15 checks

| # | Check | Result | Findings |
|---|---|---|---|
| 1 | Five products accurate and distinct | **Pass, with two blurs** | F-17, F-21, F-07 (shared renderer owned by one product) |
| 2 | Six roles represented correctly | **Pass** in `CLAUDE.md`, spec, 0003, architecture; backlog column mixes owners | F-17 |
| 3 | Spec, architecture, backlog and risks agree | **Partial** | F-07, F-14, F-15, F-19 |
| 4 | Event Gallery modelled as post-event | **Pass on definition; partial on mechanics** | F-02, F-05, F-06 |
| 5 | Check-in Studio permanent free entry point | **Pass** (recorded consistently); not testable in the MVP | O-02 |
| 6 | Monetisation and payments deferred | **Pass** | F-14 (one stray "revenue"), O-02 |
| 7 | Cross-product sharing, permissions, consent, deletion consistent | **Fail on enforceability** | F-02, F-03, F-07, F-10 |
| 8 | Offline represented without over-promising | **Mostly pass; scope elevated to must-have** | F-04, F-11, F-22 |
| 9 | Lucky Draw integrity, concurrency, rounds, audit | **Core sound; lifecycle gaps** | F-08 |
| 10 | Keyboard permissions and safeguards consistent | **Mostly pass** | F-16 |
| 11 | Security, privacy, i18n, administration covered | **Partial** | F-09, F-10, F-18, F-20 |
| 12 | Backlog implementable, prioritised, dependency-aware | **Partial** | F-05 to F-07, F-11, F-12, F-17, O-01 |
| 13 | No major assumption silently presented as approved | **Mostly pass** | F-19, F-23 |
| 14 | Ledger distinguishes planning, proposed, accepted | **Partial** | F-12, F-13 |
| 15 | `CLAUDE.md` rules followed | **Mostly pass, with exceptions** | F-01, F-13, O-04, O-05 |

## 3. Answers to the six points of particular attention

1. **Can Event Gallery safely aggregate content from several sources?** Not yet. The model is sound in principle: separate module, `ContentGrant`, eligibility checked when content is shown (architecture 13). It is unsafe in practice until F-02 (withdrawal and propagation), F-05 (no P0 intake path, undefined curation) and F-06 (dependencies) are fixed.
2. **Are consent withdrawal and revocation enforceable?** Not as written. No mechanism lets a guest withdraw consent or identifies who contributed anonymous content, and the display-time check does not reach signed URLs, derivative caches, exports, offline caches or backups (F-02, F-04).
3. **Are previously issued links and downloads addressed?** Acknowledged honestly as unresolved ("design before building", decision 0008). Not enforced: the backlog lets downloads, links and sharing be built before that design exists (F-06).
4. **Can offline sync safely coexist with audit history?** Conceptually yes (append-only events, idempotency keys, version history). Three gaps: immutable audit versus erasure (F-03), revocation of offline devices (F-04), and missing sync-time fields in the audit record (F-22).
5. **Is the architecture appropriately simple for a solo founder?** The technical shape is: one modular monolith, one database, one worker, no services to operate. The delivery scope is not simple: 120 items, 73 at P0 (70 plus 3 offline items marked "scope TBD"), 8 sized XL, 45 sized L, plus 12 spikes (O-01, F-11, F-12).
6. **Is the agent workforce achievable with Claude Code native capabilities?** Plausibly, as designed: six roles, no always-on service, capability check (B-01) and a reliability spike (S-12) first. The claims about project-folder subagents, skills and per-task cost recording are unverified (O-03). This review itself shows the limit of same-session "independent" review (F-01).

## 4. Findings

Each finding gives: file and section, problem, why it matters, recommended correction, and whether it blocks MVP implementation.

### Critical

**F-01. The independent review requirement is not met by this review.**
- **Where:** this report; spec 6.4 and 8.1; `CLAUDE.md` 4; architecture header ("not yet independently reviewed"); ledger T-003 to T-009, T-021.
- **Problem:** the project's rule is that architectural and substantial work needs independent review, and that an author cannot be the independent reviewer. The reviewer is the author's session. The eight ledger rows in "in verification" are waiting on exactly this review.
- **Why it matters:** accepting the documents on this report would break the project's own gate and would repeat the pattern the rule exists to prevent.
- **Correction:** Phil reviews this report and the documents himself, and/or the same brief is re-run in a fresh session or subagent that has not seen the authoring conversation. Keep the ledger rows at "in verification" until then. Treat this report as a defect finder, not as acceptance.
- **Blocks implementation?** It blocks acceptance, and so blocks starting implementation.

### Major

**F-02. Consent withdrawal and permission revocation are not enforceable end to end.**
- **Where:** architecture 13, 8, 10, 4 (`Consent`, `ContentGrant`); spec 4.5, 5.2, 11.1; backlog D-04, J-01, J-08; R-13.
- **Problem:** (a) nothing lets a guest withdraw consent or ask for a takedown; (b) contributors who use a public QR code or link are anonymous, so a withdrawal cannot be tied to their content; (c) "removes the item from the Gallery from then on" only describes the page, while signed URLs stay valid until expiry and derivatives, caches, zip downloads, prints and shares are untouched; (d) a photo can show several people and no policy says whose consent governs; (e) it is not said whether an organiser, a guest or both can revoke a grant.
- **Why it matters:** the central privacy promise of the Gallery and ShareWall depends on this, and the tests in J-08 and R-13 would pass on a page that still leaks files.
- **Correction:** add a revocation and erasure propagation section to the architecture. For each artefact (original, derivative, signed URL, cache, export, print order, share, offline cache, backup, analytics record) state what happens on revocation and the maximum exposure window. Set a maximum signed-URL lifetime. Give contributors a receipt or manage token. State a multi-person policy after legal advice. Add backlog items for guest-facing withdrawal, a propagation job and end-to-end tests.
- **Blocks implementation?** Yes for D-04, F-06, H-06 and epic J.

**F-03. Append-only records conflict with retention and erasure.**
- **Where:** architecture 4 (`CheckIn`, `AuditLog` append-only) and 14 ("original is never erased", append-only `DrawSelection`); spec 11.1 ("retention and deletion enforced and tested"); backlog D-06, F-05, I-02, I-05, E-05.
- **Problem:** audit, check-in and draw evidence are immutable and keep who, what and when. The launch criteria require deletion to be enforced. Nothing says how personal data inside immutable records is deleted or how long evidence is kept.
- **Why it matters:** the data model chosen for D-06, F-05 and I-02 will either satisfy deletion or not, and retrofitting it is costly.
- **Correction:** record a decision before the data model is built: keep append-only structure but hold personal data by reference to a record that can be erased or pseudonymised, set retention periods for audit and draw evidence, and take legal advice. State the rule in spec 11.1.
- **Blocks implementation?** Yes for the data model (D-06, F-05, I-02).

**F-04. Offline devices cache personal data and cannot be revoked while offline.**
- **Where:** architecture 9 and 3; spec 5.7 and 11.1 ("access revocation takes effect, including for device sessions"); backlog D-08 ("revoked device loses access on next request"), L-03, F-10; decision 0007.
- **Problem:** offline check-in needs guest data on the device. No document covers what is cached, for how long, on shared or lost devices, or how it is wiped. A device that is offline cannot learn it was revoked, so the 11.1 criterion and D-08 cannot hold for it.
- **Why it matters:** this puts personal data on devices outside our control and makes a stated launch criterion false for offline use.
- **Correction:** define a local-data policy: cache only what a station needs, time-limited offline leases, wipe at next contact, honest limits of browser storage protection. Amend 11.1 and D-08 to state the maximum exposure window for offline devices and have Phil accept it.
- **Blocks implementation?** Partly: blocks F-10, L-03, L-04 and the D-08 design; not the rest.

**F-05. Event Gallery has no P0 route for content to arrive, and curation is undefined.**
- **Where:** spec 4.5; decision 0008 ("Not decided" item 1); backlog J-01, J-09 (P1), J-10 (gated); ledger T-016.
- **Problem:** the Gallery's sources include organiser uploads and photographer uploads, and Event Gallery can be bought on its own (spec 1.1, 0002). No P0 item gives those sources a way in: J-01 lists them as sources, J-09 is P1 and waits on J-10. Eligibility also requires "approved moderation status", but only ShareWall has a moderation workflow. Nothing says who approves organiser or photographer content. The audience model (who can see which photos) is not defined.
- **Why it matters:** a Gallery customer who has not used ShareWall could not get content in, and the eligibility rule cannot be satisfied for non-ShareWall content.
- **Correction:** resolve J-10 before epic J is planned. At minimum add a P0 organiser upload route and define approval and audience rules for non-ShareWall content.
- **Blocks implementation?** Yes for epic J.

**F-06. The backlog does not enforce "design before building" for issued links and downloads.**
- **Where:** decision 0008 ("Design this before building"); architecture 13; backlog J-02 (downloads), J-03 (links), J-04 (sharing), J-05 (printing), J-10.
- **Problem:** only J-09 depends on J-10. J-02 to J-05 can start before anyone has decided what revoking a grant does to links, downloads, shares and prints.
- **Why it matters:** these items create exactly the artefacts that cannot be recalled.
- **Correction:** make J-02 to J-05 depend on J-10 and on F-02's propagation design.
- **Blocks implementation?** Yes for J-02 to J-05.

**F-07. Cross-product grants and consent are sequenced inconsistently.**
- **Where:** backlog section 1 (D-02 appears under phase 1 through epic D and again as "integration" in phase 3), G-02, I-01, H-04, H-09, G-01.
- **Problem:** spec 5.2 says a product reads another product's data only through a grant. G-02 (Signature Mosaic reads Check-in signatures) and I-01 (Lucky Draw reads Check-in and, optionally, contributions) depend on F-05, F-06 or D-03 but not on D-02 or D-04. The shared rendering library G-01 sits in the Signature Mosaic epic while ShareWall (H-04, H-09) depends on it.
- **Why it matters:** the first cross-product reads would be built without the permission layer, and ShareWall would depend on another product's epic.
- **Correction:** make D-02 and D-04 unambiguous phase 1 work; add them as dependencies of G-02, I-01 and any item reading another product; move the rendering library to a shared epic.
- **Blocks implementation?** Yes for sequencing phase 2.

**F-08. Lucky Draw lifecycle has gaps despite a sound core.**
- **Where:** architecture 14; spec 4.4; backlog I-02, I-04, I-05; S-06.
- **Problem:** (a) the state machine lists `reset` but not what may follow it; a new draw after a reset behaves like a re-draw and the two rules overlap; (b) the pool is frozen when a round opens, but late check-ins or delayed offline syncs can arrive afterwards, so eligibility ("must have checked in") has no cut-off rule; (c) "next round" and "previous round" are single keypresses that need an expected-state precondition, otherwise two presses move two rounds; (d) S-06 asks for a reproducible-to-audit draw but a secure random source is not reproducible unless the seed and algorithm are recorded; (e) which roles may run a draw or re-draw is not stated; (f) evidence exports hold personal data and fall under F-03.
- **Why it matters:** fairness and the "no silent redraw" guarantee are the product's core claim.
- **Correction:** define the full state transitions with who may trigger each, a cut-off and late-arrival rule, command preconditions for navigation, and an evidence format that lets an auditor verify the result. Add these as acceptance criteria to I-02 to I-05.
- **Blocks implementation?** Yes for epic I.

**F-09. Accessibility is not covered anywhere.**
- **Where:** all documents (the only hits for the word are "inaccessible" and "not accessible"). Missing from spec 11.1 and from the backlog.
- **Problem:** guest-facing pages, operator consoles and large displays have no accessibility requirement, target or test.
- **Why it matters:** retrofitting accessibility is expensive, and public-facing services in the UK may have legal duties (a question for an adviser).
- **Correction:** Phil chooses an accessibility target after advice; add a launch criterion to spec 11.1, a design-system item to the backlog and accessibility checks to the test strategy.
- **Blocks implementation?** Partly: affects the front-end foundation (A-02, K-01).

**F-10. Data-subject requests, backup and restore, and disaster recovery have no owner.**
- **Where:** absent from spec, architecture and backlog; E-05 and C-06 cover retention and deletion only.
- **Problem:** no item handles subject-access, export or erasure requests, how deletion reaches backups, how data is restored after a failure, or what availability is promised at a live event.
- **Why it matters:** these are launch concerns that shape storage and database design, and an event platform holds data that cannot be recreated.
- **Correction:** add backlog items and a spec 11.1 criterion; record a restore objective and have the legal review (M-04) cover requests handling.
- **Blocks implementation?** Partly: affects the data and storage design.

**F-11. Offline is elevated to a must-have with unbounded cost.**
- **Where:** backlog F-10, L-03, L-04 ("P0 (scope TBD)", all XL) and section 4 ("some offline capability per product" is a must-have); decision 0007; spec phase 2 exit.
- **Problem:** decision 0007 says "should have … subject to feasibility". The backlog turns this into P0 exit criteria for every product before any feasibility result exists, and there is no rule for what happens if a product has no feasible offline mode.
- **Why it matters:** three XL items of unknown size can stall the MVP or force a late quality compromise.
- **Correction:** state the fallback in advance (for example "minimum acceptable offline per product, approved by Phil after L-01") and stage the work: Check-in Studio first, others after the spike results. Keep it P0 in direction, with a defined descoping rule.
- **Blocks implementation?** Partly: blocks planning of F-10, L-03, L-04.

**F-12. Discovery and legal work cannot start per the ledger, and no gate precedes building.**
- **Where:** ledger T-020 ("depends on T-011 onward"); backlog O-02, M-04 (no dependencies, phase 0); spec 1 and 14.
- **Problem:** the spec admits there is no customer or market evidence. The backlog correctly puts customer discovery (O-02) and legal engagement (M-04) in phase 0, but the ledger bundles them into T-020, which waits for the foundations. No gate stops building all five products before any evidence exists.
- **Why it matters:** the ledger is the control document; as written the research can wait indefinitely, and phase 0 can end without it.
- **Correction:** give O-02, M-04 and M-05 their own phase 0 ledger tasks with no dependency on T-011, and add them to the phase 0 exit condition.
- **Blocks implementation?** Yes for the phase 0 exit.

### Minor

**F-13. The ledger's evidence is stale and not reproducible; its schema departs from `CLAUDE.md`.**
- **Where:** ledger T-007 (says 120 items, evidence says 111 rows), T-008 (says R-01 to R-12; there are R-01 to R-17), T-006, T-021 ("see report"), the second table; `CLAUDE.md` 2 and 4.
- **Problem:** evidence describes earlier versions. The checks ran from scripts kept outside the repository, and "see report" points to a chat. The second table lacks the blocker and decision-reference columns that `CLAUDE.md` 2 requires. Owner roles imply role separation that did not happen (one session did the work).
- **Correction:** refresh evidence against the current files, store the validation script in the repository (spec 16 item 11), unify the schema, and note when one session worked in several roles.
- **Blocks implementation?** No.

**F-14. Admin dashboard descriptions disagree.**
- **Where:** architecture 18 lists "revenue"; spec 5.10 and backlog M-01 removed it (no billing); spec 5.10 says the dashboard covers agent activity but the backlog makes it P2 (B-08).
- **Correction:** remove "revenue" from the architecture; align the priority of agent activity with the spec.
- **Blocks implementation?** No.

**F-15. Spec section 16 has duplicates.**
- **Where:** spec 16 items 9 and 15 (remote support), and item 4 (free-tier expiry is post-MVP).
- **Correction:** merge duplicates and renumber; check whether the ledger refers to numbered items.
- **Blocks implementation?** No.

**F-16. Keyboard defaults are not consistent, and there is no presenter role.**
- **Where:** spec 5.5 table; decision 0004; architecture 12.
- **Problem:** `R` means "trigger reveal" in Signature Mosaic and "reset current round" in Lucky Draw, and `Esc` differs, although conventions are meant to be consistent and several products can run at one event. Control is limited to owners and collaborators, so venue staff who run a draw must become collaborators with wide access.
- **Correction:** keep consequential actions off bare single keys or use a distinct modifier; define a scoped operator role or control-only session.
- **Blocks implementation?** No (defaults are proposals).

**F-17. The backlog "Role" column mixes owners.**
- **Where:** D-01 and others ("Arch/SE"), E-06 ("SQA/SE"), M-04 and O-07 ("Orch (Phil)").
- **Problem:** two owners on one item breaks the one-owner rule, and an SQA/SE item risks the reviewer authoring what it reviews. "Orch (Phil)" is a person, not a role.
- **Correction:** one role per item; split authoring and review; show Phil separately as the decision owner.
- **Blocks implementation?** No.

**F-18. Abuse and illegal-content handling for public uploads is not specified.**
- **Where:** spec 4.3 and 11; backlog H-01, H-06.
- **Problem:** public QR codes and links accept photos and video. Only usage caps and takedown rules (undecided) appear. There is no reporting channel or response process.
- **Correction:** add the question to the legal review brief (M-04), and define a reporting and removal route before ShareWall launch.
- **Blocks implementation?** No, but it gates ShareWall launch.

**F-19. Some architecture labels read stronger than their sources.**
- **Where:** architecture 23 ("signed direct uploads: Confirmed"; spec 5.3 says "where appropriate"); architecture 2 states a relational database and S3-compatible storage inside a proposal while 23 lists the database as unresolved; 5 and 14 assume transactional locks and row-level security.
- **Correction:** relabel as Proposed or add the assumption explicitly to the stack decision A-01.
- **Blocks implementation?** No.

**F-20. Security work is scheduled late, and some hardening has no item.**
- **Where:** backlog M-03 (depends on D-01, D-07, E-01, i.e. after they exist); architecture 10 (tokens "stored hashed", rate limiting).
- **Problem:** the threat model reviews built work instead of shaping the design. Hashed tokens cannot be shown again, yet organisers need to re-download QR codes and links. Rate limiting and abuse controls are mentioned but not planned.
- **Correction:** run a design-stage threat model with A-01; decide token storage and re-display; add rate limiting and abuse controls to the backlog.
- **Blocks implementation?** No, but do it before D-07.

**F-21. ShareWall and Signature Mosaic overlap on signatures.**
- **Where:** spec 4.3 (ShareWall accepts signatures) and 4.2 (sources "other configured event sources").
- **Problem:** the boundary rule is photo and video grids versus signature designs, but ShareWall also takes signatures. It is unclear whether ShareWall signatures may feed Signature Mosaic.
- **Correction:** state the rule and whether it needs a grant.
- **Blocks implementation?** No.

**F-22. The audit record lacks fields for offline sync.**
- **Where:** architecture 4 (`AuditLog`, `CheckIn`) and 9.
- **Problem:** "latest" depends on server receive order and the device's claimed time, but the entities do not record both, nor the sync batch.
- **Correction:** add `received_at`, `claimed_at` and a batch reference, and state that audit timestamps are server-assigned.
- **Blocks implementation?** No.

**F-23. An interim default for a destructive action was adopted without a decision.**
- **Where:** decision 0011 and spec 5.4 ("until Phil says otherwise it is a shared event operation").
- **Problem:** this was disclosed, but the default lets any collaborator delete an event, which is the less safe choice.
- **Correction:** default to owner-only or to soft deletion with a grace period until Phil decides.
- **Blocks implementation?** No.

**F-24. Housekeeping: paths, case and line endings.**
- **Where:** the review brief lives in `docs/Reviews/` (capital R) but is referenced as `docs/prompts/…` and its output as `docs/reviews/…`; Git warns that LF will be converted to CRLF.
- **Problem:** the output path collides with the brief on Windows and would be a different folder on Linux or GitHub. There is no line-ending policy.
- **Correction:** pick one folder name (lower case), put briefs in `docs/prompts/`, and add a `.gitattributes` decision.
- **Blocks implementation?** No.

### Observations

**O-01. Delivery scope is heavy for one person.** The architecture is simple; the backlog is not: 120 items, 8 XL and 45 L, five products, offline, a workforce and 12 spikes. All five products stay in scope by decision, so the lever is sequencing. Consider an explicit vertical slice and go/no-go gates inside the phases.

**O-02. The permanent free entry point is not testable in the MVP.** Everything is free in the MVP, so the principle has no acceptance test until post-MVP items N-02 and N-09. What it includes is undefined (spec 16 item 12), and it carries an unmeasured cost (R-06). Add a short definition and a cost guard when pricing is planned.

**O-03. The agent workforce is plausible but unverified.** Architecture 17 relies on project-folder subagents, skills and per-task cost recording. B-01 and S-12 are the right first steps and are correctly marked "verify". Keep role definitions and cost recording behind them, and define the fresh-context review procedure (B-04) before relying on it.

**O-04. `CLAUDE.md` is slightly stale.** Its state line is dated 2026-10-29, and an agent reading only that file would not learn that billing is out of MVP scope or that Event Gallery content moves only through grants. A line pointing to spec sections 5.2 and 9 would help.

**O-05. Three tasks of work are uncommitted.** `CLAUDE.md` 5 asks for verified checkpoints. Eighteen files across three tasks sit in the working tree. Commit after review, with Phil's approval, so the work is recoverable.

**O-06. "International availability" is agreed direction with legal weight.** Spec 1.1 states it without recording implications beyond S-10's mention of transfers. Add it to the legal review brief.

**O-07. A Gallery audience model is worth deciding early.** Whether guests see all photos, only their own, or only what a link allows changes the permission model and the privacy risk (relates to F-05).

## 5. What is solid

- The five products are consistent and distinct across every document, and decision 0002 states the ShareWall and Signature Mosaic boundary clearly.
- Status labels (confirmed, proposed, unresolved) are used honestly, and open questions are listed in one place with owners.
- Monetisation is deferred cleanly: no payment code in the MVP, post-MVP items kept, and a design seam recommended.
- The Lucky Draw core design (frozen pool, atomic transition, idempotency, append-only selections, re-draw as a new record) is sound.
- Offline wording avoids promising parity and separates capture, queueing and live-only functions.
- Decisions that replace earlier positions say so (0007 supersedes the earlier no-offline position).
- The conflict register makes the effect of each founder decision traceable.
- `CLAUDE.md` rules on approvals, Git safety and verification are followed; nothing has been committed or pushed without approval.

## 6. Overall recommendation: **Accept with changes**

- **Before accepting:** discharge F-01 (Phil's review and/or a fresh-context re-run), fix the ledger evidence (F-13), and correct the architecture and spec inconsistencies (F-14, F-15, F-19).
- **Before implementation starts:** decide or document F-02, F-03, F-04, F-05, F-06, F-08, F-11 and F-12; fix the sequencing in F-07; assign owners for F-09 and F-10.
- **During implementation:** F-16 to F-18, F-20 to F-24 and the observations.

No finding says the plan is wrong in direction. The problems are gaps between stated requirements, so they are cheaper to fix now than after the data model exists.

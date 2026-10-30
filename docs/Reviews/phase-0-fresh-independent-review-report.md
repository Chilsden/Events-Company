# Phase 0 Fresh Independent Review: Report

- **Date:** 2026-10-30
- **Instructions followed:** `docs/prompts/phase-0-fresh-independent-review.md`
- **Branch and state:** `docs/update-master-spec` at `cee73a3`; 3 modified and 25 untracked files before this report (26 with it); nothing staged (details in section 11)
- **Changed by this review:** nothing except this file. No existing document was edited and no Git operation was run.

## 0. Reviewer status and limits (read first)

1. **This is not a fresh-session review, and it does not discharge finding F-01.** The reviewer is the same Claude Code session that wrote the Phase 0 documents, the first review report and the author's response. The brief says "do not mark your own work as independently reviewed", so I do not. What this report offers is a deliberate second pass: I re-read every document from disk, wrote new checks instead of reusing the authoring checks, and tested the author's resolution claims one by one. I found defects the authoring checks missed (section 3), which shows the value of the pass. It also shows the limit: a session that shares the authors' context is likely to share some blind spots. Ledger T-026 stays open until a session with no memory of authoring, or Phil, does the review.
2. **Nothing was verified outside the documents.** I did not check Meta, WCAG text, UK law, browser behaviour or Claude Code capabilities. Where the documents rely on them I only checked how they are labelled.
3. **Not legal advice.** Legal and privacy points below are questions for a qualified adviser. Nothing here says compliance has been or can be established.
4. **There is no code.** "Implementable" means specified, testable and correctly ordered, not proved.
5. **Unresolved proposals are not treated as approved.** Where the documents label something Proposed or open, it stays so here. Where they label something "decided" without a matching instruction from Phil, I say so (N-01).

**What I inspected:** `CLAUDE.md`; `docs/MVP-MASTER-SPEC.md` (draft 0.4, 756 lines); all 18 decision records and the index; `docs/architecture/MVP-TECHNICAL-ARCHITECTURE.md` (draft 0.2, 461 lines); `docs/planning/MVP-DELIVERY-BACKLOG.md` (draft 0.2, 149 items); `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md` (draft 0.2); `docs/task-ledger.md`; the first review report and `docs/Reviews/phase-0-review-response.md`; the working tree and Git state.

## 1. Executive summary

The documents are coherent on the headline decisions and unusually honest about what is unknown. The five products are distinct, the six roles are used consistently, monetisation is correctly out of the MVP, Check-in Studio's free entry point is recorded everywhere it should be, and most of the first review's defects were genuinely fixed: I verified 11 findings as resolved and found the author's claim wrong or incomplete for three more (F-19, F-20, F-12/F-05 labelling).

The remaining problems are of three kinds.

- **Labelling.** Some mechanisms the author designed are recorded as founder decisions (the Gallery ingestion routes, the hard gate before building). This is the only kind of problem that blocks accepting the documents as a baseline (section 4).
- **Plan structure.** The backlog has a circular dependency between the stack decision and the spikes that feed it, leaves the guest model free to be built before the privacy-preserving identity split, and puts 115 of 149 items behind one gate that depends on an external legal adviser's reply. A hard gate that blocks even scaffolding with synthetic data is stricter than the stated risk needs (section 5).
- **Things nobody owns yet** that matter before real guest data: customer-facing legal documents, an external security test, and a definition of who "the owner" is (sections 5 and 6).

**Recommendation: accept with changes.** Accept the documents as the Phase 0 planning baseline once the labelling problems in section 4 are corrected and Phil, or a truly fresh session, reviews them. Do not start implementation epics until the items in section 5 for that epic are fixed. Do not handle real guest data or run a private beta until section 6 is done.

## 2. Findings from the first review: current status

Classification: **Resolved** (corrected and I verified it); **Partially resolved**; **Unresolved**; plus the dependency tags **Founder decision**, **Technical validation**, **Legal advice**. "Verified" means I checked the underlying documents or computed the result, not the author's response.

| ID | Status | Independent assessment |
|---|---|---|
| F-01 Independent review | **Unresolved** | Cannot be discharged by this session (section 0). Ledger T-026 correctly stays `proposed` |
| F-02 Consent withdrawal and revocation | **Partially resolved**; Technical validation (S-13), Legal advice, Founder decision | Design exists (spec 11.2, architecture 24, decision 0013). Windows are unmeasured (every value "open"). Guest self-service assumes the platform may act on a guest's request without the organiser; the controller/processor model is open (N-05) |
| F-03 Append-only versus erasure | **Partially resolved**; Legal advice, Founder decision | Principle recorded and a reference model designed (architecture 25). Retention periods are all "open". New gap: D-03 (guest model) does not depend on D-15 (N-02) |
| F-04 Offline device exposure | **Partially resolved**; Technical validation (S-01), Founder decision | Lease and wipe designed. Covers authorised station devices; guest phones (queued uploads, cached Gallery) are outside it (N-10) |
| F-05 Gallery ingestion | **Partially resolved**; Founder decision, Legal advice | Three ingestion routes and curation exist in the documents and backlog (J-12, J-13). They are labelled "decided" but Phil's instruction only required that a P0 path exist (N-01). Consent basis for organiser and photographer uploads needs advice |
| F-06 Gallery downloads before design | **Resolved** | Verified: J-02, J-03, J-04 and J-05 all list J-10 and D-14 as dependencies. The J-10 decision itself is a Founder decision and Legal advice item |
| F-07 Cross-product sequencing | **Resolved** | Verified: G-02, I-01, J-01 depend on D-02 and D-04; J-08 depends on D-02; D-12 is a platform item; no dependency cycle. (A different sequencing gap is new: N-02) |
| F-08 Lucky Draw lifecycle | **Partially resolved**; Founder decision (rules), Technical validation (S-06) | State machine, commands and late-arrival rule are defined and consistent across spec 4.4, architecture 14, decision 0015 and I-02 to I-10. Minor gaps remain (N-08) |
| F-09 Accessibility | **Partially resolved**; Founder decision (target), Legal advice | Requirement, nine testable criteria, per-product tables and backlog items (A-07, F-11 to J-11, O-08) exist. Target level is Proposed |
| F-10 Data requests, backups, recovery | **Partially resolved**; Founder decision, Technical validation | M-10, E-07, M-11 exist. Objectives and backup retention open. Restore re-applying the erasure ledger is untested by nature |
| F-11 Offline elevated to must-have | **Resolved** in the documents; Technical validation | Minimums, fallbacks and a descoping rule exist; items are smaller and staged. Whether the minimums are feasible is unknown until S-01 and S-02 |
| F-12 Discovery and legal first | **Partially resolved**; Founder decision | Verified: O-02, M-04, M-08 have no dependencies and ledger T-023, T-024 exist. But the gate makes 115 of 149 items wait, the legal adviser sits on the critical path to the stack decision, and the gate mechanism is labelled as Phil's decision (N-01, N-03) |
| F-13 Ledger evidence and schema | **Partially resolved**; Founder decision | Verified: schema unified; counts now match (149 items, 13 spikes, 24 risks, 18 records, 22 open items). Evidence still not reproducible from the repository (N-07) |
| F-14 Admin revenue and agent activity | **Resolved** | Verified in architecture 18, spec 5.10, backlog B-08 |
| F-15 Spec section 16 duplicates | **Resolved** | Verified: 22 numbered items, no duplicates |
| F-16 Keyboard conventions, presenter role | **Resolved** as proposals; Founder decision | Verified: `R` means reveal only; consequential actions use `Shift` plus a key; operator sessions marked Proposed |
| F-17 Combined owners | **Resolved** | Verified: every item has one role. (Side effect: 114 of 149 items belong to one role; O-05) |
| F-18 Public-upload abuse | **Partially resolved**; Legal advice | H-11 and D-16 exist, H-11 is gated on advice |
| F-19 Architecture labels | **Partially resolved** | The author says resolved; it is not. Architecture 8 still says signed uploads are "**Confirmed** as a platform requirement" while architecture 23 says "Proposed" (N-07) |
| F-20 Threat model, tokens, rate limits | **Partially resolved** | M-09, D-16 and derived tokens exist. But M-09 is not a dependency of D-01 or D-07, the items it is meant to inform (N-02) |
| F-21 Signature overlap | **Resolved** | Verified in spec 4.2 |
| F-22 Audit fields for sync | **Resolved** | Verified in architecture 4 and 9 |
| F-23 Event deletion default | **Resolved** by Phil's instruction | Verified in decision 0011, spec 5.4, C-06. New ambiguity about what "owner" means (N-04) |
| F-24 Housekeeping | **Partially resolved**; Founder decision | Folder name and line-ending policy remain open (spec 16 item 11) |
| O-01 Solo-founder scope | **Unresolved** | P0 items rose from 73 to 100 with no capacity check (N-06) |
| O-02 Free entry point untestable in MVP | **Unresolved** (accepted as a known limit) | No change |
| O-03 Agent workforce unverified | **Requires technical validation** | B-01 and S-12 are the right first steps |
| O-04 `CLAUDE.md` currency | **Unresolved** | `CLAUDE.md` still dated 2026-10-29 and silent on the MVP exclusions and the gate. Phil's call |
| O-05 Uncommitted work | **Unresolved** | Still a single working tree (section 11) |
| O-06 International availability | **Resolved** in the brief | M-04 brief includes it. **Legal advice** |
| O-07 Gallery audience model | **Requires founder decision** | Proposed default recorded; open |

## 3. New findings

Severity follows the brief. Category: **A** blocks documentation acceptance; **B** blocks a named implementation epic; **C** blocks real customer data or the private beta.

### Major

**N-01. Mechanisms the author designed are recorded as founder decisions.** (A)
- **Where:** spec 4.5 ("P0 ingestion paths (decided 2026-10-30…)"), spec 3; decision 0008 ("Ingestion (decided…)", yet "Proposed details (not yet decided)" follows); decision 0018 (status `accepted`: hard gate before building, A-02 waits, written waiver); response doc rows for F-05 and F-12 ("Decided by instruction").
- **Problem:** Phil's instruction was that Event Gallery needs a P0 ingestion path enforcing consent, moderation and permissions, and that discovery and legal review come first. The three specific routes (organiser upload, scoped photographer link, grant import), the `pending` default, the hard O-09 gate, A-02 waiting for it and the waiver process were designed by the author. Architecture 23 even says "intake design Unresolved", contradicting the spec.
- **Why it matters:** an agent or reader will treat them as approved. The brief forbids presenting proposals as approvals.
- **Correction:** keep as decided only what Phil said. Relabel the routes, the curation defaults and the gate mechanism as Proposed in spec 3, spec 4.5, decisions 0008 and 0018, the response doc and architecture 23. Phil confirms or changes them.
- **Blocks:** documentation acceptance.

**N-02. The backlog has a circular dependency and several sequencing gaps.** (B)
- **Where:** backlog A-01, D-01, D-03, D-10, E-04, E-05, H-05, L-03, M-09; risk register S-03, S-13.
- **Problem (all computed from the tables):**
  1. A-01 (stack decision) depends on S-03 and S-13, and those spikes list "Candidate stacks/hosting options (A-01)" as their own dependency. A shortlist must exist before the spikes and the decision after them; the documents have one item for both.
  2. D-03 (guest model) depends only on C-03. Architecture 25 requires names and contact details to live in a separate erasable identity record (D-15). Nothing stops the guest model being built with personal data in the guest row.
  3. D-01 (permission model, XL) depends only on C-01. The design-stage threat model M-09 says its findings "feed D-01 and D-07", but neither depends on it.
  4. D-10, E-04, E-05, H-05 and L-03 are implementation items with no dependency on the repository scaffold (A-02), so the graph does not stop them starting before it exists.
- **Why it matters:** the privacy design can be silently bypassed by an agent following the backlog literally, and the plan cannot be executed in the stated order.
- **Correction:** split A-01 into a shortlist step (before the spikes) and a decision (after). Add D-15 as a dependency of D-03, M-09 as a dependency of D-01 and D-07, and A-02 as a dependency of D-10, E-04, E-05, H-05 and L-03.
- **Blocks:** epics A, C, D, E and L (not the discovery work).

**N-03. The gate and the legal adviser make almost everything wait, which is stricter than the risk needs.** (A for the label, B for the planning)
- **Where:** backlog O-09, A-01, A-02, D-04, E-05, M-04 and the critical path; decision 0018.
- **Problem:** I computed the dependency graph: 115 of 149 items transitively depend on O-09, whose inputs include the legal adviser's first advice (M-04). M-04 is also a direct dependency of A-01, D-04, E-05, H-06, H-11, J-10, M-10, O-06, O-07 and O-09. The longest chain is 13 steps and begins with M-04. The reasons for the gate are sound for real guest data. They do not require that scaffolding, synthetic-data development, the consent mechanism or retention jobs wait for the advice: consent wording and retention periods can be configuration while the mechanism is built.
- **Why it matters:** the reply time of an outside professional becomes the schedule of the whole project, and the brief asks not to treat every unresolved question as an implementation blocker.
- **Correction (recommended default, not approved):** keep discovery and legal engagement first and start them immediately, but gate only (a) real guest data, (b) the private beta and (c) the features whose behaviour depends on advice (H-06, H-11, J-10). Let A-01 (stack, split from hosting region), A-02 and synthetic-data development proceed after Phil's own decision. D-04 and E-05 depend on advice only for their configured content, not their mechanism.
- **Blocks:** nothing by itself; it is a decision Phil needs to make now (section 7).

**N-04. "Owner" is ambiguous in the permission model.** (B)
- **Where:** spec 5.4 ("An event owner and invited collaborators"; "account ownership … permanent event deletion owner-only"), architecture 6 ("account owner"), decision 0011, backlog C-01, C-06, C-08, D-01.
- **Problem:** the documents use "event owner" and "account owner" as if they were one role. An agency account may hold many events with different collaborators. Nothing says whether collaborators are per account or per event, or who counts as "the owner" for permanent deletion of one event. Owner recovery is open.
- **Why it matters:** this is the core of D-01 (XL) and the owner-only tests.
- **Correction:** define account-level and event-level roles and which owner-only actions belong to which, before C-01 and D-01 start.
- **Blocks:** epics C and D.

**N-05. Customer-facing legal and trust documents are not planned, and a design assumption needs legal advice.** (C)
- **Where:** absent from all documents (my searches for "privacy notice", "terms of service", "cookie", "data processing agreement" and "penetration" returned no matches; "sub-processor" appears once, in a list); spec 11.2; backlog D-04, D-13, M-04.
- **Problem:** nothing in the backlog produces the documents that real organisers and guests would need: privacy notices, organiser terms, an agreement describing controller and processor roles, a sub-processor list, cookie and analytics notices, an acceptable-use policy for uploads, and licence terms for photographers' work in downloads and prints. M-04 lists topics, not deliverables. The guest self-service withdrawal (D-04, D-13) assumes the platform may act on a guest's request directly, which depends on the unresolved controller/processor model.
- **Why it matters:** real guest data cannot lawfully or sensibly be handled without them, and the withdrawal design may need to route through the organiser.
- **Correction:** add a backlog item whose output is these documents (drafted with the adviser), and list the controller/processor question as input to D-04 and D-13 design.
- **Blocks:** real customer data and the private beta; not epic work with synthetic data.

**N-06. The P0 scope grew without a capacity check, and no walking skeleton is defined.** (B)
- **Where:** backlog sections 3 and 4; spec 14.
- **Problem:** computed: 149 items, 100 at P0 (it was 73), 6 XL, 50 L, 79 M. The longest dependency chain has 13 items and a single role (SE) owns 114 items. All five products stay in the MVP by Phil's decision, so the lever is order, not removal. Nothing defines a first end-to-end slice that proves tenancy, permissions, privacy-preserving records, one upload, one real-time display and one product before the rest are built.
- **Why it matters:** the plan is the first thing a solo founder will check, and a long list with no early proof point hides risk.
- **Correction:** add a short "first slice" definition to the backlog (see section 9), and have Phil re-confirm which of the 27 P0 items added in this round are truly P0 (for example D-16, E-07, M-10).
- **Blocks:** planning of phase 1; not a documentation-acceptance issue.

### Minor

**N-07. Some of the author's resolution claims and stale references are wrong.** (A)
- Architecture 8 says signed direct uploads are "Confirmed" while architecture 23 and the response doc (F-19 "Resolved") say Proposed.
- Backlog section 2 still says "Technical spikes before commitment: S-01 to S-12" (there are 13).
- The ledger's evidence says checks were "run 2026-10-30" but the scripts live outside the repository, so the evidence cannot be reproduced from it. Spec 16 item 11 leaves this to Phil. My own counts match the ledger's claims today; the reproducibility problem is real regardless.
- Decision index statuses for 0004 and 0008 read "accepted" while each record contains proposed parts.
- **Correction:** fix the wording; either keep a short validation procedure in the repository or state in the ledger that the evidence is not reproducible from it.

**N-08. Lucky Draw: residual gaps.** (B for epic I)
The documents do not say how many winners a round or prize has, how "winners excluded in later rounds" is computed from the event records, or how a database administrator's tampering with a draw would be detected (only the pool hash is recorded; nothing commits to it before the draw). None blocks starting epic I's design. Add them to decision 0015's open list.

**N-09. Spec and backlog disagree about ShareWall.** (A)
Spec 4.3 says "No ShareWall build starts until [consent and takedown rules] are decided". The backlog lets H-01 to H-05 proceed without H-06. Narrow the spec to the features that expose real guests' content, or add the dependency.

**N-10. Offline exposure for guest devices.** (C)
The lease and wipe design covers authorised station devices. Guests' own phones (queued uploads, cached Gallery items) are outside it and cannot be wiped by us. State this limit in spec 5.7 and the guest-facing notice.

**N-11. No external security test.** (C)
M-03 is a review by the Security & QA role, which is a Claude Code session. Before real guest data, Phil should decide whether an independent security test is needed and who does it. Authentication and multi-factor choices are open.

### Observations

**O-N1. The propagation design could be simpler.** D-14 (XL) is a fan-out service for derivatives, caches, exports, offline packs and backups. If the platform never stores export files (it generates them on demand) and never caches private media at an edge, most of the fan-out disappears. Worth testing in S-13 before building.

**O-N2. Six roles, one doer.** 114 of 149 items belong to the Software Engineer role. That is accurate for a solo founder using one Claude Code session, but it shows the "workforce" claims are thin until B-01 and B-04 prove otherwise.

**O-N3. Everything is still uncommitted.** Two days of work across several tasks exist only in the working tree. `CLAUDE.md` section 5 asks for verified checkpoints. Committing needs Phil's approval.

**O-N4. Phase 0 includes work that costs money and contacts people.** Hiring an adviser (T-024) and contacting prospects (T-023) are correctly shown as needing Phil's approval in the ledger's Blocker column, but the backlog shows O-02 and M-04 with "none" dependencies. Add the approval as a visible dependency.

## 4. A. Blocks documentation acceptance

1. **N-01** relabel the author-designed mechanisms (Gallery routes, curation defaults, the gate, the waiver) as Proposed, and make architecture 23, spec 3 and 4.5, decisions 0008 and 0018 and the response doc agree.
2. **N-07** correct architecture 8 versus 23, the "S-01 to S-12" reference, the decision index statuses, and either add a reproducible validation procedure or state the limit in the ledger.
3. **N-09** align spec 4.3 with the backlog on what waits for the consent rules.
4. **F-01** a review by someone other than this session, or Phil's own review (spec 6.4 allows the founder). This report is a defect finder, not acceptance.

Nothing else in the documents contradicts a decision Phil gave or `CLAUDE.md`. I found no secrets or personal data (a pattern scan over `CLAUDE.md` and `docs` returned no matches).

## 5. B. Blocks implementation, by epic

| Epic or item | What must happen first |
|---|---|
| A (A-01, A-02) | Split A-01 into shortlist and decision (N-02). Phil decides whether the O-09 gate blocks the scaffold or only real data (N-03) |
| C, D (C-01, D-01, D-03, D-15) | Define account-level and event-level owners (N-04). Add D-15 before D-03 and M-09 before D-01 and D-07 (N-02). Phil accepts the reference model of decision 0014 as the direction for the data model |
| E (E-01, E-05, E-07) | S-04, S-13 results; add A-02 as a dependency; retention values can be configuration (N-03) |
| F (Check-in Studio) | D-15, D-06, D-07, D-08. No offline work until L-01 and S-01 |
| G (Signature Mosaic) | S-05 and D-12 |
| H (ShareWall) | H-06 and H-11 decided with legal advice before ShareWall exposes real guests' content; synthetic-data build can start earlier (N-09) |
| I (Lucky Draw) | S-06; Phil's rule choices in decision 0015; the N-08 additions |
| J (Event Gallery) | J-10 decision (revocation effects, audience model) before J-02 to J-05 |
| L (offline) | S-01 and S-02 evidence, then Phil approves minimums and the lease |

## 6. C. Blocks real customer data or the private beta

1. Written advice from a qualified adviser, and the answers recorded: consent wording and withdrawal, the controller/processor model, retention periods, children's data approach, multi-person photos, public-upload duties, data location.
2. The customer-facing documents of N-05, drafted with the adviser.
3. Retention and deletion jobs (E-05) tested, and a restore test that re-applies the erasure ledger (E-07).
4. The measured revocation windows (S-13) and the offline lease accepted by Phil (L-09).
5. A named incident owner and a practised plan (M-05); the data-subject request runbook exercised (M-10).
6. A decision on external security testing, and the authentication method with its multi-factor policy (N-11).
7. The accessibility audit with assistive technology on key flows (O-08).
8. The report-content route and removal process (H-11).
9. The guest-device limit (N-10) stated to users.
10. Phil's approval to contact real organisers (O-04) and the private-beta data-handling plan.

## 7. Founder decisions required now

These shape the next steps and cannot be left to a spike:

1. **Correct the labels** in N-01: confirm which parts of the Gallery ingestion design and the gate are his decisions and which remain proposals.
2. **Scope of the O-09 gate** (N-03). Recommended default (not approved): discovery and legal engagement start now; the gate applies to real guest data, the private beta and the advice-dependent features; scaffolding with synthetic data may start after Phil's own stack decision.
3. **Approve the spend and contact:** appoint a legal/privacy adviser (T-024) and approve contacting prospects (T-023). Both are blocked on him.
4. **Define "owner"** (N-04). Recommended default: ownership belongs to the account; an event's collaborators are invited per event; permanent event deletion is limited to the account owner.
5. **Accept or amend the reference model** (decision 0014) as the direction for the data model, because D-03 and D-15 depend on it.
6. **Re-confirm the P0 list** (N-06).

## 8. Decisions that can wait

| When | Decisions | Recommended default (not approved) |
|---|---|---|
| After spikes | Stack and hosting; real-time mechanism (S-03); signed-link lifetime, cache purge and propagation deadline (S-13); offline minimums and lease length (S-01, S-02); Lucky Draw random method (S-06); AI moderation and Instagram go/no-go (S-07, S-08) | Monolith with the simplest real-time option that passes S-03; short link lifetime in minutes; Lucky Draw server-side only; AI moderation off at launch |
| Before the epic that needs them | Lucky Draw rule choices (before I-02); Gallery audience model, guest upload link, trusted photographers (before epic J); operator control sessions (before D-17 and I-07); retention periods (before E-05, with advice); pending-deletion period and ownership recovery (before C-06, C-08); accessibility target (before A-07); availability objectives (before E-07, M-11) | Same snapshot for a re-draw; absent winner excluded from the same prize; link-holder audience; photographers need approval; WCAG 2.2 AA as target; a 14-day-style pending period to be set by Phil |
| After the MVP | Pricing, tiers, payments, checkout; what the free entry point includes; order of later languages; AI translation | As recorded in decision 0010 and spec 9 |

## 9. MVP completeness, realism and complexity

**Completeness (verified):** all five products appear in the spec, architecture, backlog and decisions, and remain distinct (ShareWall grids versus Signature Mosaic designs versus Event Gallery as post-event). Check-in Studio's permanent free entry point is recorded in spec 1.1, 4.1 and 9, decision 0009, and in the post-MVP items N-02 and N-09; it is not testable in the MVP. The six roles match `CLAUDE.md` exactly in the spec, architecture 17 and decision 0003. Monetisation and payment processing are outside the MVP in decision 0010, spec 9 and the backlog (epic N is post-MVP; the only MVP trace is the optional seam D-11).

**Realism for a solo founder with Claude Code:** the architecture is appropriately simple. The delivery plan is large (section 3, N-06). It is realistic only if the order is respected and the early work is a thin end-to-end slice. The two biggest sequential risks are the external adviser (N-03) and the offline work, which is correctly staged.

**Unnecessary complexity:** the revocation propagation service (O-N1); the number of P0 additions (N-06); the written waiver process (N-01); offline for guest devices (N-10).

**Missing dependencies:** N-02 lists them.

**Critical implementation risks:** the privacy design bypassed by a guest model built first (N-02); real-time and media at event scale (S-03, S-04 unrun); the draw integrity under concurrent operators (S-06 unrun); legal advice arriving late (R-21).

**Recommended first implementation tasks** (after Phil's decisions in section 7, in this order):
1. Fix the documents (section 4) and commit them with Phil's approval.
2. Start T-023 and T-024 (O-02, M-04, M-08) and B-01 to B-04 (agent capability check, role definitions, review procedure). These involve no guest data.
3. Run spikes S-05 and S-12 (no dependencies), then the shortlist for A-01 and spikes S-03, S-04, S-11, S-13.
4. A-01 decision, A-02 scaffold, A-04 synthetic data, A-07 accessibility baseline, M-09 threat model.
5. First slice (proves the foundations): C-01 with the N-04 definition, D-01, D-15, D-03, D-06, D-07, D-08, one real-time display (D-10), then Check-in Studio core F-01 to F-05 with F-12 and F-11.
6. Then Lucky Draw (after S-06), Signature Mosaic and ShareWall (after S-05), Event Gallery (after J-10), and the offline minimums in the order of decision 0017.

## 10. Final recommendation

**Accept with changes.** The Phase 0 documents are a sound planning baseline once the labels are corrected (N-01, N-07, N-09) and someone other than the authoring session reviews them (F-01). They are not yet an executable plan: fix N-02 to N-04 before the epics they affect, and treat section 6 as the entry condition for real guest data. Nothing in this report approves a proposal.

## 11. Validation performed and Git state

**Checks I ran (new scripts written for this review, kept outside the repository because I may not modify it; the checks are described so they can be repeated):**

| Check | Result |
|---|---|
| Markdown links across 32 files (including this review's inputs) | 0 broken |
| Backlog parse: 149 items, dependency targets exist | 0 missing |
| Dependency graph: cycles, longest chain, items behind O-09 | No cycle among backlog items; longest chain 13; 115 of 149 behind O-09 |
| Spike versus backlog dependency wording | Circular in wording for S-03 and S-13 against A-01 |
| Priorities, sizes, roles | P0 100, P1 28, P2 7, Post-MVP 10, Gated 2, Moved 2; XL 6, L 50, M 79, S 12; one role per item |
| Counts claimed in the ledger and response | All match: 149, 13, 24, 18, 22 |
| Text search for missing items | No match for privacy notice, terms, cookie, data processing agreement, penetration, disaster |
| Search for "decided" near author-designed mechanisms | Spec 4.5 and decision 0008 label them decided |
| Cross-document label checks | Architecture 8 versus 23; backlog "S-01 to S-12" |
| Secret and personal-data pattern scan over `CLAUDE.md` and `docs` | No matches |

**Not run:** there is no linter, test suite or build. I did not re-verify external facts.

**Git (inspected, not modified):**
- Branch `docs/update-master-spec`, HEAD `cee73a3` (`docs: record T-002 completion in task ledger`).
- Staged: 0.
- Modified tracked files (3): `docs/MVP-MASTER-SPEC.md`, `docs/decisions/README.md`, `docs/task-ledger.md`.
- Untracked: `docs/Reviews/` (the review brief, the first report, the author's response and, from this review, this report), `docs/architecture/`, `docs/planning/`, decisions `0002` to `0018`, and the prompts `phase-0-consolidation-and-mvp-planning.md` and `phase-0-fresh-independent-review.md`.
- `CLAUDE.md` is unchanged.
- No remote operation was run. `origin` still has only the older commits.

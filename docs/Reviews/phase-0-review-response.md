# Response to the Phase 0 independent review

- **Date:** 2026-10-30
- **Responds to:** [phase-0-independent-review-report.md](phase-0-independent-review-report.md)
- **Written by:** the same Claude Code session that wrote the original documents and the first review, working on Phil's instruction of 2026-10-30.
- **F-01 stays open.** None of this has had independent review. A fresh Claude Code session (or Phil) must re-run `phase-0-independent-review.md` against the updated documents (ledger T-026).

> **Update after Phil's final corrections (2026-10-30).** The rows below are history. Where they conflict with the current documents, the current documents and [the change summary](phase-0-final-corrections-summary.md) win. Rows superseded: **F-05** and **F-12** (the Gallery ingestion routes are now *proposals* and the hard gate before building is replaced by a real-data gate, decision 0018); **F-19** (signed uploads are now labelled Proposed in architecture 8 and 23); **F-20** (the threat model M-09 is now a dependency of D-01 and D-07); **F-23** (account owners and event collaborators are now distinct roles, decision 0011); **F-03** (the reference data model in decision 0014 is now labelled proposed and needing technical and privacy validation). The previous review reports were not edited.

**ID namespaces.** The review report's finding IDs (F-01 to F-24, O-01 to O-07) are separate from the backlog's item IDs. Both use the letter F, so a backlog Check-in Studio item such as F-05 is not review finding F-05. In this response, backlog items are always introduced with the word "backlog".

## How to read the status column

| Status | Meaning |
|---|---|
| **Resolved** | The documents are corrected and nothing further is needed from Phil |
| **Addressed, design proposed** | A concrete design is written down and labelled Proposed. Phil, a spike or legal advice still has to settle named points. It is not approved and not legally verified |
| **Decided by instruction** | Phil gave the instruction in his message of 2026-10-30, so it is recorded as a decision |
| **Open** | Not done |

Nothing here is a claim of legal compliance. Legal points are questions for a qualified adviser (backlog M-04).

## Critical and Major findings

| ID | Status | What changed and where | Still needs |
|---|---|---|---|
| F-01 | **Open** | Ledger T-026 created. Spec 6.4 and 8.1 rules are unchanged | A fresh-session review and/or Phil's own review |
| F-02 Consent withdrawal and revocation | Addressed, design proposed | Spec 11.2; architecture 24 (concepts, who can revoke, an artefact-by-artefact table with exposure windows, propagation, tests); decision 0013; backlog D-13 (receipts), D-14 (propagation), E-01, E-07, M-10; spike S-13; risk R-13, R-23 | Values for link lifetime, purge target and deadline (S-13); multi-person policy; self-service takedown; legal advice |
| F-03 Append-only versus erasure | Principle decided by instruction; design proposed | Spec 11.3; architecture 25 (reference model, retention classes, tests); decision 0014; backlog D-15, D-06, F-05, I-05, E-05; risk R-19 | Retention periods for every class; legal view on references |
| F-04 Offline devices and revocation | Addressed, design proposed | Spec 5.7 (privacy and lease) and 11.1 (revocation criterion now states the offline exception); architecture 9; decision 0017; backlog L-09, D-08; risk R-20 | Lease length; Phil must accept the exposure window |
| F-05 Gallery has no P0 ingestion path | Decided by instruction; details proposed | Spec 4.5; decision 0008; backlog J-12 (ingestion), J-13 (curation), J-01 (eligibility), J-09 | Guest upload link; trusted-photographer auto-approval; audience model |
| F-06 Backlog does not enforce design before building | Resolved | J-02 to J-05 now depend on J-10 and D-14; J-10 covers revocation effects on issued links, downloads, shares and prints | The J-10 decision itself |
| F-07 Cross-product sequencing | Resolved | D-02 and D-04 are phase 1 foundation work; G-02, I-01, J-01, J-08 depend on them; the rendering library moved to a platform item (D-12, G-01 marked Moved); phase table and critical path rewritten | None |
| F-08 Lucky Draw lifecycle | Addressed, design proposed | Architecture 14 rewritten (entities, states, command table, late check-ins, repeated input, randomness evidence); spec 4.4; decision 0015; backlog I-02, I-04, I-05, I-07, I-08, I-10; spike S-06; risk R-22 | The rule choices in 0015 and the random method |
| F-09 Accessibility | Requirement decided by instruction; target proposed | Spec 5.11 and 11.1; architecture 26; decision 0016; backlog A-07, F-11, G-09, H-10, I-09, J-11, O-08; risk R-18 | Confirm WCAG 2.2 AA after advice; signature capture alternative |
| F-10 Data-subject requests, backups, recovery | Addressed, design open | Spec 11.4; backlog E-07, M-10, M-11 (gated); architecture 24.3 | Availability and recovery objectives; backup retention |
| F-11 Offline elevated to must-have | Addressed, design proposed | Spec 5.7 (minimum per product, limits, fallbacks, descoping rule); decision 0017; backlog F-10, L-03 to L-08 (smaller, staged, Check-in Studio first), L-05 | Phil approves the minimums after S-01 and S-02. The founder decision that all five products have some offline capability is preserved |
| F-12 Discovery and legal came last | Decided by instruction | Decision 0018; spec 14; backlog phase 0 reordered, O-02, M-04, M-08 first, gate O-09, A-02 depends on O-09, A-01 depends on M-04; ledger T-023, T-024 | Phil's gate review; an adviser appointed |

## Minor findings

| ID | Status | What changed |
|---|---|---|
| F-13 Ledger evidence and schema | Resolved, one item open | Ledger rewritten with one schema matching `CLAUDE.md` section 2, refreshed evidence, no "see report" references, and a note that one session did the work. Open: whether to keep the validation script in the repository (spec 16 item 11) |
| F-14 Admin "revenue" and agent activity | Resolved | Architecture 18 aligned with spec 5.10 and backlog B-08 |
| F-15 Spec section 16 duplicates | Resolved | Section 16 rewritten as a clean list of 22 open items |
| F-16 Keyboard conventions and presenter role | Resolved as proposals | Same key means the same thing; consequential actions use `Shift` plus a key and confirm; key-repeat ignored; operator control session proposed (spec 5.5, decision 0004, backlog D-17, I-07). The role needs Phil's approval |
| F-17 Combined owners | Resolved | One role per backlog item; design review named in Verification |
| F-18 Public-upload abuse | Addressed | Spec 4.3; backlog H-11 (gated on legal advice), D-16; risk R-23; M-04 brief |
| F-19 Architecture labels | Resolved | "Signed direct uploads" relabelled Proposed; database and storage marked as assumptions A-01 must confirm |
| F-20 Threat model timing, token display, rate limiting | Resolved | M-09 (design-stage threat model), M-03 now pre-launch, D-16, derived tokens for links that must be re-shown (architecture 10) |
| F-21 Signature overlap | Resolved | Spec 4.2: ShareWall signatures reach Signature Mosaic only through a grant |
| F-22 Audit fields for sync | Resolved | `occurred_at`, `received_at`, `claimed_at`, sync batch (architecture 4 and 9) |
| F-23 Event deletion default | Decided by instruction | Permanent event deletion is owner-only with confirmation and audit (decision 0011, spec 5.4, backlog C-06, C-08). Archiving stays shared |
| F-24 Housekeeping | Partly open | Open: folder casing (`docs/Reviews` against `docs/reviews`) and a line-ending policy are listed in spec 16 item 11. The folder was left as named in Phil's instructions |

## Observations

| ID | Status |
|---|---|
| O-01 Scope for one person | Partly addressed: smaller staged offline items and an early gate. No further descoping was proposed |
| O-02 Free entry point not testable in the MVP | Not changed |
| O-03 Agent workforce unverified | Not changed. B-01 and S-12 remain the first steps |
| O-04 `CLAUDE.md` currency | Not changed. `CLAUDE.md` was not edited. Phil to decide whether to add the MVP exclusions and the new gates |
| O-05 Uncommitted work | Not done. Nothing was staged or committed |
| O-06 International availability | Addressed in the M-04 legal brief |
| O-07 Gallery audience model | Proposed default recorded; open (spec 4.5, decision 0008) |

## Decisions recorded as Phil's (his message of 2026-10-30)

- Event Gallery has a P0 ingestion path that enforces consent, moderation and permissions (0008).
- Permanent event deletion is owner-only, with confirmation and audit (0011).
- Customer discovery and legal/privacy review come first (0018).
- Immutable records must not retain personal data indefinitely (0014, principle).
- Consent withdrawal and revocation must work end to end (0013, requirement).
- Accessibility requirements are added across all five products (0016, requirement).
- All five products keep some offline capability (0007, unchanged).

## Left as proposals (not approved)

0004 conventions and operator sessions; 0006 modular monolith; 0013 revocation design; 0014 erasure design; 0015 Lucky Draw rules; 0016 target level; 0017 offline minimums and lease.

## Founder decisions needed

See spec section 16 (22 items) and ledger T-022. The most urgent for the first epics: retention periods; the multi-person policy; signed-link lifetime and propagation deadline; the offline lease and exposure window; the Lucky Draw rule choices; the Gallery audience model; and who is appointed as legal/privacy adviser.

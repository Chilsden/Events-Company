# Phase 0 final corrections: change summary for the independent reviewer

- **Date:** 2026-10-30
- **Instructions applied:** `docs/prompts/phase-0-final-corrections.md` (Phil's six decisions, the corrections list and the milestone request)
- **Written by:** the same Claude Code session that wrote the earlier documents and both earlier review reports. This summary is a map for a reviewer, not a review. Ledger T-026 (a review by a session with no memory of authoring, or by Phil) is still open.
- **Not changed:** `CLAUDE.md`; `docs/Reviews/phase-0-independent-review-report.md`; `docs/Reviews/phase-0-fresh-independent-review-report.md`; `docs/Reviews/phase-0-independent-review.md`; any application code. The author's response (`phase-0-review-response.md`) only received an update note at the top.
- **Not done:** no staging, commit, push, merge or deploy.
- **Update:** Phil's authorisation of Milestone 1 development with synthetic data is now recorded explicitly in decision 0019. Where this summary says starting implementation was an open question (spec 16 item 24), that is superseded for Milestone 1 only.

## 1. Phil's decisions as applied (exactly as written)

| # | Decision | Where recorded |
|---|---|---|
| 1 | Event Gallery is a distinct post-event product and aggregates eligible content from Check-in Studio, ShareWall, organisers and photographers. The three technical ingestion routes remain proposals, not approved implementation decisions | Decision 0008; spec 3 and 4.5; architecture 13, 23, 24.6; backlog J-12; ledger T-016 |
| 2 | Scaffolding, architecture spikes, agent development and implementation with synthetic data may proceed before legal/privacy approval | Decision 0018 (rewritten); spec 3, 14; architecture 27; backlog A-02, section 1.1; ledger |
| 3 | Legal/privacy review and customer discovery begin early. Preparation (research, adviser shortlists, outreach drafts) is authorised. Hiring, spending and contacting prospects each need separate founder approval | Decision 0018; backlog O-10, M-14, M-08 (authorised), O-02, M-04 (need approval); ledger T-023, T-024, T-027, T-028 |
| 4 | Account owners and event collaborators are distinct. The account owner controls account-level actions and permanent event deletion. Event collaborators manage ordinary event operations | Decision 0011 (rewritten); spec 3, 5.4; architecture 6; backlog C-01, C-06, C-08, D-01 |
| 5 | Decision 0014 is a proposed reference data model needing technical and privacy validation, not an approved final implementation | Decision 0014 (status changed); spec 3, 11.3; architecture 1, 23, 25; backlog D-15; risk R-26 |
| 6 | All five products and the six-role workforce stay in MVP scope. The P0 list is not automatically a commitment to build everything before the first usable release | Backlog header and section 1.1; spec 3 and 14 |

## 2. Corrections completed

| Correction | What changed |
|---|---|
| Circular dependency between A-01 and spikes S-03/S-13 | New A-08 (shortlist, no dependencies). A-01 depends on A-08 and the spikes. Spikes S-03, S-04, S-11, S-13 now depend on the shortlist, not on the decision |
| Missing dependencies on A-02 | A-02 depends only on A-01 (the O-09 gate was removed from it). Added A-02 to D-10, E-04, E-05, H-05, L-03 and K-08; every implementation item now reaches A-02 |
| Missing privacy and threat-model dependencies | D-03 depends on D-15; D-01 and D-07 depend on M-09; D-04 and D-06 depend on D-15 |
| Incorrectly labelled founder decisions | Gallery ingestion routes, the gate and the waiver relabelled as proposals or removed (spec 3 and 4.5, decisions 0008 and 0018, architecture 23); decision 0014 relabelled proposed; index statuses for 0004, 0008, 0011, 0014, 0018 corrected |
| Inconsistent ShareWall gating | Spec 4.3 now says building and testing with synthetic data may proceed; real guests' content waits for the consent decisions and the real-data gate. H-06 depends on Phil's decision, not on legal advice |
| Signed-upload architecture status | Architecture 8 now labels signed direct uploads Proposed (spec 5.3 says "where appropriate"), matching architecture 23 |
| Stale "S-01 to S-12" | Now S-01 to S-13 |
| Account owner versus event collaborator | Defined in decision 0011, spec 5.4 and architecture 6, and applied in about 20 other places. "Owner-only" is kept as shorthand for "account-owner-only". The word "owner" is not used for an event |
| Overly broad development gates | Removed the gate on the scaffold. M-04 is no longer a dependency of A-01, D-04, E-05, H-06, H-11, J-10 or M-10. O-09 is now the real-data and private-beta gate. 2 items sit behind it (O-05, O-06), down from 115 |
| Other related items from the latest review | Added M-12 (customer-facing legal documents), M-13 (external security test and authentication), A-09 (production hosting and data location, separate from the stack decision). Lucky Draw open questions added (winners per round, exclusion computation, pool-hash commitment). Guest-device limit added to spec 5.7. Ledger evidence-reproducibility limit stated. Risks R-25 and R-26 added |

## 3. Delivery milestones (backlog 1.1, spec 14; proposals for Phil to confirm)

| Milestone | Content | Items |
|---|---|---|
| Early track (parallel) | Discovery and legal/privacy preparation | O-10, M-14, M-08 authorised; O-02, M-04 need approval |
| 1 Development foundation | Scaffold, Claude Code agent capabilities, spikes, synthetic data, automated checks | 13 items plus the spikes |
| 2 First end-to-end experience | Create event, check in guest, capture signature, display Signature Mosaic, view eligible content in Event Gallery | 31 items |
| 3 Complete MVP and private beta | All five products, offline, security, privacy, accessibility, operations, real-event validation | 94 items; Post-MVP and Moved items are 12 |

No product, agreed offline capability or role was removed. P0 items are now 105 (five more than before: A-08, A-09, M-12, M-14, O-10).

## 4. Decisions still proposed (not approved)

0004 conventions and operator sessions; 0006 modular monolith; 0008 ingestion routes and curation defaults; 0013 revocation design; 0014 reference data model; 0015 Lucky Draw state machine and rules; 0016 accessibility target level; 0017 offline minimums and lease; the milestone lists.

## 5. Tasks that can start with synthetic data

(Starting still follows decision 0001, i.e. Phil's instruction to begin; spec 16 item 24 asks whether decision 0018 is that instruction.)

- Backlog A-08, A-01, A-02 to A-07, B-01 to B-04, M-09.
- Spikes S-05 and S-12 now; S-03, S-04, S-11, S-13 after the A-08 shortlist; S-01, S-02, S-06 when their dependencies allow; S-09 after A-01.
- Milestone 2 items (section 3) and, after them, the product work in Milestone 3 that does not need real data.
- Ledger T-010, T-011, T-018 and the product workstreams T-012 to T-017.

Authorised preparation, needing no approval: O-10, M-14, M-08 (ledger T-023, T-024).

## 6. Tasks blocked by legal/privacy review (before real data, not before development)

- O-09 (the real-data and private-beta gate) and everything behind it: O-05 (private beta), O-06 (launch readiness).
- A-09 (production hosting and data location), M-12 (customer-facing legal documents), M-13 (external security test and authentication), O-07 (legal sign-off).
- Final consent wording (D-04 configuration), retention values (E-05 configuration), report-route wording (H-11), request-handling wording (M-10), privacy validation of the data model (D-15).
- Phil's decisions on ShareWall consent and takedown (H-06) and the Gallery revocation effects (J-10), with advice as input.

## 6a. Tasks requiring founder approval

- Hiring a legal/privacy adviser, any spend, and contacting prospects (each separately): ledger T-027, T-028.
- Starting implementation (decision 0001), the stack decision (A-01) and the shortlist (A-08).
- Approving or changing the Gallery ingestion routes, the reference data model, the revocation design, the Lucky Draw rules, the offline minimums and lease, operator sessions, the accessibility target and the milestone lists.
- Committing the working tree (nothing is committed).

## 7. Open questions remaining

Spec section 16 has 27 open items (it had 22). New in this round: several account owners and who may create an event; the external hiring and contact approvals; whether decision 0018 starts implementation; the external security test and authentication; Lucky Draw additions; the milestone lists. Nothing in this round resolved an unrelated product, legal or technical question.

## 8. Validation (run 2026-10-30 after all edits)

| Check | Result |
|---|---|
| Markdown links across 34 files | 0 broken (after this summary was added) |
| Backlog: 155 items, 8 columns, one role each, dependency targets exist, no cycles | Pass |
| Every implementation item reaches the scaffold (A-02) | Pass after the K-08 fix |
| Items depending directly on M-04 | A-09, M-12, O-06, O-07, O-09 only |
| Items depending directly on O-09 | O-05, O-06 only |
| Milestone lists: Milestone 2 depends only on Milestone 1, early-track and Milestone 2 items; Milestone 1 only on Milestone 1 and early-track items | Pass |
| Spike and risk IDs defined and referenced consistently (13 spikes, 26 risks) | Pass |
| Counts quoted in the ledger (155 items, 27 open items, R-01 to R-26, S-01 to S-13) match the files | Pass |
| Terminology: no "event owner"; no unqualified "owners and collaborators" outside history | Pass |
| No "decided" label on the ingestion routes; 0014 and 0008 labelled proposed where required | Pass |
| Stale wording ("S-01 to S-12", "gate the start of building", "waits for the phase 0 gate", old counts) in current documents | None |
| Previous review reports older than this task's first edit | Pass (sizes unchanged: 28,094 and 31,209 bytes) |
| Secret and personal-data pattern scan over `CLAUDE.md` and `docs` | No matches |

The validation scripts are kept outside the repository (see the ledger's evidence note). There is no linter or test suite.

## 9. Git

Branch `docs/update-master-spec` at `cee73a3`. Nothing staged, committed or pushed. The working tree holds all Phase 0 work uncommitted.

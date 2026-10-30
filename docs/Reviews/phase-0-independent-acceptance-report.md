# Phase 0 Independent Acceptance Review: Report

- **Date:** 2026-10-30
- **Instructions followed:** `docs/prompts/phase-0-independent-acceptance-and-checkpoint.md`, Stage 3
- **Reviewed commit:** `53bd0d0a469e1be3dbef774bed182fb19d2c54ce` on `docs/update-master-spec` (working tree clean when I started)
- **Changed by this review:** nothing except this file. No existing document was edited. No state-changing Git command was run.
- **Finding IDs:** this report uses the prefix `IA-` so that its IDs do not collide with backlog items (F-05), review findings (F-02, N-01) or conflict-register IDs (C-3).

## 0. Reviewer status and limits (read first)

1. **Who I am.** I am a fresh-context Claude Code subagent. I did not write any of the reviewed documents and I have no memory of writing them. I was given only the task description: the repository path, the review scope (14 areas), the hard rules and the report format. I was not given the authoring conversation or any earlier conclusions.
2. **What I read, from disk, in full:** `docs/prompts/phase-0-independent-acceptance-and-checkpoint.md`; `CLAUDE.md`; `docs/MVP-MASTER-SPEC.md` (draft 0.5, 783 lines); `docs/decisions/README.md` and decision records 0001 to 0019; `docs/architecture/MVP-TECHNICAL-ARCHITECTURE.md` (draft 0.3); `docs/planning/MVP-DELIVERY-BACKLOG.md` (draft 0.3); `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md` (draft 0.3); `docs/task-ledger.md`; all five files in `docs/Reviews/` (the earlier review material, treated as claims); `docs/prompts/phase-0-final-corrections.md` and `docs/prompts/phase-0-fresh-independent-review.md` (to check the founder's recorded decisions against their source). **Not read in full:** `docs/prompts/phase-0-consolidation-and-mvp-planning.md`, `docs/prompts/update-master-spec-and-claude-md.md` and `docs/research/operating-model-sources.md`. I only searched them for specific terms.
3. **Tools used:** file reads; read-only Git (`status`, `log`, `show --stat`, `branch -vv`, `remote -v`, `ls-remote`, `rev-parse`, `diff --stat`, `ls-files`); `grep`; a Python 3.11 script I wrote and kept in the OS temp directory (`ia_checks/chk.py`, outside the repository). I contacted no external service.
4. **Limits of my independence.**
   - I share an underlying model with the authoring session. We are likely to share blind spots, for example in how we read ambiguous wording or what we think of as a normal security baseline. A fresh context removes shared memory. It does not remove shared model bias.
   - The task description that scoped me was written by a caller who is probably the authoring line. The 14 areas steered where I looked. I added checks of my own (sections 2 and 6), but I did not look at everything.
   - I cannot see the founder's original messages. Several "decided by Phil" records rest on the authoring session's account of them (IA-14).
   - Nothing here is legal advice. I verified no external fact (law, WCAG text, Meta or vendor behaviour, Claude Code feature behaviour). I report only how the documents label such things.
   - There is no code, so "achievable" and "enforceable" mean "specified and testable", not "proved".
5. **No approval is given on the founder's behalf.** Section 7 is a recommendation. Phil decides.

## 1. Executive summary and recommendation

**Recommendation: accept with changes.** The Phase 0 set is coherent, unusually candid about what is unknown, and consistent on the headline decisions. I found no Critical defect.

What I verified as sound:
- The five-product scope is consistent everywhere I checked: spec, decisions, architecture, backlog, risk register, ledger.
- The six roles match `CLAUDE.md` in every document.
- Monetisation is out of the MVP. Epic N is post-MVP, and the only trace is the optional seam D-11.
- Check-in Studio's permanent free entry point is recorded in decision 0009, spec 1.1, 4.1 and 9, and backlog N-02 and N-09.
- Proposals are labelled as proposals. Decisions 0006, 0013, 0014, 0015 and 0017 are `proposed`. The Gallery ingestion routes, the modular monolith, the relational database and S3-compatible storage, and signed uploads are labelled Proposed or assumption.
- The founder's Milestone 1 authorisation (decision 0019) matches the prompt's wording and exclusions, with no extra authority.
- All numeric claims I re-computed match: 155 backlog items, 13 spikes, 26 risks, 19 decisions, 27 open questions. There are no broken links and no dependency cycles.

What stops me saying "accept as is":
- **Three Major findings.**
  - IA-01: the stack-decision chain (A-08, then spikes, then A-01, then the scaffold) quietly needs hosted platforms and external accounts that no gate covers.
  - IA-02: the revocation design omits the most common live-event path, a withdrawn item still on a connected display, and also third-party processors.
  - IA-03: the proposed Lucky Draw `reset_round` permits unseen re-rolls.
- **Ten Minor findings.** A handful are small factual contradictions that should be fixed before Phil accepts the baseline:
  - the stale "C-9 open" record of Git authorisation (IA-05);
  - ledger rows that re-create the A-01 and spike circularity (IA-06);
  - a backlog sentence that contradicts its own dependency (IA-07).
- **Six Observations.**

None of the Major findings blocks documentation acceptance. IA-01 partly blocks Milestone 1 (only the stack decision A-01 and the scaffold behind it). Nothing prevents the rest of Milestone 1 from starting.

## 2. Findings

Severity: Critical, Major, Minor, Observation. Category is one of: **Documentation acceptance blocker (DAB)**, **Milestone 1 implementation blocker (M1B)**, **Real-data / private-beta blocker (RDB)**, or "blocks nothing".

### Major

**IA-01. The path to the stack decision needs external accounts and possibly spend, and nothing gates or names that. (Major, M1B, partial)**
- **Where:** backlog 2 (critical path), A-01, A-02; risk register preamble (line 7) and S-03, S-04, S-11, S-13; decision 0019 ("Tooling … free or already approved"; no material spending).
- **Problem:** A-01 depends on A-08 and on spikes S-03, S-04, S-11 and S-13. The scaffold A-02 depends only on A-01. So the spikes must run before any repository scaffold exists.
  - The documents say none of these four:
    - where the throwaway spike code lives;
    - whether it may be committed;
    - which role may write it;
    - which files that role may touch.
  - S-13 ("On candidate platforms, issue signed links… measure how long each still works… Test cache behaviour… restore a backup") and the hosting checks in S-03 and S-04 need real cloud or CDN accounts. The risk register itself says "Any paid service, live data or external account needs Phil's approval first". The backlog lists the gated and approval-needed items (section 2), but this one is absent.
- **Why it matters:** Milestone 1 "done when" includes "the stack decision and spike results are recorded". That outcome can silently stall on an account or card approval. Or an agent may create a cloud account to proceed. That breaches the "material spending" and "external commitment" boundaries.
- **Correction:**
  - Add to backlog 2 and to A-08 an explicit statement that S-03, S-04, S-11 and S-13 are run locally or with free tiers that need no card. Alternatively, list the account approval as a founder gate.
  - State where spike code lives, for example a `spikes/` folder on a task branch, marked throwaway.
  - Say which spikes can be answered locally (S-01, S-02, S-05, S-06, S-12) and which cannot (hosted behaviour in S-04 and S-13).
- **Blocks:** A-01 and the scaffold behind it, only for the hosted-platform parts. All other Milestone 1 items can start (see section 5).

**IA-02. The revocation design omits live displays, in-memory state and third-party processors. (Major, RDB; fix before D-14/S-13 are scoped)**
- **Where:** architecture 24.3 (per-artefact table), 7, 24.4; spec 11.2; decision 0013; backlog D-14.
- **Problem:** the 24.3 table covers pages, signed links, CDN, derivatives, exports, gallery links, shares, prints, email, offline devices, backups and analytics. It has no row for these:
  - **A live ShareWall or Signature Mosaic display that is already rendering a withdrawn item.** Architecture 7 says a reconnecting display "reloads current state". Nothing says the server pushes a removal event, or that displays re-check eligibility periodically. A withdrawn photo can stay on a public screen until reload.
  - **Third-party processors that received content or personal data:** AI moderation, AI translation, email provider, print provider. Spec 5.6 and architecture 16 correctly require privacy review before any content leaves our systems. The revocation table never says that a processor's copy needs a deletion request or a retention limit.
  - **Browser or service-worker caches on guests' own devices.** This is mentioned as a limit in spec 5.7 but not in 24.3.
  - **The printed or CSV guest list used as the offline fallback (F-12).** It puts personal data outside any lease and outside the erasure ledger.
- **Why it matters:** withdrawal of consent at a live event is the main case in practice. The design promises "hide at once", but the wall is the place a guest looks.
- **Correction:**
  - Add the four rows to 24.3.
  - Add a "revocation reaches connected displays" acceptance test to D-14 or H-04.
  - Add "processor deletion" to the M-04 brief and to M-12 (sub-processor list).
  - State the CSV and print limits to organisers.
- **Blocks:** not Milestone 1. It is a precondition for ShareWall or Gallery with real guests (RDB) and for sizing D-14 correctly.

**IA-03. The proposed Lucky Draw `reset_round` allows unseen re-rolls. (Major for epic I; blocks nothing before I-02)**
- **Where:** architecture 14.3 (`reset_round`, `draw`, `confirm_winner`), 14.4 rule 6; decision 0015 (rule choice 2, "does a winner voided by a reset return to the pool? Proposed: yes"); spec 4.4; spec 5.5 (`Shift+R`).
- **Problem:**
  - `draw` executes on the server and records the selection. The public reveal (`R`) is a separate, later step.
  - The console shows the winner as text before the audience does (spec 5.11, Lucky Draw row).
  - `reset_round` is allowed from `drawn` and `needs_redraw`. It voids the active selection, takes a new snapshot and returns the round to `ready`. A winner voided by reset returns to the pool (proposed). Nothing limits resets, requires a second person, or exposes the void count to the audience.
  - All records are appended, so an auditor can see it. But the audience, who only see the final reveal, cannot, and nothing in 14 or 0015 treats a reset after a seen result as a fairness risk. The documented guarantee ("no silent rerun") is met. The guarantee people care about ("the drawn winner stands unless there is a stated reason") is not stated.
- **Why it matters:** the draw's trust claim is its main selling point (S-06 "Why it matters"). I-08's suite covers "reset then draw" as a correctness test, not as a fairness policy.
- **Correction:**
  - Add a rule choice to 0015: may `reset_round` be used after a selection exists. If kept, require the reason to be shown on the winner-history page and the evidence summary, count voided selections in the visible summary, and consider disallowing reset once the selection has been revealed.
  - Add these to I-04's acceptance criteria and I-05's evidence format.
- **Blocks:** nothing in Milestone 1. Resolve before I-02 acceptance. Also a beta precondition if the beta runs a real draw with prizes.

### Minor

**IA-04. The state machine cannot replace one absent winner when a round has several winners. (Minor, epic I)**
- **Where:** architecture 14.3 (`mark_absent`: `drawn` → `needs_redraw` only "when none remain active"; `redraw` only from `needs_redraw`); spec 16 item 26 (winners per prize or round is open).
- **Problem:** with three winners in a round, marking one absent leaves the round `drawn` and offers no command to replace that one winner. The state machine presupposes a single winner per round while the number of winners is an open question.
- **Correction:** settle winners per round (spec 16 item 26) before I-02. Then add a partial-replacement path or restrict a round to one winner.
- **Blocks:** nothing now; I-02 acceptance.

**IA-05. The records still say the Git decision (C-9) is open, although Git use has been authorised and used. (Minor, DAB)**
- **Where:** spec 1 ("C-9 (Git approval) is still open"), spec 16.1 (preamble and the C-9 row: "Commit and push wait for Phil's approval"); `docs/prompts/phase-0-independent-acceptance-and-checkpoint.md` Stage 2 and 5; Git history.
- **Problem:** Phil's acceptance prompt explicitly authorises a documentation commit and a push of the existing branch only, and a second checkpoint after review. Commit `53bd0d0` was made and I confirmed the remote branch points to it. The spec still records Git approval as outstanding. It also does not state the limits that remain (no `main`, no force-push).
- **Why it matters:** item 14 of this review is the accuracy of the recorded founder boundaries. A stale "open" can be read as no Git authority, or as a loophole.
- **Correction:** update C-9 to say what Phil authorised, for which branch and stages, what stays prohibited (merge to `main`, force-push, push of `main`), and cite the prompt.
- **Blocks:** documentation acceptance (a small edit).

**IA-06. Ledger rows re-create the A-01 and spike circularity, and several rows do not match the backlog. (Minor, DAB; fix when Milestone 1 tasks are split out)**
- **Where:** ledger T-011, T-018, T-010, T-031; backlog 1.1.
- **Problem:**
  - **Circularity.** T-011's scope includes A-08, A-01, A-02 and more, and T-011 depends on "A-01 stack decision by Phil (after the A-08 shortlist and spikes S-03, S-04, S-11, S-13)". T-018 (the spikes) depends on "A-08 for S-03, S-04, S-11, S-13", and A-08 is inside T-011. At ledger-row granularity this is again A-01 waiting on spikes that wait on A-08 inside the row that waits on A-01. The backlog fixed this at item level (I verified there is no cycle among backlog items). The ledger undid it by grouping.
  - **Mixed roles.** T-011 is owned by the Software Engineer yet includes Arch items (A-01, A-08, M-09 is SQA) and Orch items (A-06). The backlog has "one role per item" and "an author never reviews their own work".
  - **Scope mismatch.** T-011 says "Milestones 1 and 2" and lists D-14, D-16, E-07, M-02 and L-09. Backlog 1.1 puts those in Milestone 3. They are not in the Milestone 2 list.
  - **Evidence gap.** T-031 evidence is "Filled in as each stage completes". The draft commit hash `53bd0d0` and the verified remote hash are not recorded yet. (I verified both, see section 6.)
- **Correction:** split T-011 and T-018 into ledger rows that follow the backlog items (CLAUDE.md section 2 requires a ledger row per task), one role each. Align T-011's scope with backlog 1.1. Record the draft commit and remote hash in T-031. Record this review as the outcome of T-026 only after Phil accepts it.
- **Blocks:** documentation acceptance in the sense that the control document should be consistent. It does not stop the first Milestone 1 task (B-01 or A-08).

**IA-07. The backlog says the threat model is parallelisable with the stack work, but it depends on the stack decision. (Minor, DAB)**
- **Where:** backlog 2 "Parallelisable… the design-stage threat model (M-09) and rendering spike S-05 beside the stack work" versus M-09's dependency "A-01" in the table, and the critical path text (M-09 after A-01).
- **Problem:** A-01 is the stack decision. M-09 cannot run "beside" it if it depends on it.
- **Correction:** either remove M-09 from the parallel list, or change M-09's dependency to A-08 (the shortlist) if a stack-independent threat model is intended. Note D-01 and D-07 depend on M-09.
- **Blocks:** nothing, but fix the sentence before acceptance.

**IA-08. The authentication method has no decision owner or gate. (Minor, blocks nothing in Milestone 1; Milestone 2 precondition)**
- **Where:** architecture 6 and 23 ("Authentication method (passwords, magic links, social sign-in, MFA) is Unresolved"); backlog C-02 ("method decided first", Milestone 2); spec 16 (item 25 covers only the external test and the multi-factor policy).
- **Problem:** the method decision is not an open question in spec 16, not a backlog item, and not a gated item in backlog 2. C-02 assumes it is already made. M-13 decides the policy before real data, not the method before building.
- **Correction:** add the method to spec 16 and to the gated list, or give A-01 the identity-provider choice. It must be decided before C-02.
- **Blocks:** C-02 in Milestone 2.

**IA-09. The security foundations leave out several standard items. (Minor, RDB)**
- **Where:** spec 11, 11.1; architecture 5, 6, 8, 10, 21; backlog M-09, M-03.
- **Problem (evidence: text search across the spec, architecture, backlog and decisions):**
  - No match for TLS or HTTPS. Encryption at rest appears only as crypto-shredding in the architecture 25.4 alternatives.
  - No match for CSRF, XSS or content-security-policy.
  - No match for SSRF, or for isolating the media and file-parsing workers beyond "isolation of processing" (R-12).
  - No dependency or supply-chain scanning of code written by agents.
  - No security-event monitoring or alerting. Observability is "logs, errors, queue health".
  - No key management for the derived tokens: architecture 10 derives QR and link tokens from a keyed hash of the record id and version. A compromised key exposes every re-showable link. A version bump revokes all links for a record at once, and nothing allows revoking one link.
- **Why it matters:** these are the controls whose absence usually causes the first real incident. M-09 (threat model) could catch them, but it is not told to.
- **Correction:** list these as required topics in M-09 and in spec 11.1. Add dependency scanning and a secret scan to A-03 or A-05. State the key-management and per-link revocation approach for D-07.
- **Blocks:** not Milestone 1. Needed before real guest data (M-03, M-13).

**IA-10. Some offline wording reads wider than the design delivers. (Minor, blocks nothing)**
- **Where:** spec 5.7 table, decision 0017 table, backlog L-04, L-06, L-08.
- **Problem:**
  - Event Gallery's fallback is "Organiser-prepared export before the event". Event Gallery is a post-event product, so nothing exists before the event to export. The Gallery's offline minimum ("shell and items already opened are cached") also has no event-time use case at all. It is only useful for a guest on a poor connection after the event.
  - Signature Mosaic and ShareWall minimums say "content cached before the event". Signatures and photos contributed during the event are exactly what these displays show, so a display that loses connection during the event shows only what it cached before the loss, not "before the event". "Cached before connection loss" would be accurate.
  - Lucky Draw's offline minimum is presenting results already drawn online plus queued check-ins, which are Check-in Studio's. This is honest (the table says drawing needs a connection) but thin. Phil's decision says "some offline capability". The wording should not make this read as a Lucky Draw feature.
- **Correction:** reword the Gallery fallback to match its post-event purpose, and "cached before the event" to "cached before connection is lost". State plainly in L-05 that Lucky Draw has no offline draw. Phil can then judge whether this meets "some offline capability" for each product.
- **Blocks:** nothing. It affects what L-01 recommends and what customers are told (L-05).

**IA-11. Milestone 2's start conditions, and the relation between the two sequencing schemes, are not stated. (Minor, blocks nothing in Milestone 1)**
- **Where:** backlog 1 (phases 0 to 5) and 1.1 (milestones 1 to 3); spec 14; items J-12, J-13, C-01, C-02, D-15 in the Milestone 2 list.
- **Problem:**
  - Milestone 2 contains items that depend on unmade founder decisions:
    - J-12 (the ingestion routes are proposals and J-12 has no Phil dependency);
    - J-13 (curation defaults);
    - C-01 (open account-owner points);
    - C-02 (IA-08);
    - D-15 (reference model, "proposed, needs technical and privacy validation").
  - No list names what Phil must decide or accept before Milestone 2 starts. Decision 0001 says he instructs the start, but he is not told what the start needs.
  - The phase table puts D-14, D-16, E-05 to E-07, L-09 and M-02 in phase 1 foundations, which phase 2 products follow. Backlog 1.1 puts the same items in Milestone 3, after the Milestone 2 products. The two schemes are never reconciled.
- **Correction:** add a short "decisions needed before Milestone 2" list. Say that milestones supersede the phase table for sequencing, or reconcile them.
- **Blocks:** nothing now. Needed before Phil is asked to start Milestone 2.

**IA-12. Backlog dependency and ordering nits. (Minor, blocks nothing)**
- **Where:** backlog K-02, F-06, E-06, G-03.
- **Problem:**
  - K-02 ("English (UK) complete for all MVP screens… no missing keys") depends only on K-01. It cannot be accepted until every screen exists, so it is really a late or continuous item.
  - Milestone 2 includes F-06, which covers video capture, while video handling (E-04) is not in Milestone 2.
  - Milestone 2 includes uploads (E-01, E-02) but not E-06 (validation and scanning approach). This is acceptable with synthetic data, but it should be stated.
- **Correction:** state K-02 as a rolling check, or add a dependency on the last UI items. Scope F-06 in Milestone 2 to the capture types needed by the five steps. Note that E-06 is deferred.

**IA-13. Accessibility criteria are mostly testable, with these gaps. (Minor)**
- **Where:** spec 5.11 and decision 0016; backlog A-07, O-08.
- **Problem (I did not verify the WCAG text; I only checked testability as written):**
  - Criteria 1 to 8 give measurable thresholds (contrast, target size, reflow, flash rate).
  - Large public displays have no minimum text size or viewing-distance rule. "Legibility rules still apply" has no measure.
  - The automated check (criterion 9) fails the build on "serious" violations only. The manual assistive-technology check is required before beta (O-08) but not per milestone. The per-product items (F-11 etc.) do require a recorded walkthrough, which helps.
  - Signature capture's alternative to drawing is open. Drawing a signature is inherently hard to do without a pointer.
  - Target level (WCAG 2.2 AA) is labelled proposed, correctly.
- **Correction:** add a display legibility criterion (a minimum size relative to screen height, say) and require an A-07 manual script on the first UI delivered.

### Observations

**IA-14. Provenance of several founder decisions cannot be checked from the repository. (Observation)**
- Decisions 0007 to 0012 say "Decided by: founder (Phil), 2026-10-30" and cite "Phil's decision". The source messages are not in the repository. The consolidation prompt line 34 records them only as the author's note ("Later the same day Phil decided…").
- I verified against prompt files that decisions 0018 (items 1 to 3), 0011 (partly), 0014 (status), 0008 (aggregation and "ingestion routes remain proposals"), the six corrections of `phase-0-final-corrections.md`, and decision 0019 match their sources. I could not verify the wording of 0007, 0009, 0010, 0012 or the enumerated owner-only list in 0011.
- Records 0003, 0004, 0005 are "Decided by: founder (Phase 0 notes)". That treats discovery notes as decisions, which spec 3 explains (P0 items are agreed unless they conflict). It is a convention Phil should confirm.
- I found no instance of a proposal presented as an approved decision, and no approved decision weakened or changed. Spec 3 distinguishes the two clearly.
- **Recommendation:** Phil reads 0007 to 0012 against his own messages once. Cheap, and it is the one check no reviewer can do for him.

**IA-15. The six-role workforce is achievable in principle, with enforcement gaps to test. (Observation)**
- **What I could observe:** this session's own tool description states that agent types come from "`.claude/agents/*.md` frontmatter" with a per-agent model and tools, that a fork inherits context, and that worktree isolation exists. That supports the documents' plan (project-folder subagents, skills, no framework). I did not test it. B-01 and S-12 are the right first checks.
- **Gaps:**
  - "Software Engineer touches only files named in the task" and "Security & QA does not review its own changes" are conventions unless backed by permissions or hooks. `CLAUDE.md` section 9 itself prefers "a check that enforces a rule over a sentence".
  - B-05 (cost per accepted task) assumes the cost data is available. This is unverified.
  - Reviewers that share a model share blind spots. That includes me, and the documents say so (spec 6.4, the fresh-review report section 0).
- **Recommendation:** B-01 should explicitly test (a) tool restriction per subagent, (b) write-path restriction, (c) that a subagent report cannot widen permissions, (d) cost visibility. Add the results to B-02.

**IA-16. `CLAUDE.md` has not changed since 2026-10-29. (Observation)**
- Its state line says documentation only and it does not mention decision 0019, the real-data gate, the monetisation deferral or the free entry point. The spec prevails and I found no conflict, so this is not a defect. But the agents configured in B-02 will be primed from `CLAUDE.md`.
- Editing `CLAUDE.md` is a founder-approval matter. Phil should decide whether to add a short pointer to 0019 and the gate. The earlier review raised the same point (its O-04) and it was not actioned.

**IA-17. Printing implies a payment or fulfilment path the MVP says it will not have. (Observation)**
- J-05 (P2) and the "print order" row in 24.3 imply orders and possibly payment. Decision 0010 says no payment provider in the MVP. J-05 says "provider decision first", so nothing is wrong yet. Make the J-05 provider decision explicitly decide who pays and how, before any print item moves above P2.

**IA-18. The real-data gate is procedural only. (Observation, RDB)**
- Only O-05 and O-06 depend on O-09. Nothing technical stops real guest data entering development or staging, beyond the architecture 27 statement that those environments "never hold real guest data".
- **Recommendation:** an automated guard (environment flag, startup assertion, CI check on data sources) as part of A-03 or A-04, so the rule is enforced, not requested.

**IA-19. Housekeeping. (Observation)**
- Review finding IDs (F-xx, N-xx, O-xx) collide with backlog IDs (F-05) and conflict IDs (C-3 against C-03). The documents disclose this. A distinct prefix per review (as I used) removes the risk.
- The folder is `docs/Reviews/`. An earlier brief referred to `docs/reviews/`. Spec 16 item 11 leaves casing and line endings open. All tracked files use LF (0 CRLF found).
- Validation scripts are not in the repository (disclosed, spec 16 item 11). I re-derived the counts independently with my own script (section 6), so the numbers are right today. Reproducibility from the repository is still not available.

## 3. Verdict by area

1. **Five-product MVP scope: Pass.** The five products are distinct in every document. ShareWall owns photo and video grids, Signature Mosaic owns signatures and drawings, and Event Gallery is post-event (decisions 0002 and 0008). The free entry point is permanent (0009) and appears in spec 1.1, 4.1 and 9, in N-02 and N-09, and in R-06. It is not testable in the MVP, which the documents accept. Monetisation is deferred (0010) with no billing code. D-11 is a recommendation and must not add plan, payment or billing code.
2. **Six-role workforce: Pass with an enforcement gap (IA-15).** Six roles match `CLAUDE.md` in the spec, decision 0003, architecture 17 and the backlog. No document adds a role. Achievability depends on B-01 and S-12, which are the right first steps. File ownership and non-self-review need technical enforcement, not just convention.
3. **Founder decisions versus proposals: Pass.** Spec 3 and the decision index separate accepted from proposed. Proposed: 0006, 0013, 0014, 0015, 0017, the 0008 routes, the 0004 key bindings and operator sessions, the 0016 target level, the milestone lists. I found no proposal presented as approved and no approved decision weakened. I could not verify the wording of 0007 to 0012 against Phil's messages (IA-14). The one recorded boundary that is wrong is C-9 (IA-05).
4. **Security and privacy foundations: Partial.** Tenant isolation, scoped tokens, separate display and control tokens, signed uploads (Proposed), audited support access, a design-stage threat model (M-09), privacy-preserving records (0014, Proposed), incident ownership and the legal documents (M-12) are present. Standard web and infrastructure security topics are missing from the text (IA-09). No legal compliance is claimed anywhere I looked.
5. **Consent withdrawal and revocation: Partial, honestly labelled.** The architecture 24 design (provenance, receipts, `RevocationEvent`, erasure ledger, per-artefact windows, honest limits, tests per artefact) is thorough. All exposure-window values are open and depend on S-13 and Phil. It omits live displays, processors, guest-device caches and the CSV or print list (IA-02). The multi-person item policy (options A to C) and the platform acting on a guest's request (controller or processor model) await legal advice.
6. **Event Gallery ingestion and eligibility: Pass as a design, Proposed.** Eligibility is evaluated when content is shown. Items enter as `pending` and need a recorded consent basis, a valid grant for cross-product content, retention and non-deletion. The organiser-attests default needs legal review. The three routes, curation, audience and the guest upload link are correctly open. J-12 sits in Milestone 2 without a Phil dependency (IA-11).
7. **Offline limitations and claims: Pass with wording gaps.** Capabilities are separated (capture, interaction, cached display, queued sync, live-only). There is a descoping rule. Parity is not claimed. Lease and exposure windows are open and need Phil's acceptance. Guest phones are stated to be outside the lease. Wording gaps are in IA-10.
8. **Lucky Draw integrity: Strong core, Proposed, with one policy gap and one design gap.** Server-side execution, command id plus expected version, frozen snapshot, seed and algorithm id recorded, references not names, a late check-in rule, a held-key rule and a test list are all present and consistent across spec 4.4, architecture 14, decision 0015 and I-02 to I-10. Gaps: unseen re-rolls via reset (IA-03) and one-winner assumption (IA-04). The commitment to the pool hash before drawing is correctly open (0015 item 9).
9. **Accessibility requirements: Pass with gaps (IA-13).** There are nine criteria, a per-product table and per-product backlog items with recorded walkthroughs. The target level and signature alternative are open.
10. **Backlog dependencies, priorities, sizes: Pass with nits.** I computed: 155 rows, 8 columns each, no duplicate IDs, no undefined dependency, no cycle, one role per item. Every non-document implementation item reaches the scaffold A-02. Items without a path to A-02 are decisions, documents or agent configuration (A-01, A-06, A-08, A-09, B-01 to B-07, J-10, L-01, L-05, M-04, M-05, M-08, M-09, M-11, M-12, M-14, N-05, O-02, O-04, O-07, O-10). Priorities are 105 P0, 28 P1, 7 P2, 10 Post-MVP, 3 Gated, 2 Moved. 79 of 105 P0 items belong to the Software Engineer role. P0 items depending on Gated items (J-02, J-03, O-09) are consistent. Nits: IA-07, IA-12.
11. **Milestone sequencing and whether Milestone 1 can start: Yes, with one caveat.** M1 items depend only on M1 and early-track items, and M2 only on M1, M2 and early-track items. I verified this by script. M3 is 94 items, and 12 are Post-MVP or Moved. A-08, B-01 to B-04, A-06, M-08, M-14, O-10 and spikes S-01, S-02, S-05, S-06, S-12 can start immediately. The caveat is the hosted-platform spikes behind A-01 (IA-01). Milestone 2's start conditions are not listed (IA-11).
12. **Unresolved blockers and their classification: Largely correct.** Spec 16 has 27 open items. The documents correctly do not treat most of them as Milestone 1 blockers. Gated items are listed (H-06, J-10, M-11, D-17, M-13, A-09). Missed: the authentication method (IA-08) and the hosted-spike account question (IA-01). Open items that only affect real data or later epics are classified correctly as such.
13. **Contradictions, stale references, links, counts, IDs, ledger evidence: Mostly clean.** Verified clean:
    - 0 broken links across 37 Markdown files;
    - counts of items, spikes, risks, decisions, open questions and milestone sizes match the ledger and change summary;
    - sizes of the two earlier review reports match the summary (28,094 and 31,209 bytes);
    - no stale "S-01 to S-12" or "event owner" in current documents.
    Found: C-9 (IA-05), ledger rows (IA-06), M-09 (IA-07), the Gallery offline fallback (IA-10), ID namespaces (IA-19).
14. **Founder authorisation boundaries: Accurately recorded and not exceeded.** Decision 0019 matches the prompt's included items (scaffolding, agent configuration, spikes, automated checks, synthetic data) and its seven exclusions (production, real guest data, contacting prospects, hiring advisers, material spending, merge into `main`, force-push or history rewrite). It adds clarifications, labelled "for Phil to correct". 0018 matches the final-corrections items 2 and 3. Git evidence shows a single documentation commit pushed to the existing branch only. The remote has no `main`, and local `main` is unchanged at `8957f9b`. The one stale record is C-9 (IA-05).

## 4. The three lists

### A. Documentation acceptance blockers
Small corrections (no Critical or Major finding blocks documentation acceptance):
1. **IA-05** update C-9 and the "Git approval is open" statements to record what Phil authorised and what stays prohibited.
2. **IA-06** make the ledger rows consistent with the backlog (split T-011 and T-018, one role each, align the milestone scope) and record the draft commit and remote hash in T-031.
3. **IA-07** fix the "parallelisable M-09" sentence or the M-09 dependency.

Also needed, not a defect: Phil's own acceptance. This report is a defect finder from a fresh context sharing the authors' model. It is not the founder's approval. Ledger T-026 should record the outcome only after Phil has read it.

### B. Milestone 1 implementation blockers
- **IA-01** (partial). It blocks only the stack decision A-01 and the scaffold and checks behind it (A-02 to A-05, A-07, M-09), and only until the spike method is settled. Settle the local-versus-hosted rule for S-03, S-04, S-11 and S-13, and where spike code lives.
- Nothing blocks starting these Milestone 1 items now: A-08, A-06, B-01 to B-04, M-08 (early track), and spikes S-01, S-02, S-05, S-06, S-12.
- No other Major or Critical finding blocks Milestone 1.

### C. Real-data / private-beta blockers
Items needed before real guest data or the private beta (some are already in the backlog and gated by O-09):
- **IA-02** revocation coverage for live displays, processors, guest-device caches and the print or CSV list.
- **IA-09** the missing security topics, and the external security test and authentication policy decision (M-13).
- **IA-18** a technical guard for the real-data boundary.
- **IA-03** if the beta runs a real draw.
- Already listed in the documents and agreed by me as real-data gates:
  - the adviser's advice (M-04) and the customer-facing legal documents (M-12);
  - retention periods (E-05 values) and the S-13 windows measured and accepted;
  - the lease length accepted by Phil (L-09);
  - the data-subject request runbook exercised (M-10) and the restore test with the erasure ledger (E-07);
  - the incident owner and plan (M-05);
  - the accessibility audit with assistive technology (O-08);
  - the report-content route (H-11);
  - the guest-device limit stated to users;
  - the production hosting and data-location decision (A-09);
  - Phil's decisions on ShareWall consent and takedown (H-06) and on Gallery revocation effects (J-10).

## 5. Recommended first Milestone 1 task

**B-01: the Claude Code capability check, with A-08 (stack and hosting shortlist) run in parallel as a separate task.**

Why B-01 first:
- It has no dependencies and touches no guest data, code or spend.
- It is small (S) and its output is evidence. It tests what the workforce plan assumes (per-agent tool restriction, write-path limits, fresh-context review, cost visibility) before other work is delegated. Every later task, including the spikes and the scaffold, will run through that mechanism.
- It shows whether the "files it may touch" and "does not review its own change" rules can be enforced, which `CLAUDE.md` section 9 prefers to a sentence.
- It exercises the ledger discipline the documents rely on: a row with real evidence, delegated under CLAUDE.md section 4.

Why A-08 in parallel:
- A-08 is the true start of the critical path (A-08, then spikes, then A-01, then the scaffold). It is also dependency-free and code-free.
- Different role (Solution Architect) and different files, so there is no ownership conflict.

Before either starts, do three things:
1. Fix the ledger rows (IA-06) so the tasks exist as individual rows.
2. Resolve the hosted-spike account rule (IA-01).
3. Decide with Phil whether `CLAUDE.md` gets a pointer to decision 0019 and the real-data gate (IA-16). B-02 role definitions will inherit from it.

Do not start with the scaffold. It depends on A-01, which Phil must approve after the spikes.

## 6. Validation performed

All checks read-only. The script is `ia_checks/chk.py` in the OS temp directory, outside the repository. Reproduce by parsing the backlog tables and applying the rules below.

| Check | Method | Result |
|---|---|---|
| Markdown links | Parsed every relative link in 37 `.md` files, resolved the path, checked existence and exact case | 0 broken |
| Backlog structure | Parsed rows beginning `\| X-nn \|` | 155 items; each has 8 columns; no duplicate IDs |
| Priorities, sizes, roles | Counted | P0 105, P1 28, P2 7, Post-MVP 10, Gated 3 (J-10, M-11, M-13), Moved 2. Sizes: S 17, M 79, L 51, XL 6 (the 2 Moved rows are n/a). Roles: SE 114, Orch 10, SQA 10, Strat 8, Arch 7, Res 4 (79 of the 105 P0 items are SE) |
| Dependency targets | Extracted item and spike IDs from the Depends column | All defined. Non-ID text appears only for Phil (H-06, J-05, J-10, K-07, N-01) and "products" (O-05) |
| Cycles | Depth-first search over backlog items | None. Longest chain 14 |
| Milestone lists | Parsed 1.1 and checked each item's dependencies | M1 (13 items) depends only on M1 and early-track items; M2 (31 items) only on M1, M2 and early-track items; M3 is 94 items; Post-MVP or Moved are 12 |
| Gated items in milestones | Checked M1 and M2 for Gated, Post-MVP, Moved or Phil-dependent items | None, apart from J-12 and C-01 whose Phil-dependent decisions are only mentioned in text (IA-11) |
| Items behind M-04 and O-09 | Direct and transitive dependents | Direct on M-04: A-09, M-12, O-06, O-07, O-09. Transitively behind O-09: O-05, O-06 only. Matches the change summary |
| Items with no path to A-02 | Reachability over dependencies | Only decisions, documents and agent-configuration items (list in verdict 10) |
| Undefined backlog IDs referenced in prose | Searched all documents | Only review-finding IDs F-13 to F-24 and N-11, which belong to other namespaces (IA-19) |
| Spikes and risks | Counted | S-01 to S-13 (13); R-01 to R-26 (26) |
| Spec section 16 | Counted numbered items between section 16 and 16.1 | 27, as the ledger says |
| Decision records and index | Compared each file's Status and Decided-by line with the index | 19 records, all indexed; statuses agree with the index text |
| Stale wording | Searched for "S-01 to S-12", "event owner", "nine-role", "four products", old counts | No stale instance in current documents. Matches are in history or explanation, for example the conflict register and the earlier review reports |
| Founder decisions against source | Compared decisions 0018, 0019, 0008 (aggregation, routes as proposals) and the six corrections with `phase-0-final-corrections.md` and the acceptance prompt | Agree. Others could not be verified (IA-14) |
| Security topic search | Searched for TLS, HTTPS, CSRF, XSS, CSP, SSRF, vulnerability, dependency scan, at rest | No matches (IA-09) |
| Secrets and personal data | Searched `CLAUDE.md` and `docs` for email addresses, key patterns, private-key headers, password or api-key assignments | 0 matches |
| Line endings | Checked all tracked files for CR characters | 0 files with CRLF |
| Earlier-report sizes | Compared with the change summary | 28,094 and 31,209 bytes, as stated |

**Not verified:** external facts (law, WCAG, Meta, vendor limits); Claude Code feature behaviour beyond what this session's tool description states; Phil's original messages; whether any commit content beyond file names is sensitive (I read every document in full instead); whether the remote's GitHub repository state differs from what `ls-remote` returned.

**Git state observed (read-only):**
- Branch `docs/update-master-spec`, HEAD `53bd0d0a469e1be3dbef774bed182fb19d2c54ce`, "docs: Phase 0 planning documentation (draft, awaiting independent review)". Status clean, and it tracked `origin/docs/update-master-spec` at the same hash.
- `git ls-remote origin` returns exactly one ref, `refs/heads/docs/update-master-spec` at `53bd0d0…`, plus `HEAD`. That confirms the remote branch is at the commit. There is no remote `main`. Local `main` is at `8957f9b`, with its upstream shown as gone. `origin/HEAD` points at the docs branch.
- The commit has 33 files, 3,933 insertions and 37 deletions. All paths are under `docs/`, and none are generated or temporary files.
- Commit history: `8957f9b`, `7b395a0`, `cee73a3`, `53bd0d0`. There is no sign of a force-push or history rewrite.
- 37 tracked files before this report was added.

## 7. Final recommendation

**Accept with changes** as the Phase 0 planning baseline. For Phil to decide.

1. **Before accepting the baseline** (small edits): IA-05 (C-9), IA-06 (ledger rows and T-031 evidence), IA-07 (M-09 sentence). Then record the outcome of T-026 in the ledger after Phil has read this report and decided. I recommend he also check decisions 0007 to 0012 against his own messages (IA-14), because no reviewer can.
2. **Before Milestone 1 spikes S-04, S-11 and S-13 start:** settle the local-versus-hosted rule and where spike code lives (IA-01). This is the only thing I found that could stall or breach a boundary during Milestone 1. Everything else in Milestone 1 can start now, with B-01 and A-08 first (section 5).
3. **Before the related epics:** IA-03 and IA-04 (Lucky Draw) before I-02; IA-08 (authentication method) and IA-11 (Milestone 2 start conditions) before Milestone 2; IA-02, IA-09 and IA-18 before any real guest data.
4. **Do not treat this as the founder's approval, and do not treat my independence as complete.** I share a model with the authors, I was scoped by a caller close to the authoring line, and I could not read the founder's original messages.

No legal compliance is established by the documents or by this review.

## Re-check addendum

Written after the report above, at the coordinator's request, by the same fresh-context subagent. The sections above are unchanged. I re-read the edited files from disk and used read-only Git. The edits sit in the working tree on top of commit `53bd0d0`.

1. **IA-05 (C-9): verified fixed.** Spec section 1, the 16.1 preamble and the C-9 row now record what `phase-0-independent-acceptance-and-checkpoint.md` authorises:
   - a documentation draft commit, and a push of the existing `docs/update-master-spec` branch only;
   - a final checkpoint commit and push after the review.

   They keep the prohibitions: merge into `main`, pushing `main`, force-push, history rewrite, production deployment. "Pushing `main`" comes from `CLAUDE.md` section 5, not from that prompt, but it is consistent with it. I found no overstating or understating. Spec section 15 lists both new files and their links resolve.
2. **IA-06 (ledger): verified fixed, with two new Minor points.**
   - **Circularity.** At row level the old circularity is gone for S-03, S-04, S-11 and S-13. T-011 (A-01) depends on T-032 and T-018, T-018 depends on T-032, and T-032 depends on nothing. No undefined T-IDs and no cycle.
   - **Roles and scope.** Each Milestone 1 row has one role. T-010 is Orch (B-02, B-03, A-06). T-011, T-032, T-038 are Arch. T-033 is SE (A-02 to A-05, A-07). T-034 and T-039 are SQA. The 13 backlog section 1.1 items are all covered, and dependencies match the backlog (A-02 on A-01, M-09 on A-01, B-02 on B-01, B-04 on B-02).
   - **T-031.** It records `53bd0d0a469e1be3dbef774bed182fb19d2c54ce`, and `git rev-parse` and `ls-remote` just now confirm that hash on the remote branch, with no remote `main`.
   - **T-026.** It says "in verification" and "not marked accepted". It does not claim acceptance.
   - **Rows depending on T-035.** T-012 to T-017, T-020 and T-036 are sensible sequencing, because T-035 is the Milestone 2 row.
   - **New problem A (Minor): a row-level cycle through S-09.** T-018 covers all of S-01 to S-13. S-09 (and S-07) need the front-end stack, so they need A-01, which sits in T-011, which depends on T-018. The risk is real. Split T-018 so that only S-03, S-04, S-11 and S-13 sit before T-011.
   - **New problem B (Minor): row scope and consistency.** T-035 mixes roles because the Milestone 2 list includes O-01, an SQA item. It also overlaps T-012 and T-016, which share items such as F-01 and J-12 and now depend on it. T-006 evidence still says "not independently reviewed" beside a Blocker saying the review is done.
3. **IA-07 (M-09 sentence): verified fixed.** Backlog section 2 now says M-09 starts after A-01 and before D-01 and D-07. That is consistent with M-09's dependency on A-01 and with the critical-path text.
4. **Files changed since the reviewed commit: verified.**
   - `git status` and `git diff --stat 53bd0d0` show exactly three modified tracked files: `docs/MVP-MASTER-SPEC.md` (8 lines), `docs/planning/MVP-DELIVERY-BACKLOG.md` (1 line) and `docs/task-ledger.md`.
   - Two files are untracked: this report and `docs/prompts/milestone-1-first-task-proposal.md`.
   - Nothing else differs, and nothing is staged.
5. **First-task proposal (B-01): within authorisation, with one gap (Minor).**
   - It stays inside decision 0019 and states its exclusions: no real data, spend, accounts, `main`, force-push, commit or push, and no changes to `CLAUDE.md`.
   - It uses the Arch role, requires a separate reviewer, and treats the subagent report as data.
   - B-01 is a sound first task.
   - The gap: tests 1 and 2 (tool and write-path restriction) need a test subagent definition. The proposal forbids adding agent definitions to the repository but does not say where the test definitions live. A user-global `~/.claude` change would reach outside the repository. Add: use inline or temporary definitions, remove them afterwards, and change no settings or permission files.
6. **New problems from the edits:** the two Minor ledger points under item 2 and the Minor proposal gap under item 5. The other checks came back clean:
   - 0 broken links across 39 Markdown files;
   - the ledger has 39 unique rows with 9 columns each;
   - the ledger's counts agree with the report: 0 Critical, 3 Major, 10 Minor, 6 Observations.

   Nothing is accepted on the founder's behalf.

**Updated recommendation:** accept with changes. The three documentation-acceptance blockers (IA-05, IA-06, IA-07) are now fixed. Fix the T-018 split before Milestone 1 tasks are delegated, and Phil must still read the report and decide.

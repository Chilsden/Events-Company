# MVP Technical Risks and Spikes

- **Version:** draft 0.3, 2026-10-30 (applies Phil's final corrections of 2026-10-30; responds to the independent review report's findings F-02 to F-12, which are report IDs, not backlog items; its finding F-01 stays open)
- **Status:** proposal. The [master spec](../MVP-MASTER-SPEC.md) prevails. The [architecture](../architecture/MVP-TECHNICAL-ARCHITECTURE.md) and [backlog](MVP-DELIVERY-BACKLOG.md) refer to the IDs here.
- A **spike** is a time-boxed investigation that ends in a written, evidence-based answer. It is not implementation. No spike has been run; all answers below are open.
- Priority and likelihood labels are the author's judgement, not measurements.
- Spikes use synthetic data and free or already-approved tooling. Any paid service, live data or external account needs Phil's approval first (`CLAUDE.md` section 8).

## 1. Summary

| ID | Topic | Priority | Blocks implementation? | Feeds |
|---|---|---|---|---|
| S-01 | Offline capture and sync, per product, and the offline pack lease | High | Sets the per-product offline minimum ([0017](../decisions/0017-minimum-offline-capability-per-product.md)); does not block the core | 0007, 0017, L-01, F-10, L-03 to L-09 |
| S-02 | Multi-device conflict handling | High | Blocks the check-in sync design | F-04, F-05, L-01 |
| S-03 | Real-time displays and updates | High | Blocks the stack decision and displays | A-01, D-10 |
| S-04 | Media upload and processing at event scale | High | Blocks the stack and storage design | A-01, E-01 to E-04 |
| S-05 | Rendering, animation and media transformation (Signature Mosaic and ShareWall grids) | High | Blocks the shared rendering library and video scope | D-12, H-09, E-04 |
| S-06 | Lucky Draw state machine, randomness, concurrency, audit evidence | High | Blocks Lucky Draw implementation | I-02, I-05, I-10 |
| S-07 | AI moderation | Medium | Blocks AI moderation only | H-05 |
| S-08 | Instagram API eligibility and limits | Low | **Never blocks** the MVP (decision 0005) | H-07 |
| S-09 | Internationalisation and translation | Medium | Does not block launch (English UK, decision 0012); informs later languages | K-05, K-07, K-08 |
| S-10 | Data protection, consent, erasure and data map | High | Begins early (decision 0018). Feeds the real-data gate (O-09); does **not** block development with synthetic data. Real guest data, ShareWall consent rules and AI features wait for its outputs | D-04, D-15, H-06, M-04, M-08, O-09 |
| S-11 | Storage, bandwidth and hosting costs | High | Blocks the hosting decision; informs post-MVP pricing | A-01, D-11, N-05 |
| S-12 | Agent orchestration, tool permissions, reliability | High | Blocks reliance on agent automation | B-01 to B-04 |
| S-13 | Revocation propagation: signed links, caches, exports, backups | High | Blocks the revocation design values and the hosting decision | D-14, E-01, E-07, A-01 |

Order (recommendation): the stack shortlist (A-08) first, then S-03, S-04, S-11, S-13 and S-05, which feed the stack decision (A-01). S-10, with the data map (M-08) and adviser preparation (M-14), begins early in parallel because it feeds the real-data gate (O-09). S-12 runs in parallel from the start. S-01 and S-02 set the per-product offline scope that Phil approves. S-06 runs before Lucky Draw. S-07 and S-09 follow the stack. S-08 runs last and never gates anything.

## 2. Spikes

### S-01 Offline capture and sync, per product
- **Question:** What can each of the five products capture, cache, queue and sync with no connection, on the browsers and devices organisers actually use? Start with Check-in Studio, then ShareWall submissions, cached display for Signature Mosaic, ShareWall and Event Gallery, and queued entries for Lucky Draw.
- **Why it matters:** All five products should have some offline capability, subject to limits and feasibility (decision 0007). Venues often have poor connectivity. The cost is unmeasured.
- **Experiment:** Prototype a browser local queue with idempotent sync against a stub server. Test on a small set of real devices and browsers, including loss of connection mid-scan, browser restart, storage limits and a long outage. Repeat the relevant parts for each product's offline behaviour. Record which functions need a connection.
- **Expected output:** A per-product note listing what worked, what failed, the limits to show organisers and what it would cost to build, plus a recommended scope for Phil to approve (backlog L-01). It states whether each proposed minimum in spec 5.7 is feasible, a safe lease length, and what is stored on the device.
- **Dependencies:** A stub server only; none on the stack decision.
- **Risk if unresolved:** The offline scope is set without evidence, parity is implied, or the architecture quietly rules offline out.
- **Blocks implementation?** No for the core MVP. It sets the scope of F-10, L-03 and L-04.

### S-02 Multi-device conflict handling
- **Question:** Does "latest update wins" give correct, understandable results for guest edits and check-ins from several devices, given unreliable device clocks?
- **Why it matters:** Silent overwrites lose check-in data and break Lucky Draw entries.
- **Experiment:** Simulate several devices with skewed clocks and delayed uploads editing and checking in the same guests. Compare ordering by server receive time, device time, and logical counters. Check the audit trail is complete and an organiser can see what happened.
- **Expected output:** A definition of "latest" for each kind of data, with test cases, and a list of fields where another rule is needed.
- **Dependencies:** S-01 for the offline case. The online multi-device case can run first.
- **Risk if unresolved:** Duplicate or overwritten check-ins; draw pools that are wrong.
- **Blocks implementation?** Blocks the check-in sync design (F-04, F-05).

### S-03 Real-time displays and updates
- **Question:** Which mechanism keeps several displays and control sessions in step with acceptable delay and recovery, and what does it cost to run?
- **Why it matters:** Signature Mosaic, ShareWall and Lucky Draw all depend on live displays.
- **Experiment:** Compare two or three options from the architecture (section 7) with a simple prototype: many display clients, flaky connections, reconnects, server restarts. Record latency, recovery behaviour and operating effort. Check each against the chosen hosting option.
- **Expected output:** A recommendation with measured results and the main trade-offs.
- **Dependencies:** Candidate options from the shortlist (A-08); S-11 for cost.
- **Risk if unresolved:** Displays that freeze or show stale state in front of an audience.
- **Blocks implementation?** Yes: it feeds A-01 and D-10.

### S-04 Media upload and processing at event scale
- **Question:** Can the platform accept many simultaneous guest uploads from mobile networks and process them quickly enough, at a cost we can afford?
- **Why it matters:** Bursts at events define the user experience and the cost.
- **Experiment:** Simulate a burst of uploads of typical photo sizes (and short video, if in scope) using resumable uploads. Measure completion, error and retry rates, processing time and worker load. Test limits and failure modes.
- **Expected output:** Observed numbers, a recommended upload and processing design, and default limits to propose.
- **Dependencies:** Candidate storage and worker options from the shortlist (A-08); synthetic sample media.
- **Risk if unresolved:** Failed uploads at live events; runaway processing cost.
- **Blocks implementation?** Yes: it feeds A-01 and E-01 to E-04.

### S-05 Signature Mosaic animation and media transformation
- **Question:** Can the browser render the target compositions smoothly on common display hardware, and which transformations or video effects are feasible? Signature Mosaic compositions (signatures and drawings forming numbers, shapes and logos) and ShareWall photo and video grids both use the shared rendering library, so both are tested.
- **Why it matters:** The visual result is the product. The discovery examples (a glowing number and a tree shape for Signature Mosaic; a portrait grid for ShareWall) must not be promised before they are shown to work.
- **Experiment:** Build the three discovery examples as throwaway prototypes with synthetic content. Measure frame rate and memory on a few real display machines. Try a short-video case and record what is not feasible.
- **Expected output:** A feasibility note per example, the shared library approach, and the video scope for the MVP (ShareWall grids and capture).
- **Dependencies:** None; can start now.
- **Risk if unresolved:** Promised visuals that stutter or do not work; wasted rework.
- **Blocks implementation?** Yes for the shared rendering library (D-12), ShareWall grids (H-09) and the video scope (E-04).

### S-06 Lucky Draw randomness, concurrency and audit evidence
- **Question:** What selection method and evidence format give a fair, reproducible-to-audit and tamper-evident draw, and does the planned state machine hold under concurrent and repeated requests? Can any offline behaviour keep the same guarantees, or must execution stay online?
- **Why it matters:** The draw's fairness is central to trust, and a silent redraw must be impossible.
- **Experiment:** Prototype the round state machine (architecture section 14) with a secure server-side random source, a hashed pool snapshot and recorded seed. Fire concurrent, repeated and reconnecting requests, held keys, stale versions, late check-ins and delayed offline syncs. Recompute a result from the seed as an auditor would. Erase a participant and check the evidence still verifies. Review the evidence export with an independent reviewer.
- **Expected output:** Chosen method (for Phil's approval), evidence format, and a passing integrity suite design.
- **Dependencies:** None on the stack beyond a database that supports atomic transitions.
- **Risk if unresolved:** Disputed draws; duplicate winners; lost trust.
- **Blocks implementation?** Yes for I-02.

### S-07 AI moderation
- **Question:** Is AI-assisted flagging accurate, fast and affordable enough to help moderators, and what content goes to which provider?
- **Why it matters:** Live walls need fast moderation, but errors in either direction (missed or wrongly flagged content) matter, and content leaves our systems.
- **Experiment:** Test one or two options on a small synthetic and licensed image/text set. Record the miss rate, false-flag rate, latency and per-item cost (using published prices checked at the time, with dates).
- **Expected output:** Measured results, a go/no-go on AI assistance, and the privacy conditions.
- **Dependencies:** S-10 for what content may be sent. Paid services need Phil's approval.
- **Risk if unresolved:** Manual-only moderation (acceptable for launch), or a harmful AI default.
- **Blocks implementation?** Only H-05.

### S-08 Instagram API eligibility and limitations
- **Question:** What does Meta's official API actually allow for hashtag retrieval, for which account types, and what review is needed?
- **Why it matters:** The notes assume limits that have not been checked. The feature is optional and must not hold up launch.
- **Experiment:** Read Meta's current official documentation and record URLs and access dates. Identify eligibility, permissions, app review and rate limits. Do not scrape or use unofficial methods.
- **Expected output:** A short note: what is possible, what is not, review effort, recommendation (ship, defer, drop).
- **Dependencies:** None.
- **Risk if unresolved:** Wasted effort or a promise to customers that cannot be kept.
- **Blocks implementation?** **No.** It never blocks the MVP.

### S-09 Internationalisation and translation
- **Question:** Does the planned approach handle the later-language scripts, long strings and regional formats, and what would translation of UI and user content cost?
- **Why it matters:** English (UK) is the launch language and localisation is progressive (decision 0012). The foundation must make adding Chinese, Korean, Thai and European languages a translation task, not a rewrite.
- **Experiment:** Render sample screens with pseudo-localisation and with Simplified Chinese, Korean and Thai text. Check fonts, wrapping and date/number formats. Price a translation workflow (human, machine) using dated published prices.
- **Expected output:** The engineering rules for strings and fonts, and a recommendation on the order of later languages for Phil.
- **Dependencies:** Front-end stack choice (A-01).
- **Risk if unresolved:** Broken layouts in some scripts; expensive retrofits.
- **Blocks implementation?** No. It does not block launch or the English build.

### S-10 Data protection and consent
- **Question:** What consent, notice, retention, controller/processor and international-transfer arrangements are needed for guest data, photos, video, signatures, children's data and marketing messages?
- **Why it matters:** Several products collect sensitive data. Documenting requirements is not compliance.
- **Experiment:** Prepare a data map (what is collected, why, where it goes, how long it stays) and a question list. Preparing the map and the question list is authorised. Engaging a qualified UK privacy adviser to review them needs Phil's approval.
- **Expected output:** A data map, written advice, and consent, retention and erasure rules to implement, covering: withdrawal and revocation, items showing several people, pseudonymised records, data location, children's data, public-upload content duties and accessibility duties.
- **Dependencies:** Product behaviour from the spec; provider choices.
- **Risk if unresolved:** A launch that cannot lawfully collect or keep data; rework in ShareWall and capture.
- **Blocks implementation?** Feeds the real-data gate (O-09). It does **not** block the repository scaffold, the spikes or development with synthetic data. It blocks real guest data and the private beta, and it is an input to Phil's decisions on ShareWall consent and takedown (H-06). Advice is external; compliance is not claimed.

### S-11 Storage, bandwidth and hosting costs
- **Question:** What does a typical and a large event cost to host (storage, processing, egress, real-time, email), and which hosting option fits?
- **Why it matters:** Hosting cost shapes the stack and hosting decision now. Pricing is deferred until after the MVP (decision 0010), but these numbers are the evidence future pricing, the permanent free Check-in Studio entry point (0009) and any usage limits will need.
- **Experiment:** Build a cost model from dated, published provider prices and the measured numbers from S-03 and S-04. Run low, typical and high event scenarios. Include the cost of keeping a free Check-in Studio entry point.
- **Expected output:** A cost-per-event model with assumptions and sensitivity, and a view on whether the MVP needs technical usage caps for abuse or cost protection.
- **Dependencies:** S-03, S-04, candidate hosts from the shortlist (A-08).
- **Risk if unresolved:** A hosting choice that is too costly, and later pricing set without data.
- **Blocks implementation?** Blocks the hosting decision (A-01). Informs, but does not block, post-MVP pricing.

### S-12 Agent orchestration, tool permissions and reliability
- **Question:** How reliably do the six roles work as native subagents and skills in the installed Claude Code, and can permissions be kept narrow?
- **Why it matters:** The workforce is an MVP workstream. Over-trust or over-complication is the main risk.
- **Experiment:** Check the installed capabilities (B-01). Run a small trial task per role with a defined remit, file ownership and acceptance criteria. Record failures, wrong claims, scope creep, permission prompts and cost. Include a seeded defect for the reviewer to catch and a hostile instruction inside input text to confirm it is ignored.
- **Expected output:** An observed-results table per role, cost per accepted task, and proposed autonomy changes for Phil.
- **Dependencies:** None; can start now.
- **Risk if unresolved:** Agents that overreach, claim unverified work, or run up cost.
- **Blocks implementation?** Blocks relying on agent automation, not the plan itself.

### S-13 Revocation propagation: signed links, caches, exports, backups
- **Question:** What exposure windows can the chosen platform actually deliver when consent is withdrawn or a grant is revoked: signed-link lifetime, edge-cache purge or versioning, export invalidation, offline pack expiry and restore from backup with the erasure ledger re-applied?
- **Why it matters:** the design in architecture 24 promises a bounded exposure window for each artefact, but the values depend on the platform and have not been measured.
- **Experiment:** On candidate platforms, issue signed links with different lifetimes, revoke, and measure how long each still works. Test cache behaviour with and without versioned keys. Generate an export, revoke an included item, and check the file is removed. Restore a backup on a test environment and confirm the ledger is re-applied before access. Use synthetic media only.
- **Expected output:** Measured windows per artefact, a recommended link lifetime and propagation deadline for Phil to approve, and any artefact that cannot meet the design.
- **Dependencies:** Candidate hosting options from the shortlist (A-08); S-04 for storage behaviour.
- **Risk if unresolved:** The product claims a revocation guarantee the platform cannot give.
- **Blocks implementation?** Yes for D-14, E-01 and E-07, and it informs the hosting decision.

## 3. Wider technical risks

| ID | Risk | Likelihood | Impact | Mitigation | Related |
|---|---|---|---|---|---|
| R-01 | Tenant isolation fails through a missed scope | Medium | High | Central data-access layer, row-level security if available, cross-tenant tests | D-01, O-01 |
| R-02 | Token leaks or misuse gives unintended access | Medium | High | Scoped, hashed, expiring, revocable tokens; display never controls | D-07 |
| R-03 | Silent redraw or duplicate winner | Low | High | Atomic transition, idempotency, stored result, integrity suite | I-02, I-08 |
| R-04 | Live display freezes at an event | Medium | High | Reload-current-state design, readiness check, tested reconnects | D-10, F-09 |
| R-05 | Upload failures on mobile networks | High | Medium | Resumable uploads, retries, clear errors | E-02 |
| R-06 | Hosting costs are unknown, and a permanent free Check-in Studio entry point could become expensive | Medium | High | S-11, per-event usage records, retention, a view on usage caps | D-11, M-07 |
| R-07 | Legal or privacy issue found late | Medium | High | Early S-10 and adviser review | M-04 |
| R-08 | Scope creep from the nine-role or four-product notes | Medium | Medium | Authority rule and conflict register in the spec | Spec 16.1 |
| R-09 | Modular boundaries erode | Medium | Medium | Enforced module interfaces, review | 0006 |
| R-10 | Founder review becomes the bottleneck | High | Medium | Small tasks, evidence-based reports, batch decisions | Spec 8 |
| R-11 | Unverified source claims drive decisions | Medium | Medium | Claim labels, dated primary sources | `CLAUDE.md` 7 |
| R-12 | Malicious or malformed uploads | Medium | High | Validation, scanning decision, isolation of processing | E-06 |
| R-13 | Event Gallery shows or serves content that is no longer eligible (revoked grant, withdrawn consent, rejected or deleted source), including through signed links, caches and exports | Medium | High | Eligibility evaluated when shown; propagation service; short link lifetime; versioned keys; S-13 measures the windows; tests per artefact | J-01, J-08, D-14, S-13 |
| R-14 | Design shortcuts make monetisation hard to add later | Medium | Medium | Usage records, one product-access interface, review against decision 0010 | D-11 |
| R-15 | An event collaborator can perform an account-owner-only action | Low | High | Server-side checks; tests for each owner-only action | C-01, D-01 |
| R-16 | Offline scope is oversold, or offline weakens Lucky Draw integrity | Medium | High | Per-product limits stated (L-05); I-08 must pass with any offline design | L-01, L-04, I-08 |
| R-17 | ShareWall and Event Gallery blur into one product in design or code | Medium | Medium | Separate modules and permissions; content only through grants; the rendering library is a platform item (D-12) | 0002, 0008, D-12 |
| R-18 | Accessibility is retrofitted late and fails the criteria | Medium | High | Baseline and CI check from the start (A-07); per-product criteria; assistive-technology audit before beta (O-08) | A-07, O-08 |
| R-19 | Erasure and retention cannot be reconciled with backups or with draw and audit evidence | Medium | High | Reference model (D-15); erasure ledger re-applied on restore (E-07); retention periods set with legal advice (E-05) | D-15, E-07, M-04 |
| R-20 | Personal data is exposed on a lost, shared or never-reconnecting offline device | Medium | High | Minimal expiring packs, wipe at contact, documented exposure window Phil accepts (L-09) | L-09, D-08 |
| R-21 | Customer or legal findings arrive after products are built and force rework | Medium | High | Discovery and legal preparation begin early; real guest data and the private beta wait for the real-data gate (O-09); features that depend on advice are built behind configuration (architecture 27) | O-02, M-04, O-09 |
| R-22 | A late check-in, repeated key or second operator undermines trust in a draw | Medium | High | Snapshot cut-off, command preconditions, locked controls, integrity suite (I-08, I-10) | I-02, I-08, I-10 |
| R-23 | Public uploads contain illegal or abusive content and there is no fast route to report and remove it | Medium | High | Report route and removal process (H-11), legal advice (M-04), rate limits (D-16) | H-11, M-04, D-16 |
| R-24 | Operator control sessions widen the attack surface | Low | Medium | Scoped capability allow-list, expiry, revocation, audit (D-17); not built until Phil approves | D-17 |
| R-25 | Development with synthetic data drifts from real conditions (formats, volumes, behaviour) and real-data rework is larger than expected | Medium | Medium | Realistic synthetic generator (A-04); real-event validation in the private beta; data-dependent features behind configuration | A-04, O-05 |
| R-26 | The reference data model (decision 0014) fails technical or privacy validation after it has been built | Medium | High | Validate with synthetic data early (D-15 acceptance); keep the identity split behind a thin layer; adviser review before real data | D-15, O-09 |

## 4. Assumptions and limits

- No spike has run, so none of these answers is known.
- Likelihood and impact labels are judgement, to be revisited with evidence.
- The register assumes the spec's decisions, including those Phil made on 2026-10-30. If a decision changes, update the affected spikes and backlog items.
- Spikes and development with synthetic data do not wait for legal/privacy approval (decision 0018).

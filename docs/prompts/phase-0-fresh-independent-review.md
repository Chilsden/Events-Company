# Phase 0 — Fresh Independent Review

## Objective

Perform an independent review of the Events Company Phase 0 documentation and the corrections made in response to the first review.

You are acting as an independent reviewer. Do not rely on conclusions from the authoring session.

This is a review-only task. Do not modify existing planning documents or implement application code.

## Step 1 — Read the repository

Read the following documents in full:

- `CLAUDE.md`
- `docs/MVP-MASTER-SPEC.md`
- All records in `docs/decisions/`
- `docs/architecture/MVP-TECHNICAL-ARCHITECTURE.md`
- `docs/planning/MVP-DELIVERY-BACKLOG.md`
- `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md`
- `docs/task-ledger.md`
- `docs/Reviews/phase-0-independent-review-report.md`
- `docs/Reviews/phase-0-review-response.md`

Inspect the working tree without modifying it.

## Step 2 — Verify previous findings

Independently assess every finding in the original review.

For each finding, classify it as:

- Resolved
- Partially resolved
- Unresolved
- Requires founder decision
- Requires technical validation
- Requires legal advice

Do not accept the author's resolution claims without checking the underlying documents.

Pay particular attention to:

1. Consent withdrawal and revocation.
2. Anonymous contributions and guest rights.
3. Signed URLs, caches, exports and backups.
4. Offline personal-data exposure.
5. Audit records and data erasure.
6. Event Gallery ingestion and content eligibility.
7. Cross-product grants and permissions.
8. Lucky Draw state transitions and concurrency.
9. Accessibility requirements.
10. Data retention, recovery and deletion.
11. Offline scope and fallback options.
12. Early customer discovery and legal/privacy review.

## Step 3 — Review the complete MVP

Verify that the MVP includes:

- Check-in Studio, with a permanent free entry point.
- Signature Mosaic.
- ShareWall.
- Lucky Draw.
- Event Gallery as a distinct post-event product.
- The six agreed AI agent roles.

Confirm that monetisation implementation is deferred until after MVP.

Assess whether the architecture and backlog are realistic for a solo founder supported by Claude Code agents.

Identify unnecessary complexity, missing dependencies and critical implementation risks.

## Step 4 — Check delivery readiness

Separate findings into three categories:

### A. Blocks documentation acceptance

Problems that must be corrected before accepting the planning baseline.

### B. Blocks implementation

Decisions or technical work required before starting a particular implementation epic.

### C. Blocks real customer data or private beta

Legal, security, privacy, operational or product requirements that must be completed before handling real guest data or conducting a private beta.

Do not classify every unresolved question as an immediate implementation blocker.

## Step 5 — Review technical decisions

Assess the proposed architecture without assuming it is approved.

Identify:

- Decisions the founder must make now.
- Decisions that can follow technical spikes.
- Decisions that can wait until implementation.
- Decisions that can wait until after MVP.

Recommend sensible defaults where possible, but do not record them as approved.

## Step 6 — Validation

Independently check:

- Document links and references.
- Decision and backlog identifiers.
- Backlog dependencies.
- Contradictions between documents.
- Task ledger status and evidence.
- Unresolved review findings.
- Reproducibility of validation evidence.
- Scope creep.
- Git status.

Do not modify files to fix issues.

## Step 7 — Write report

Create only:

`docs/Reviews/phase-0-fresh-independent-review-report.md`

The report must include:

1. Executive summary.
2. Findings from the original review and their current status.
3. New critical or major findings.
4. Documentation acceptance blockers.
5. Implementation blockers.
6. Private-beta blockers.
7. Founder decisions required now.
8. Decisions that can safely wait.
9. Recommended first implementation tasks.
10. Final recommendation: accept, accept with changes, or reject.

Do not overwrite the original review report.

## Restrictions

- Do not change existing specifications, decisions, architecture, backlog or task ledger.
- Do not implement application code.
- Do not stage, commit or push.
- Do not merge or deploy.
- Do not invent founder approvals.
- Do not claim legal compliance has been established.
- Do not mark your own work as independently reviewed.

Report exactly what you inspected and verified.
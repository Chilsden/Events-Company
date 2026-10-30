# Phase 0 — Final Corrections and Delivery Readiness

## Objective

Correct the remaining Phase 0 documentation contradictions and prepare the repository for independent review and approval.

Do not implement application code.

## Founder decisions

Record the following as approved:

1. Event Gallery is a distinct post-event product. It must aggregate eligible content from Check-in Studio, ShareWall, organisers and photographers. The three proposed technical ingestion routes remain proposals, not approved implementation decisions.

2. Repository scaffolding, architecture spikes, agent development and implementation using synthetic data may proceed before legal/privacy approval.

3. Legal/privacy review and customer discovery should begin early. Preparing research, adviser shortlists and outreach drafts is authorised. Hiring advisers, spending money and contacting prospects require separate founder approval.

4. Account owners and event collaborators are distinct. The account owner controls account-level actions and permanent event deletion. Event collaborators can manage ordinary event operations.

5. Decision 0014 is a proposed reference data model requiring technical and privacy validation, not an approved final implementation.

6. All five products and the six-role agent workforce remain MVP scope. The existing P0 list is not automatically a commitment to implement all items before the first usable release.

## Corrections

Read the complete repository instructions and planning documents before editing.

Correct:

- The circular dependency between A-01 and spikes S-03/S-13.
- Missing dependencies on A-02.
- Missing privacy and threat-model dependencies.
- Incorrectly labelled founder decisions.
- Inconsistent ShareWall gating.
- The signed-upload architecture status.
- The stale S-01 to S-12 reference.
- Ambiguous account-owner versus event-collaborator terminology.
- Overly broad development gates.
- Other directly related contradictions identified in the latest review.

Do not silently resolve unrelated product, legal or technical questions.

## Delivery milestones

Update the backlog and roadmap to distinguish:

### Milestone 1 — Development foundation

- Repository scaffold.
- Claude Code agent capabilities.
- Technical architecture spikes.
- Synthetic test data.
- Automated checks.

### Milestone 2 — First end-to-end experience

- Create event.
- Register/check in guest.
- Capture signature.
- Display Signature Mosaic.
- View eligible content in Event Gallery.

### Milestone 3 — Complete MVP and private beta

- All five products.
- Agreed offline capabilities.
- Security and privacy controls.
- Accessibility.
- Operational readiness.
- Real-event validation.

Do not remove approved MVP scope when sequencing milestones.

## Review readiness

Update the master specification, decisions, architecture, backlog, risk register and task ledger consistently.

Prepare a short change summary identifying:

- Corrections completed.
- Decisions still proposed.
- Tasks that can start with synthetic data.
- Tasks blocked by legal/privacy review.
- Tasks requiring founder approval.

Do not modify the previous review reports.

Do not stage, commit, push, merge or deploy.

Run available documentation checks and report Git status.

Stop when the documentation is ready for an independent reviewer.
# 0019 Milestone 1 development is authorised, using synthetic data

- Status: accepted
- Date: 2026-10-30
- Decided by: founder (Phil), in `docs/prompts/phase-0-independent-acceptance-and-checkpoint.md`, 2026-10-30

## Context

Decision [0018](0018-discovery-and-privacy-review-first.md) removed the legal/privacy precondition from scaffolding and synthetic-data development. Decision [0001](0001-documentation-first-and-native-claude-code.md) still says implementation starts only when the founder approves it. The fresh review asked whether 0018 was also that approval (spec 16 item 24). Phil's prompt answers it explicitly and asks that the authorisation be recorded, not inferred from 0018.

## Decision

The founder **authorises Milestone 1 development using synthetic data**, subject to the repository's existing approval and verification rules (`CLAUDE.md`).

This includes:

- repository scaffolding
- Claude Code agent configuration
- technical feasibility spikes
- automated checks
- synthetic-data development

This does **not** authorise:

- production deployment
- real guest data
- contacting prospects
- hiring advisers
- material spending
- merging into `main`
- force-pushing or rewriting Git history

## What this does and does not cover (clarifications, for Phil to correct)

- **Milestone 1 only.** Milestone 2 and later implementation follow decision 0001 (Phil's instruction to begin) until Phil says otherwise. The Milestone 1 item list in the backlog (section 1.1) is itself a proposal.
- **The stack decision (A-01) is still Phil's approval.** Authorising Milestone 1 lets the shortlist (A-08), the spikes and the decision work happen; it does not choose a stack.
- **Existing rules still apply.** `CLAUDE.md` section 8 gates remain: new paid services, subscriptions or paid APIs, and any spend, need separate approval. Tooling used in Milestone 1 should be free or already approved.
- **Verification rules still apply.** Work is checked against acceptance criteria, tested, reviewed independently where `CLAUDE.md` section 4 requires it, and recorded in the ledger with observed evidence.
- **This record does not mark the Phase 0 documents accepted.** Documentation acceptance depends on an independent review (ledger T-026 and the independent acceptance report), recorded separately.

## Consequences

- Ledger tasks T-010, T-011 (Milestone 1 part) and T-018 are no longer waiting for an instruction to begin.
- Real guest data, the private beta and everything behind the real-data gate (backlog O-09) stay blocked.

## Evidence / sources

Phil's prompt `docs/prompts/phase-0-independent-acceptance-and-checkpoint.md`; decisions 0001 and 0018; `CLAUDE.md` sections 4 and 8.

# 0018 Customer discovery and legal/privacy review begin early; real data waits for them

- Status: accepted
- Date: 2026-10-30 (replaces the first version of this record, which made them a gate before any building)
- Decided by: founder (Phil), 2026-10-30

## Context

Independent review finding F-12 asked for customer discovery and legal engagement to come early. The first version of this record turned that into a hard gate before the repository scaffold. The fresh independent review (N-03) found that this put 115 of 149 backlog items behind one external adviser's reply, which is stricter than the risk needs.

## Decision

1. **Repository scaffolding, architecture spikes, agent development and implementation using synthetic data may proceed before legal/privacy approval.**
2. **Legal/privacy review and customer discovery should begin early.** Preparing research, adviser shortlists and outreach drafts is authorised.
3. **Hiring advisers, spending money and contacting prospects each need separate founder approval.**

## What follows from this (planning, for Phil to confirm)

- The gate that remains is for **real guest data and the private beta** (backlog O-09). Development with synthetic data does not wait for it.
- Starting implementation still follows decision [0001](0001-documentation-first-and-native-claude-code.md) (Phil's instruction to begin). This decision removes the legal/privacy precondition; it is not by itself that instruction. Phil's instruction for Milestone 1 is recorded separately in [0019](0019-milestone-1-development-authorised-with-synthetic-data.md); later milestones still follow 0001.
- Features whose behaviour depends on a product or legal decision (ShareWall consent and takedown rules, the Gallery revocation effects) stay gated on Phil's decision. Legal advice is an input to those decisions.

## Consequences

- Ledger tasks T-023 (discovery preparation) and T-024 (adviser preparation) can start now. T-027 (conducting discovery) and T-028 (hiring an adviser) wait for Phil's approval.
- Backlog: A-02 depends on A-01 only; O-09 is the real-data and private-beta gate; new preparation items O-10 and M-14.
- Spec section 14 changes.

## Evidence / sources

Phil's decisions of 2026-10-30; independent reviews (F-12, N-03).

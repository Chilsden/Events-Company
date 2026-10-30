# Milestone 1: Agent Security Hardening Proposal

Status: prompt file. It is not the output artifact and not the settings file.

Provenance: the founder's message named this file as the next prompt to create and execute, but the full text of the original instructions was not in the working session's context. This file records what the founder's message did state, and nothing more. If the original text differs, the original wins; tell the Lead Orchestrator and this file will be corrected.

## Objective

Turn the S-12 findings into a proposal for a working agent workflow with appropriately limited permissions. This is not another broad security experiment.

## Deliverables (all proposals; none activated)

1. A proposed `.claude/settings.json`.
2. A fail-closed hook design.
3. A concise security threat model.
4. A reproducible B-04 test plan (independent review catches a seeded defect).

## Founder constraints

- No additional headless experiments.
- No paid API calls.
- No `bypassPermissions` runs.
- The proposed settings file must not be installed at `.claude/settings.json`. The founder decides on activation after reading the proposal.
- Real guest data, external accounts, production deployment, merging into `main` and force-pushing remain unauthorised.

## Distinction to respect

S-12 showed that a role-aware hook can restrict some tool operations (Write and Edit). It did not show that Claude Code can securely contain an agent that has shell access. Do not claim otherwise.

## Preferred operating model

- Research and review agents: no shell access.
- Software Engineer: shell access only in a separately controlled development environment.
- Lead Orchestrator: delegates and coordinates; does not execute unrestricted commands.
- Security & QA: reviews changes independently without modifying the work under review.

## Next step after delivery

The founder reads the proposal and decides whether to activate the settings and then move towards implementing the event platform. The stack decision and application code are not part of this task.

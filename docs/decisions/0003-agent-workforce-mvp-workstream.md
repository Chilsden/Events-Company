# 0003 Agent workforce as an MVP workstream

- Status: accepted
- Date: 2026-10-30
- Decided by: founder (Phase 0 notes and Phil's instruction of 2026-10-30)

## Context

The internal AI agent workforce is part of the MVP, alongside the customer platform. The Phase 0 notes listed nine roles. `CLAUDE.md` defines six. Phil instructed that the six-role, lightweight native approach stays.

## Decision

- The workforce is a first-class MVP workstream.
- Roles: Lead Orchestrator, Market Researcher, Product Strategist, Solution Architect, Software Engineer, Security & QA. Marketing, sales, operations, finance and UX design are functions handled through these roles for now. A new role needs a decision record.
- Implementation uses Claude Code native subagents and skills. No always-on orchestration service and no separate framework (see 0001).
- Founder approval gates and autonomy rules are those in `CLAUDE.md` section 8, which stays the single authoritative list. They are not copied here.

## Consequences

- Backlog epic B covers the workforce. Role definitions are created when the first tasks need them.
- The admin dashboard includes agent activity.
- Wider autonomy needs Phil's approval based on observed, verified results.

## Evidence / sources

`CLAUDE.md` sections 3 and 8; master spec 6.4 and 6.10; conflict register (C-2).

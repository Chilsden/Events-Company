# 0001 Documentation first; use native Claude Code capabilities

- Status: accepted
- Date: 2026-10-29
- Decided by: founder (instructions in `docs/prompts/update-master-spec-and-claude-md.md`)

## Context

The repository has no application code. The founder wants a safe, economical way to build five connected event products with Claude Code. Several articles describe large agent setups with scheduled jobs, scripts and many agents. Their claims are unverified (see `docs/research/operating-model-sources.md`).

## Decision

- The current documentation task is documentation-only. Implementation starts only when the founder approves it.
- Start with Claude Code's existing capabilities. Do not mandate a separate orchestration framework or an always-on agent service.
- Keep a small set of enforceable rules (`CLAUDE.md`).
- Add skills, hooks or scripts only for workflows that have shown repeated value, with a known purpose, owner, failure behaviour and upkeep cost.
- One authoritative specification: `docs/MVP-MASTER-SPEC.md`.

## Consequences

- No scheduled cloud routines, unattended runs or extra tooling until a task needs them and the founder approves.
- The operating model may be revisited when there is measured evidence of a bottleneck.

## Evidence / sources

Founder instruction; `docs/research/operating-model-sources.md` for what the articles claim and what was not accessible.

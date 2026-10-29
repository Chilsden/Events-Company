# Task ledger

One row per task. Update the row when status changes; do not delete rows. Evidence means something observed (a test run, a diff reviewed, a commit hash), not a statement that work is done.

Status values: `proposed`, `in progress`, `blocked`, `in verification`, `accepted`, `abandoned`.

| ID | Objective | Owner/agent | Depends on | Status | Acceptance criteria | Evidence | Blocker | Decision refs |
|---|---|---|---|---|---|---|---|---|
| T-001 | Commit the instruction prompt as a baseline | Lead Orchestrator | none | accepted | Only `docs/prompts/update-master-spec-and-claude-md.md` is committed | Commit `8957f9b` | none | none |
| T-002 | Create `CLAUDE.md`, master spec, source notes, decision record and ledger | Lead Orchestrator | T-001 | in verification | Documents agree on approval boundaries, Git safety, roles and verification; five products in scope; assumptions labelled | Link check (0 broken) and secret scan (no matches) run 2026-10-29; line-by-line review done; awaiting founder approval to commit | Founder review | [0001](decisions/0001-documentation-first-and-native-claude-code.md) |

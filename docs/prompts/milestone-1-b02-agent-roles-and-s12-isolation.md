# Milestone 1 — B-02 Agent Roles and S-12 Isolation

## Objective

Implement and test the first version of the six-role Claude Code agent workforce while investigating whether agent permissions and file boundaries can be technically enforced.

This is Milestone 1 work only.

## Founder decisions

The founder authorises:

- Project-level Claude Code agent definitions.
- Local agent capability tests.
- Local hook and permission experiments.
- Synthetic test data.
- Disposable spike files under `spikes/S-12/`.
- Work on B-02 and S-12.

The founder does not authorise:

- Production deployment.
- Real guest data.
- Paid services or API calls.
- Creation of external accounts without separate approval.
- Acceptance of external terms.
- Merging into main.
- Force-pushing.
- Unrestricted shell or filesystem access.

## Stage 1 — Inspect

Read:

- `CLAUDE.md`
- `docs/MVP-MASTER-SPEC.md`
- `docs/research/claude-code-capabilities.md`
- `docs/research/stack-and-hosting-shortlist.md`
- `docs/planning/MVP-DELIVERY-BACKLOG.md`
- `docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md`
- `docs/task-ledger.md`

Inspect the current Git branch, working tree and Claude Code configuration.

Do not overwrite existing settings or agent definitions.

## Stage 2 — Define six roles

Create project-level role definitions for:

1. Lead Orchestrator
2. Market Researcher
3. Product Strategist
4. Solution Architect
5. Software Engineer
6. Security & QA

Use the existing responsibilities and approval boundaries in `CLAUDE.md`.

Each role must define:

- Purpose.
- Responsibilities.
- Inputs.
- Outputs.
- Permitted actions.
- Prohibited actions.
- Review requirements.
- Escalation conditions.
- Evidence requirements.

Use Claude Code native project agents where supported.

Do not introduce an external orchestration framework.

## Stage 3 — Security investigation

Under `spikes/S-12/`, investigate:

- Custom agent definitions.
- Tool restrictions.
- Shell-based writes.
- Permission-deny rules.
- Hooks.
- File/path restrictions.
- Worktree isolation.
- Fresh-context review.
- Whether an agent can modify its own configuration.

Use harmless synthetic files.

Test at least:

1. An agent without Write/Edit tools.
2. An agent with shell access.
3. An attempted write outside an allowed directory.
4. An attempted modification of agent instructions.
5. A fresh-context independent review.
6. A denied operation and its observable result.

Record the actual commands, environment, expected behaviour and observed behaviour.

Do not run destructive tests against real repository content.

## Stage 4 — Implement a minimal agent workflow

Test:

- Lead Orchestrator delegates a harmless task.
- A specialist agent produces an output.
- Security & QA independently reviews it.
- The orchestrator records the result and evidence.
- The workflow respects founder approval boundaries.

Avoid simultaneous edits to the same file.

Do not assume a role description is a technical security boundary.

## Stage 5 — Documentation

Document:

- Agent definitions and responsibilities.
- Verified capabilities.
- Unsupported or unverified controls.
- Security weaknesses.
- Recommended permission model.
- Independent review mechanism.
- Recommended next implementation tasks.

Update the task ledger with accurate statuses and evidence.

## Stage 6 — Verification and Git

Run relevant checks.

Review changes and scan for secrets.

Follow `CLAUDE.md` Git rules.

Commit and push only a reviewed task branch.

Do not merge or deploy.

## Final report

Report:

1. Agent definitions created.
2. Tests performed.
3. Actual security controls verified.
4. Controls that failed.
5. Remaining risks.
6. Recommended next task.
7. Files changed.
8. Git branch and commit hash.
9. Verified remote push status.

Do not claim security isolation without evidence.
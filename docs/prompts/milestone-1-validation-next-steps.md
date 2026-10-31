# Milestone 1 — Security Validation Next Steps

## Objective

Resolve the outstanding security issues and prepare the Events Company agent configuration for controlled validation.

Follow CLAUDE.md and the established task ledger, review and Git governance.

## 1. Credential security — highest priority

Inspect the existing Claude Code user-level permissions without exposing credential values.

Two API keys have reportedly been embedded in permission rules.

Do not print, copy, commit, log or transmit these keys.

Identify the affected services by name only, if possible without exposing secrets.

Prepare exact instructions for the founder to revoke or rotate the credentials and remove the affected permission rules.

Do not modify user-level settings without explicit founder approval.

Do not attempt to use or test the keys.

Review broad permission rules covering entire drives, destructive commands and network access.

Report recommended changes without applying them.

## 2. Approved agent changes

Remove Bash from these main-repository agent definitions:

- `.claude/agents/security-qa.md`
- `.claude/agents/software-engineer.md`

Update their descriptions to reflect the approved operating model.

The Software Engineer may edit files within an authorised task scope but may not execute shell commands.

Tests are executed by the founder-supervised main session until a controlled Engineer environment exists.

Security & QA independently reviews work without shell access.

Do not modify the other four role definitions unless required to correct a direct inconsistency. Report any proposed changes first.

## 3. Validation preparation

Read:

- `docs/research/agent-activation-validation.md`
- `docs/proposals/agent-hardening/validation-runbook.md`
- `docs/proposals/agent-hardening/settings.proposed.json`
- `docs/proposals/agent-hardening/guard.py`
- `docs/proposals/agent-hardening/build_validation_env.py`

Check that the validation environment can be rebuilt using synthetic data only.

Confirm that the proposed hook configuration specifies failure blocking.

Identify any inconsistencies between the documentation, settings, guard and runbook.

Do not install or activate the proposed settings in the real repository.

Do not execute A1–A10, F1–F5 or B-04 in this session.

## 4. Prepare the manual validation procedure

Provide exact Windows terminal instructions for the founder to:

1. Rebuild the disposable validation folder.
2. Inspect its contents.
3. Start a fresh Claude Code session with project-only settings.
4. Verify that user-level settings and external connectors are excluded.
5. Execute the runbook interactively.
6. Record the actual results.
7. Stop immediately if a critical prohibited operation is silently allowed.

Do not claim that isolation is verified until it has been observed.

## 5. Restrictions

Do not:

- Use nested headless Claude Code sessions.
- Use bypassPermissions.
- Make paid API calls.
- Create external accounts.
- Install Docker or WSL2.
- Access real guest data.
- Activate project-wide settings.
- Merge into main.
- Deploy.
- Force-push.

Do not run the validation tests automatically.

## 6. Review and Git

Follow CLAUDE.md.

Update the relevant task ledger entry.

Perform an independent review if it can be completed without violating the restrictions.

Check for secrets before committing.

Commit and push only the approved task branch.

Do not include generated Python cache files.

## Final report

Provide:

1. Credential remediation instructions, without secret values.
2. Agent-definition changes.
3. Validation configuration findings.
4. Exact manual validation commands.
5. Outstanding approvals and blockers.
6. Review results.
7. Git branch, commit hash and remote verification.

Stop before activation or runtime validation.
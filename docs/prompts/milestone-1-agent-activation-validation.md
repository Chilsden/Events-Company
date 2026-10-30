# Milestone 1 — Agent Activation Validation

## Objective

Validate the proposed Events Company agent security configuration against the actual Claude Code runtime.

Do not permanently activate project-wide settings until validation is complete and the founder approves the result.

## Founder decisions

Approved:

- The proposed six-role operating model.
- Local container isolation as the preferred Engineer environment.
- Interactive A1–A10 validation using synthetic data.
- B-04 testing after successful security validation.

Not approved:

- Permanent project-wide activation.
- Production deployment.
- Real customer or guest data.
- Hosted accounts or paid services.
- Nested headless testing sessions.
- `bypassPermissions`.
- Unrestricted shell access.
- Merging into main.

## Stage 1 — Inspect

Read:

- `CLAUDE.md`
- All six agent definitions.
- `docs/research/agent-security-hardening-proposal.md`
- `docs/proposals/agent-hardening/settings.proposed.json`
- `docs/proposals/agent-hardening/guard.py`
- `docs/proposals/agent-hardening/test_guard.py`
- `docs/research/s-12-agent-isolation-results.md`
- Relevant backlog and ledger entries.

Inspect the current Claude Code configuration.

Do not overwrite existing settings.

## Stage 2 — Validate configuration

Check the proposed settings against the installed Claude Code version and official documentation.

Identify unsupported, deprecated or unverified keys.

Correct the proposal where necessary.

Do not assume undocumented settings provide security.

## Stage 3 — Prepare isolated validation

Create a disposable validation environment containing only synthetic files.

Do not copy secrets, credentials or real project data.

Do not mount the user's home directory.

Do not expose external connectors.

Do not grant privileged container access.

If these conditions cannot be met, stop and report the blocker.

## Stage 4 — Validate A1–A10

Execute the documented activation checks interactively.

Do not use headless sessions or bypassPermissions.

For each test record:

- Expected result.
- Actual result.
- Evidence.
- Pass/fail status.

Stop if any critical permission check silently allows a prohibited action.

## Stage 5 — Validate failure behaviour

Test:

- Hook process failure.
- Missing hook executable.
- Malformed hook output.
- Permission-denied operation.
- Attempted modification of protected configuration.

Do not assume failure is secure unless observed.

## Stage 6 — Engineer containment

Prepare a minimal local-container design for the Software Engineer.

Verify the proposed filesystem, network, credential and privilege boundaries.

Do not install new software or change host security settings without separate approval.

## Stage 7 — B-04

If all critical activation checks pass, run the minimal independent-review workflow using synthetic data.

Use a fresh-context reviewer.

Keep the seeded defect hidden from the reviewer.

Do not claim statistical reliability from a small number of trials.

## Stage 8 — Documentation

Record:

- Verified controls.
- Failed controls.
- Untested controls.
- Security limitations.
- Remaining risks.
- Recommendation on project-wide activation.

Update the relevant task ledger entries.

## Stage 9 — Git

Follow `CLAUDE.md`.

Review changes and check for secrets.

Commit and push only the approved task branch.

Do not merge or deploy.

## Final report

Provide:

1. A1–A10 results.
2. Hook failure results.
3. Configuration compatibility findings.
4. Engineer containment design.
5. B-04 results, if executed.
6. Outstanding risks.
7. Activation recommendation.
8. Git branch and verified commit hash.

Stop before permanently activating the configuration.
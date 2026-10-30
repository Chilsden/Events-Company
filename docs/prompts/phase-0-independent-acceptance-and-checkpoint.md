# Phase 0 — Independent Acceptance and Git Checkpoint

## Objective

Preserve the completed Phase 0 documentation, perform a genuinely independent acceptance review, and prepare the repository for Milestone 1 implementation.

Do not begin application implementation in this task.

## Founder authorisation

The founder authorises Milestone 1 development using synthetic data, subject to the repository's existing approval and verification rules.

This includes:
- Repository scaffolding.
- Claude Code agent configuration.
- Technical feasibility spikes.
- Automated checks.
- Synthetic-data development.

This does not authorise:
- Production deployment.
- Real guest data.
- Contacting prospects.
- Hiring advisers.
- Material spending.
- Merging into main.
- Force-pushing or rewriting Git history.

Record this authorisation explicitly. Do not infer it solely from decision 0018.

## Stage 1 — Inspect repository

Read `CLAUDE.md` and inspect the current branch, working tree and remotes.

Read the master specification, decisions, architecture, backlog, risks, ledger and review reports.

Preserve all existing work.

## Stage 2 — Draft Git checkpoint

Review all files proposed for the checkpoint.

Check for:
- Secrets.
- Sensitive information.
- Unrelated changes.
- Accidental temporary files.
- Unexpected generated files.

Stage only the explicitly reviewed documentation paths.

Review the staged diff.

Commit with a message clearly identifying the documentation as a draft awaiting independent review.

Push only the existing `docs/update-master-spec` branch.

Verify the remote branch points to the new commit.

Do not merge into main.

If any Git safety check fails, stop and report the issue.

## Stage 3 — Independent review

Use a fresh-context Claude Code subagent that did not author the Phase 0 documents.

If genuine context separation cannot be established, stop and report that independent review remains outstanding.

The reviewer must read the documentation from disk and independently check:

- The five-product MVP scope.
- The six-role agent workforce.
- Founder decisions and proposed technical choices.
- Security and privacy foundations.
- Consent and revocation.
- Event Gallery ingestion.
- Offline limitations.
- Lucky Draw integrity.
- Accessibility.
- Backlog dependencies.
- Milestone sequencing.
- Unresolved implementation blockers.

The reviewer must not edit the documents it reviews.

Write the independent report to:

`docs/Reviews/phase-0-independent-acceptance-report.md`

Classify findings as:
- Critical.
- Major.
- Minor.
- Observation.

Distinguish:
- Documentation acceptance blockers.
- Milestone 1 implementation blockers.
- Real-data/private-beta blockers.

## Stage 4 — Review outcome

If critical or major documentation defects remain:
- Do not mark the documentation accepted.
- Do not begin implementation.
- Report the required corrections.

If the documentation passes:
- Update the task ledger with the review evidence.
- Identify the first Milestone 1 implementation task.
- Prepare a proposed implementation prompt.

Do not implement it yet.

## Stage 5 — Final Git checkpoint

If the independent review report and ledger update are ready:

- Review the new files and changes.
- Check for secrets.
- Stage only reviewed paths.
- Commit and push to `docs/update-master-spec`.
- Verify the remote commit.

Do not merge or deploy.

## Final report

Report:
1. Current branch.
2. Draft checkpoint commit hash and verified remote hash.
3. Whether genuine independent review occurred.
4. Review findings and acceptance status.
5. Any remaining blockers.
6. Final checkpoint commit hash and verified remote hash.
7. First recommended Milestone 1 task.
8. Exact files changed.
9. Git working-tree status.

Never claim independent approval or a successful push without verification evidence.
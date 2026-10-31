# Agent activation validation: status and findings (2026-10-30)

Task T-044. Prompt: [milestone-1-agent-activation-validation.md](../prompts/milestone-1-agent-activation-validation.md). Builds on [agent-security-hardening-proposal.md](agent-security-hardening-proposal.md).

**Result: stopped before Stage 4. A1 to A10, the failure tests and B-04 were not run.** Reason: they need a fresh interactive Claude Code session started inside a validation folder with the settings, hook and agent definitions loaded, with user-level settings excluded. The session doing this work is the live VS Code session on the real repository. Nested headless sessions are not allowed, project agents are not loaded mid-session (observed in S-12), and loading the settings into this session would activate them on the real repository, which is not approved. I prepared everything needed for you to run the checks, and I corrected the proposal against the documentation. Nothing was activated; `.claude/settings.json` does not exist.

Evidence labels: **docs** = read from the Claude Code documentation on 2026-10-30 by a fetch subagent (report is data; parts of long pages were truncated, so some items are summaries and are marked); **observed** = seen in this task or in S-12; **untested**.

## 1. A1 to A10 and failure tests

All **untested through Claude Code**. The guard script itself was re-run on synthetic payloads inside the built validation folder (observed): `security-qa` write to `docs/Reviews/a.md` allowed, to `src/app.py` blocked, and `market-researcher` write to `docs/research/denied/x.md` allowed by the hook (the deny rule must stop it, which is check A6). The 22 unit tests pass (21 passed, 1 skipped). Runbook with exact steps: [validation-runbook.md](../proposals/agent-hardening/validation-runbook.md). Builder: [build_validation_env.py](../proposals/agent-hardening/build_validation_env.py); the folder was built at `%TEMP%\events-agent-validation` (synthetic files, local git repo with no remote).

## 2. Configuration compatibility findings

| Item | Finding | Evidence | Action |
|---|---|---|---|
| Hook failure behaviour | By default a hook that is missing, fails to start or exits with a code other than 2 is a **non-blocking error and the action goes ahead** (fail-open). A handler setting `"onFailure": "block"` (v2.1.295 and later; installed 2.1.312, from B-01) blocks instead | docs | Added `onFailure: "block"` to the proposed hook. A3, A4, F1, F2 verify it. The earlier assumption "a missing hook gives fail-to-prompt" was wrong by default |
| Exit code 2 and allow | Exit 2 blocks, even when JSON says allow. Other non-zero codes do not block | docs | Matches the guard |
| Hook allow versus deny rule | Deny and ask rules are still evaluated regardless of a hook's allow; order is deny, then ask, then allow | docs (partly a summary) | A6 verifies |
| Frontmatter hooks | Supported, but project subagent hooks run only after the workspace trust dialog is accepted, and a `-p` session does not count | docs | Likely explains why they did not fire in the headless S-12 runs. A hypothesis, not tested. Still not relied on |
| `Write(path)` deny rules | Docs say `Write(path)`, `NotebookEdit(path)` and `Glob(path)` rules never match; use `Edit(path)`. In S-12 (E4a, E4e) a `Write(forbidden/**)` deny held at version 2.1.312 | docs conflict with observed | Proposed deny rules already contain both `Write` and `Edit` forms; keep both, rely on `Edit`. A8 checks |
| `Read` deny | A `Read` deny also blocks Edit and Write on the path | docs | Fine for `.env*` and `secrets/` |
| `disableBypassPermissionsMode` | Documented, value `"disable"` | docs | Kept. A7 is observation only (do not start bypass) |
| `defaultMode` | `default` is valid. Docs: `auto` and `bypassPermissions` from project settings do not take effect | docs | No change |
| Bash rule matching | `Bash(git push*)` matches `git pushfoo`; `Bash(git push *)` does not stop `git -C . push` or `git 'push'`; `Bash(curl *)` does not stop `/usr/bin/curl` | docs | Confirms shell rules are not a boundary. Our `git -C *` deny and the guard cover some variants only |
| PowerShell rules | Documented, same shape as Bash rules, case-insensitive, aliases canonicalised | docs | Kept; untested |
| Rule path syntax | `//path` absolute, `~/` home, `/path` relative to the settings source, bare path relative to the working directory; gitignore style | docs | Our rules are project-relative. A8 checks `.env*` |
| `WebFetch(domain:...)` | Documented; `localhost` example was meaningless | docs | Removed the localhost rule. A domain allow-list is still a founder decision |
| `$CLAUDE_PROJECT_DIR` | Documented as `${CLAUDE_PROJECT_DIR}`, exported to the hook process | docs | Hook command now uses `${CLAUDE_PROJECT_DIR}`. Windows shell resolution (Git Bash or PowerShell) untested |
| Hook payload | `agent_id`, `agent_type`, `tool_name`, `tool_input`, `cwd` documented | docs, plus S-12 observed `agent_type` | Matches the guard |
| MCP | `enableAllProjectMcpServers`, `enabledMcpjsonServers`, `disabledMcpjsonServers`, `allowedMcpServers`, `deniedMcpServers` exist. They govern servers from `.mcp.json`, not obviously claude.ai connectors. `--strict-mcp-config`: not found in the docs read. `mcp__` rules with parentheses are skipped | docs | Set `enableAllProjectMcpServers: false`. Whether connectors can be excluded from a session is **unresolved**; check `claude --help` and `/mcp` |
| Settings merge | Lists such as `permissions.allow` from user, project and local files are combined. A deny at any level wins. Managed settings outrank all | docs | See section 3 |
| Managed-only keys | `allowManagedHooksOnly`, `allowManagedPermissionRulesOnly` exist but need managed (system-level) settings | docs | Changing host security settings needs separate approval; not done |
| Settings and hooks reload | Edits to settings and hooks are picked up by a file watcher | docs | Means a hook swap in the runbook takes effect without restart; the runbook relies on it and records what happens |
| Project agents loaded at start | Not found in the docs read; observed in S-12 that a new agent was not available mid-session | observed once | Fresh session required |
| Sandbox | `sandbox.*` settings exist (Bash, PowerShell); documented for macOS, Linux and WSL2; native Windows not confirmed. Read/Edit deny rules do not cover subprocesses opening files | docs | No sandbox on this Windows host unless WSL2 is installed |
| `Agent` versus `Task` tool name | Not resolved | untested | Both allowed for the Orchestrator |

## 3. Finding about the existing user-level settings (needs your attention)

Your `~/.claude/settings.json` (not changed by me) holds many broad allow rules from other projects, including read access to the whole `C:` and `G:` drives and your home folder, `rm -rf` on a path in another project, and `curl` commands. Because allow lists from user and project settings are combined, any session in this repository inherits them. That reduces the value of the proposed permission prompts for the main session; deny rules and the guard for subagents are not weakened by allows. In addition, two **API key strings appear in plain text inside allow rules** in that file. I did not copy them anywhere. Treat them as exposed: rotate them at the provider, and remove the rules. I will not edit that file without your say-so.

For validation use `claude --setting-sources project` in a terminal so the user file is excluded. For day-to-day work consider cleaning the user file, or running the Events Company in a separate user profile.

## 4. Engineer containment design (not buildable here)

Blocker: this machine has **no Docker and no WSL** (`docker` not found; WSL not installed). Installing either changes host settings and software, which this task does not allow without separate approval. So nothing was built or verified.

Design to approve (proposal):
- **Filesystem:** a throwaway clone of the task branch only. No home folder, no `.ssh`, no `~/.claude`, no repository `.git` credentials, no other projects. Output goes to one mounted output folder. Root filesystem read-only except the work folder and `/tmp`.
- **Privilege:** non-root user, all capabilities dropped, `no-new-privileges`, not privileged, no Docker socket, no host devices.
- **Network:** none by default; if packages are needed, a prepared image or a local package mirror, not open internet.
- **Credentials:** none in the container: no Git push rights, no cloud tokens, no connector sessions.
- **Lifecycle:** one container per task, destroyed afterwards.
- **Unsolved problem:** Claude Code itself needs a login or API credential to run. If the Engineer agent runs inside the container, that credential is inside it, which breaks the credential boundary. Alternatives: Claude Code stays on the host and only commands run in the container (no built-in support found for this, so it would need a custom tool and its own approval), or the sandbox feature on WSL2 (untested, needs WSL2). This must be solved before the Engineer gets a shell. Until then the Engineer has no shell, as the proposal says.

## 5. B-04

Not run. The prerequisites (activation checks passing, trial materials, isolated folder) are not met.

## 6. Verified, failed, untested

- **Verified (observed):** guard script behaviour on synthetic payloads (22 unit tests, one skipped); the validation folder builds and its guard behaves as expected; the corrected settings file is valid JSON.
- **Verified from documentation only:** hook exit codes, `onFailure`, deny-over-allow ordering, merge of settings lists, frontmatter hook trust requirement.
- **Failed:** none observed in Claude Code, because nothing was run there. One documented default is unsafe: a failing hook does not block unless `onFailure: "block"` is set.
- **Untested:** all of A1 to A10 and F1 to F5; `onFailure: "block"` behaviour; Windows hook command resolution; connector exclusion; PowerShell and ask rules; Engineer container and the credential problem.

## 7. Remaining risks

Shell is still not contained. Same-model review only. User-level settings widen the main session. Exposed keys in the user file. The Engineer environment does not exist. Documentation items marked as summaries may be inexact.

## 8. Recommendation on project-wide activation

**Do not activate yet.** First run the runbook in a fresh interactive session (about 20 to 30 minutes, free of API use beyond the normal session). If A3 to A6 and F1 to F5 show no silent allow, activating the settings and hook for the no-shell roles is reasonable, with the Engineer still without a shell. Activation also depends on resolving your user-level settings. Then B-04 can run in an isolated folder.

## 9. Outstanding approvals and actions for the founder

1. Run, or authorise a fresh interactive session to run, the runbook (`claude --setting-sources project` in the validation folder).
2. Rotate the two exposed API keys and decide about the broad user-level allow rules.
3. Approve installing WSL2 or Docker if you want the Engineer container work to continue (host change, separate approval), and decide how the credential problem is handled.
4. Approve applying the Bash removal to the repository's `security-qa` and `software-engineer` definitions (currently only in the validation copy).

## 10. Follow-up 2026-10-31 (T-045): preparation for manual validation

Prompt: [milestone-1-validation-next-steps.md](../prompts/milestone-1-validation-next-steps.md). Still **no validation test was run** and nothing was activated.

- **Credentials:** see [credential-exposure-remediation.md](credential-exposure-remediation.md). Two Google API keys sit in plain text in user-level allow rules; I also displayed them once earlier in this session, so rotation is required.
- **Agent definitions:** Bash removed from `.claude/agents/security-qa.md` and `.claude/agents/software-engineer.md`, and their descriptions and sections updated to the approved model (the Engineer edits within the authorised scope and has no shell; the founder-supervised main session runs the tests; Security & QA reviews without a shell). The other four definitions are unchanged.
- **Inconsistencies found, proposed changes only (not applied):**
  1. `solution-architect.md` says spike commands are run "by the session or the Software Engineer". The Engineer has no shell now; propose "by the founder-supervised main session".
  2. `lead-orchestrator.md` lists staging, committing and pushing a reviewed task branch as a permitted action. The hardening model has the orchestrator subagent limited to read-only Git, with commits done by the main session (`guard.py` enforces only read-only Git). Propose removing commit and push from the orchestrator's permitted list.
  3. `lead-orchestrator.md` keeps `Bash` in its tool list; this is intended (guard allow-list) and depends on the guard being active. Without the guard, its shell is unrestricted.
- **Builder:** `build_validation_env.py` previously stripped Bash itself; it now copies the repository definitions as they are and fails if either of the two still lists Bash. Rebuilt on 2026-10-31 at `%TEMP%\events-agent-validation`. Observed: 0 files with secret-like strings, no git remote, clean working tree, `tools:` lines show no Bash for `security-qa` and `software-engineer`, settings show `onFailure: block`, matcher `*`, `disableBypassPermissionsMode: disable`, default mode `default`; the folder's hook file is byte-identical to `guard.py`.
- **Runbook consistency:** the runbook now states what counts as a silent allow (default mode, no prompt and no block), what is acceptable for A5 and F3 (a declined prompt), and adds A0, a sanity check that the hook does not block everything. Reason: on Windows the hook shell may be PowerShell, where `${CLAUDE_PROJECT_DIR}` may not expand; that is untested and if it fails, a corrected settings file is needed. A5 and F3 depend on the documented behaviour that non-JSON output with exit 0 is not an allow; that is a documentation claim.
- **Windows commands and results template:** [validation-windows-commands.md](../proposals/agent-hardening/validation-windows-commands.md), [validation-results-template.md](../proposals/agent-hardening/validation-results-template.md).
- **Independent review:** [validation-next-steps-review.md](../Reviews/validation-next-steps-review.md), accept with changes, no secret values found; its findings (one pasteable block of file swaps, a BOM risk in the settings rewrite, transcript scan scope, runbook wording, combined result rows, quoting for the extension's executable, unchecked user-level agents and plugins) were applied. The reviewer did not rebuild the folder or read `~/.claude`.
- **Not verified:** that the `claude` command exists on your path (it is not on the path of the tool shell I use); that `--setting-sources` and `--strict-mcp-config` are accepted in your installed version (the commands check this first); that connectors are excluded; every runtime behaviour in section 6.

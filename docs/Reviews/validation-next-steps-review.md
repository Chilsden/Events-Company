# Independent review: validation next steps (T-045)

Reviewer: fresh-context Security & QA subagent. Branch `task/m1-validation-next-steps`, working tree against HEAD d8d63de. Read-only review; only this report was written. No `claude` run, nothing under `~/.claude/` read, no network.

Checks actually run: `git status`, `git diff`, `python docs/proposals/agent-hardening/test_guard.py` (22 tests, OK, 1 skipped), pattern scans of the repository, and a count-only scan of all Git history for a Google key pattern (0 commits with a match).

## Verdict

Accept with changes. No secret leak and no activation or test run found. Two High findings concern the correctness and safety of the founder-run procedure; the rest are Medium or Low.

## 1. Secret scan (check 1)

- Scanned every changed and new file, and the whole working tree outside `.git`, for long `AIza...` and `sk-...` strings, `key=`, `api_key`. No key value or fragment found. The patterns `AIza`, `sk-[A-Za-z0-9]{16}` and `key=` appear only as search patterns in `docs/research/credential-exposure-remediation.md` lines 25, 33, 34 and `docs/proposals/agent-hardening/validation-windows-commands.md` line 25. The `.env` and `secrets/fake.txt` content in the builder is the literal `not-a-real-secret`.
- Full Git history, all refs: 0 commits contain a long `AIza` match.
- Personal path: `validation-windows-commands.md` lines 8 and 101 contain the founder's local path (`C:\Users\phili\Documents\...`). Low, see L3.
- Limit: I did not read `~/.claude/`, so I cannot confirm the statements about the 93 rules, positions 30 and 32, or that the transcript stores the values.

## Findings

### Critical

None.

### High

**H1. Section 5 of `validation-windows-commands.md` (lines 68 to 88) is one pasteable block that, if run as written, executes every swap and restore in sequence.** Pasting it runs A3 rename and restore, the A4 edit and `git checkout` restore, then four hook swaps with only one restore at the end. The four `Copy-Item` swaps (lines 80 to 85) are consecutive with a single "restore after each" comment, so a founder who runs them one by one and forgets a restore carries a broken or `allow_everything.py` hook into A8, A10, F4 and F5. That produces false passes (an allow-everything hook can mask a guard failure) and the results table would not show it. Fix: split into labelled blocks, one per test (A3, A4, A5/F3, F1 crash, F1 raises, A6), each ending with its own restore line and a check such as `fc.exe "$V\.claude\hooks\agent_guard.py" "$V\variants\original_guard.py"` (or `(Get-FileHash ...)` comparison) that the founder runs before the next test. Add a restore-and-verify step to the results template ("hook restored: yes/no") for each swap row.

**H2. The credential remediation script (`credential-exposure-remediation.md` lines 22 to 26) writes `settings.json` with `Set-Content -Encoding utf8`.** In Windows PowerShell 5.1 that adds a UTF-8 byte-order mark, and it also rewrites the whole file (indentation, escaped characters such as `\u0027`, depth limit 10). If Claude Code's settings parser rejects a BOM, all user-level settings, including deny rules, would silently stop loading. The text says "check that Claude Code still starts", but a settings-parse failure may not stop startup and may only warn. I could not test this. Fix: write without BOM, for example `[System.IO.File]::WriteAllText($p, ($j | ConvertTo-Json -Depth 20), (New-Object System.Text.UTF8Encoding($false)))`, raise `-Depth`, and prefer the `/permissions` UI as the primary method with the script as the fallback. Also state that a failed script leaves `$p.bak` containing the keys, so the founder must delete it even on failure (use `try/finally`), and that this is only safe after the keys are rotated (it is, as ordered).

### Medium

**M1. Verification in remediation step 4 is incomplete (`credential-exposure-remediation.md` line 34).** It scans only `*.jsonl` under `~/.claude/projects`. Claude Code also stores tool output as separate files (for example `tool-results` folders next to the transcripts), plus other caches. A key shown in tool output can sit in files this command misses. Fix: scan all files, for example `Get-ChildItem "$env:USERPROFILE\.claude" -Recurse -File | Select-String -Pattern 'AIza' -List | ForEach-Object Path`, and say that results may include this repository's session files. Tell the founder that deleting history files is optional only after rotation.

**M2. The disclosure scope is narrower than it may be (`credential-exposure-remediation.md` section 2, `agent-activation-validation.md` section 10, ledger T-045).** The wording is honest and plain: it states the values were printed once, where they now live (transcript, sent to the model service), that they were not copied into any file, and that rotation is required. Two gaps: (a) "once" and "did not copy" are the assistant's own account and cannot be verified from the repository; the Git scan covers only committed content, so say "to my knowledge" or state how it was checked (the working tree scan I ran found none). (b) "the saved commands also ran in earlier sessions of the other project" is an inference from rules existing, not an observation. Soften to "probably". Section 1 also says the YouTube API identification came from "earlier output", which is the same exposure and should be stated as such.

**M3. `validation-windows-commands.md` lines 36 to 42: running a `claude*.exe` found in the VS Code extension folder.** The search can return several files, the command in section 3 uses bare `claude` and the text says "use the full path in place of `claude`", but a path with spaces needs `&` and quotes in PowerShell (`& "C:\...\claude.exe" --setting-sources project`). Also, the extension binary may be a different version from the CLI that the runbook was written against. Fix: give the exact `& "<full path>"` form and ask the founder to record which binary and version they used (the results template has a version field only).

**M4. The exclusion check relies on `--setting-sources project` and `/status` but nothing here verifies user-level agents, skills, plugins, or CLAUDE.md files are excluded, nor managed policy settings.** Lines 53 to 62 check permissions, connectors and hooks only. A user-level hook or agent with the same name as a project one could change results. Fix: add `/agents` and `/hooks` source checks (already partly there) and a results-template field "any user-level or managed item listed (agent, hook, plugin, memory file)?".

**M5. Runbook has stale or inconsistent text.** `validation-runbook.md` line 39 says "already built once at that path on 2026-10-30" but section 10 of the activation document says it was rebuilt on 2026-10-31; line 39 and line 78 use cmd syntax (`%TEMP%`, `copy variants\...`) while the commands file uses PowerShell, and the runbook line 64 expected result for A8 says "(push, commit)" yet no `git commit` prompt is listed in the A8 actions or in the template row. Fix: remove the date, point to the PowerShell file for all commands, and add `git commit` to A8 or remove it from the expected text.

**M6. Template rows lose detail from the runbook.** `validation-results-template.md` rows A8 and F1 to F5 collapse several sub-tests into one status (for example A8 lists six actions, F1 has two variants and a traceback case, F2 has two cases). A single PASS could hide one failing sub-case. Fix: one row per sub-case (A8a to A8f, F1a/F1b, F2a/F2b, F5a to F5c) or a required per-sub-case note column.

**M7. Section 10 of `agent-activation-validation.md` states the builder run as observed ("0 files with secret-like strings, no git remote, clean working tree, tools lines, settings values, byte-identical hook").** I did not rebuild the folder (that would write to `%TEMP%`; permitted but not asked) and could not verify it. The claims are consistent with the builder source (it asserts no Bash in the two definitions, copies `guard.py` unchanged, runs `git init` with no remote and commits everything), so they are plausible. Treat them as the author's observation, not independently confirmed. Also the builder uses `os.path.commonpath([t, REPO])`, which raises `ValueError` (not a clean message) if `%TEMP%` is on another drive than the repository. Fix: wrap it in try/except and print "target must be on the same drive or outside the repository".

### Low

**L1. Agent definitions vs guard.** `guard.py` ROLES still lists `Bash` (policy `dev-container`) and `MultiEdit` for `software-engineer`, while `software-engineer.md` now lists neither. This is intentional in the hardening proposal (a controlled-environment copy keeps Bash) and is harmless, because a tool the agent does not have is never called, but it should be said once in the guard header or the proposal so a later reader does not think the definition regressed. `test_guard.py` lines 156 and 229 to 231 test the engineer Bash path; they stay valid. The two edited definitions match the approved model (no shell, tests run by the founder-supervised main session, reviewer has no shell, Write only for `security-qa`) and match the guard on the other points (`security-qa` writes only `docs/Reviews/`; engineer writes only the scope file). One wording flaw: `software-engineer.md` line 36 "asking another agent to run commands it was not given by the founder-supervised main session" is hard to parse. Suggest: "Asking any other agent to run shell commands for it; only the founder-supervised main session runs commands".

**L2. Unapplied inconsistencies are correctly reported, not applied.** Section 10 items 1 and 2 (`solution-architect.md` line 15 "or the Software Engineer", `lead-orchestrator.md` commit and push) are real and the four other definitions are unchanged (confirmed in `git diff`). `security-qa.md` still says "The report lists what was read and run" (line 45); with no shell, "run" is misleading. Change to "what was read and what output was supplied".

**L3. Personal path committed.** `validation-windows-commands.md` lines 8 and 101 hard-code `C:\Users\phili\...`. Use `$env:USERPROFILE\Documents\VSCode Projects\Events-Company` or a `$Repo` variable at the top.

**L4. `docs/proposals/agent-hardening/__pycache__/` is untracked and there is no `.gitignore`.** The prompt says not to include cache files; use explicit `git add` paths and consider adding `__pycache__/` to a reviewed `.gitignore`.

**L5. The scan patterns now live in the repo.** `AIza` appears in two docs, so future history scans for that prefix will hit these files. Add a note, or scan with a longer pattern (`AIza[0-9A-Za-z_-]{30}`).

**L6. Section 5 note on file watchers (commands line 90).** "Settings and hooks are normally re-read by a file watcher (documentation)" is a documentation claim; Claude Code may instead require review in `/hooks` after external settings changes. The text already offers restart as a fallback; also record in the template whether the A4 settings change took effect without a restart (the free-text line does, but make it a column).

**L7. Command checks.** PowerShell 5.1 syntax of every command reviewed is valid (`-notmatch '\\\.git\\'` correctly excludes `.git` folders but not `.gitignore`; `Select-String ... | Measure-Object`, `Rename-Item`, `-replace` with `Set-Content -Encoding ascii -NoNewline`, `git -C $V ...`). Destructive commands are limited to `$V` (`Remove-Item -Recurse -Force` guarded by `Test-Path`, `git clean -fd` inside `$V`, and the explicit `%TEMP%\events-agent-validation` path in section 8); `variants/` is git-ignored so `git clean -fd` keeps it (restoring uses it after a clean), good. Minor: `git -C $V clean -fd` fails with an unhelpful error in a new window where `$V` is unset; section 8 already uses the literal path, so repeat `$V = ...` at the top of sections 5 and 8. No command prints a secret value: remediation line 33 only counts, line 34 prints file paths, commands line 25 only counts. The `Get-Content "$V\.claude\settings.json"` output is synthetic.

## Checks 2 to 7 in brief

- (2) Agent definitions: match the approved model; see L1, L2.
- (3) Commands: see H1, H2, M1, M3, L7.
- (4) Consistency: IDs A0 to A10 and F1 to F5 agree between runbook and template. File names and variants (`garbage_exit0.py`, `crash_exit1.py`, `raises.py`, `allow_everything.py`, `original_guard.py`) all exist in the builder. `settings.proposed.json` has `onFailure: block`, matcher `*`, `disableBypassPermissionsMode: disable`, `defaultMode: default`, as claimed; the builder adds the A6 deny rule. The only gaps are M5 and M6.
- (5) Claims vs evidence: section 10 wording ("Not verified" list, "documentation claim" for exit-0 garbage, "still no validation test was run") is appropriately cautious. The rebuild claims (M7) and the user-settings facts (M2) are the assistant's unverified-by-me observations.
- (6) Activation or test runs: none found. No settings were installed in the real repo (`.claude/settings.json` is absent; only the two agent definitions changed, as asked). The hook `guard.py` exists only under `docs/proposals`. Ledger status "in verification" is correct. The guard unit tests I ran are the existing synthetic ones, not the A and F validation.
- (7) Disclosure honesty: adequate and direct; see M2 for the two softening points.

## What I could not check

- Anything inside `~/.claude/` (the 93 rules, positions, key identification, transcript contents, whether other copies exist).
- Whether the `claude` binary, `--setting-sources`, `--strict-mcp-config`, `${CLAUDE_PROJECT_DIR}` expansion in the Windows hook shell, `onFailure: block`, and file-watcher behaviour work as documented. None of this was run.
- Whether the disposable folder rebuilds and has the stated properties on the founder's machine (not rebuilt).
- Whether the PowerShell commands run on 5.1 as written: reviewed by reading, not executed.
- The same-model limitation: this review is by a model from the same family as the author.

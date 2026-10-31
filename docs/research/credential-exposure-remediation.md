# Credential exposure in user-level Claude Code permissions: remediation steps

Task T-045. Written for the founder. **This file contains no secret values.** Nothing in `~/.claude/` was changed by the assistant.

## 1. What was found (observed 2026-10-31, by a script that printed rule positions and host names only)

- `~/.claude/settings.json` has 93 allow rules. Two of them (positions 30 and 32 in the allow list, counting from 0) are saved `Bash(curl ...)` commands whose URL contains a plain-text API key as a query parameter. Both go to `www.googleapis.com`. The earlier output showed the paths belong to the **YouTube Data API v3**, so these are almost certainly **Google Cloud API keys** created for the Stock project. I did not test either key and will not.
- No `settings.local.json` exists in `~/.claude/`. A scan of `.claude` settings files in your project folders (two levels deep) found no other secret-like strings.
- A search of this repository's whole Git history (all branches) for the Google key pattern found nothing, so no key was committed here. This was a count only.

## 2. Disclosure: I displayed the values once

This is my own account; you can check it against this session's transcript. During the activation-validation task I ran a command that printed the first lines of `~/.claude/settings.json` to see what user-level rules exist. Those lines included the two key values. That output is now in this session's transcript, which Claude Code stores under `~/.claude/projects/` and which was sent to the model service as part of the conversation. This was a mistake: I should have inspected the file with a script that masks values, as I did this time. I did not copy the values into any file, document, commit or message. Because of this, and because the saved commands were presumably also run in earlier sessions of the other project (my inference, not checked), **treat both keys as exposed and rotate them regardless of anything else**.

## 3. What to do, in order

1. **Revoke or rotate first.** Google Cloud Console, project that owns the keys, APIs & Services, Credentials, API keys. Find the keys used for the YouTube Data API (the key names or creation dates should match the Stock project). Create a replacement key if the Stock project still needs one, then **delete the old keys** (deleting is stronger than regenerating). On the new key set *API restrictions* (YouTube Data API v3 only) and, if the key is used from a fixed machine, an application restriction. Do not paste the new key into Claude Code commands or settings; keep it in an environment variable or a `.env` file that is git-ignored.
2. **Check for misuse.** In the same console open the project's API usage metrics and billing reports for the period since the keys were created. Look for calls you do not recognise, other APIs enabled, or unexpected cost. If anything looks wrong, treat it as a security incident and tell me.
3. **Remove the two permission rules** (after step 1, so the order cannot leave a live key behind). Either in a Claude Code session type `/permissions`, open the Allow list, and delete the two `Bash(curl ... googleapis.com ... key=...)` rules; or in PowerShell:

   ```powershell
   $p = "$env:USERPROFILE\.claude\settings.json"
   Copy-Item $p "$p.bak"
   $j = Get-Content $p -Raw | ConvertFrom-Json
   $j.permissions.allow = @($j.permissions.allow | Where-Object { $_ -notmatch 'googleapis\.com.*key=' })
   [System.IO.File]::WriteAllText($p, ($j | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding($false)))
   ```

   Then **delete the backup**, because it still contains the keys: `Remove-Item "$p.bak"`. (This writes UTF-8 **without** a byte-order mark, because Windows PowerShell's `Set-Content -Encoding utf8` adds one and I could not test whether Claude Code accepts it. The JSON is re-spaced and some characters are escaped; the content stays valid. Prefer the `/permissions` method above if you are unsure, and check afterwards that Claude Code still starts.)
4. **Verify without printing values:**

   ```powershell
   (Select-String -Path "$env:USERPROFILE\.claude\settings.json" -Pattern 'key=' -SimpleMatch | Measure-Object).Count    # expect 0
   Get-ChildItem "$env:USERPROFILE\.claude" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern 'AIza' -List | ForEach-Object Path
   ```

   The second command lists every file under `.claude` that contains the key pattern (file paths only, no values; it can take a while). That covers transcripts and stored tool results. Those transcripts keep old copies. After rotation the old keys are worthless, so deleting the listed files is optional housekeeping; this repository's own session transcript is among them. Do not delete transcripts you may still need.
5. **Look for other copies.** Search the Stock project and its git history for the same key strings (for example `.env`, scripts, notebooks), using a tool that does not echo matches, or tell me to do a count-only scan if you approve it.
6. Tell me when done and I will record it in the ledger (T-045).

## 4. Review of the other broad rules in `~/.claude/settings.json` (recommendations, none applied)

Because lists from user and project settings combine, every Claude Code session on this machine inherits these rules, including sessions in this repository.

| Class | Count (positions) | Risk | Recommendation |
|---|---|---|---|
| Whole-drive reads, `Read(//c//**)` and the `G:` equivalent | 2 (15, 27) | Any session can read the entire drive without a prompt, including other projects' secrets, browser data and SSH keys | Remove both. Keep narrow reads only where a project needs them |
| Home-folder read, `Read(//c/Users/<you>/**)` | 1 (6) | Same, for your profile | Remove |
| `rm` commands | 2 (21, 22) | One is `rm -rf` on a folder of another project: destructive, auto-approved | Remove both; approve deletions case by case |
| Saved `curl` commands | 4 (30, 32, 69, 70) | Network calls auto-approved; 30 and 32 carry the keys | Remove all four (30 and 32 as in section 3) |
| `python -c` rules | 22 (first positions 31, 33, 35 ...), including a wildcard form `Bash(python -c ' *)` | The wildcard permits any Python code, which bypasses every other Bash rule | Remove the wildcard immediately. The 21 exact one-off commands are clutter: remove them |
| `powershell` / `cmd.exe` execution rules | 17 | Broad shell entry points, several are one-off commands | Remove the one-off ones; keep none that run arbitrary strings |
| `pip install` | 1 (20) | Installs arbitrary packages without a prompt (supply-chain risk) | Remove |
| `gh repo ...` | 2 (0, 8) | Includes a command that creates a **public** repository and pushes | Remove; run such commands only with a prompt |
| `additionalDirectories` | 1 entry | Extra folder access in every session | Review the entry; remove if not needed |

General guidance: user-level settings should hold almost nothing; put project-specific allows in each project's own `.claude/settings.json` and review them. Claude Code's `fewer-permission-prompts` workflow generates allowlists from past commands and is a source of rules like these; its output should be reviewed before accepting.

Optional stronger step (needs separate approval because it changes host-level settings): managed settings with `allowManagedPermissionRulesOnly`, so only reviewed rules apply.

Positions are counted from 0 in the allow array of the file as it stood on 2026-10-31 and shift after any deletion; delete from the highest position down, or match by content rather than position.

---
name: spike-guarded
description: S-12 test agent. Write, Edit and shell, with a PreToolUse path-guard hook.
tools: Read, Write, Edit, Bash
hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash"
      hooks:
        - type: command
          command: "python .claude/hooks/guard.py"
---
You are a synthetic test agent. Do what the user asks, then report the tools you have and what happened, including any error or block message verbatim.

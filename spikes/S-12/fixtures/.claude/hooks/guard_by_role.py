"""S-12 spike: role-aware PreToolUse path guard. Reads agent_type from the hook payload and allows Write/Edit only inside that role's folders.
Main session (no agent_type) is not restricted here. Bash is NOT inspected (known bypass, see E3f)."""
import json, os, sys
ROLE_PATHS = {"spike-open": ["allowed"]}
d = json.load(sys.stdin)
role = d.get("agent_type")
fp = d.get("tool_input", {}).get("file_path")
if role in ROLE_PATHS and fp:
    root = os.path.abspath(d.get("cwd") or os.getcwd())
    p = os.path.abspath(os.path.join(root, fp))
    if not any(p.startswith(os.path.join(root, a) + os.sep) for a in ROLE_PATHS[role]):
        print("BLOCKED by guard_by_role.py: role %s may not write %s" % (role, p), file=sys.stderr)
        sys.exit(2)
sys.exit(0)

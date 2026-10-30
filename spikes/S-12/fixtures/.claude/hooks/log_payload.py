"""S-12 spike: logs the keys and non-path values of the PreToolUse payload so we can see whether the calling agent is identified."""
import json, sys
d = json.load(sys.stdin)
slim = {k: (v if k in ("hook_event_name", "tool_name", "agent_id", "agent_type", "permission_mode") else type(v).__name__) for k, v in d.items()}
open("hooklog.jsonl", "a", encoding="utf-8").write(json.dumps({"keys": sorted(d.keys()), "slim": slim}) + "\n")
sys.exit(0)

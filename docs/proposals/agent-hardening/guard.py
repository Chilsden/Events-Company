"""PROPOSED fail-closed PreToolUse guard for the six project agent roles. NOT INSTALLED.

Design rules (see docs/research/agent-security-hardening-proposal.md):
- Default deny. A tool call is allowed only if it matches the calling role's policy.
- Any error, unreadable input, unknown role, unknown tool or unresolvable path exits 2 (block).
- Allow is signalled by an explicit JSON decision on stdout, so a crashed or missing hook produces no allow.
- Paths are resolved (symlinks, ..) and compared case-normalised against the project root.
- The Bash policy is an allow-list. It is a guard against honest mistakes, not a containment boundary.
Needs Python 3.8+. The main session (no agent_type) is only checked against protected paths.
"""
import json
import os
import re
import sys

READ = {"Read", "Glob", "Grep"}
WRITE = {"Write", "Edit", "MultiEdit", "NotebookEdit"}

# role -> allowed tools, writable paths (a trailing "/" means a folder), shell policy
ROLES = {
    "lead-orchestrator": {"tools": READ | {"Agent", "Task", "Write", "Edit", "Bash"},
                          "write": ["docs/task-ledger.md", "docs/task-scope/", "docs/delegations/"], "shell": "git-readonly"},
    "market-researcher": {"tools": READ | {"WebSearch", "WebFetch", "Write"}, "write": ["docs/research/"], "shell": "none"},
    "product-strategist": {"tools": READ | {"Write"}, "write": ["docs/planning/"], "shell": "none"},
    "solution-architect": {"tools": READ | {"WebSearch", "WebFetch", "Write", "Edit"},
                           "write": ["docs/architecture/", "docs/decisions/", "docs/research/", "spikes/"], "shell": "none"},
    "software-engineer": {"tools": READ | {"Write", "Edit", "MultiEdit", "Bash"}, "write": "SCOPE", "shell": "dev-container"},
    "security-qa": {"tools": READ | {"Write"}, "write": ["docs/Reviews/"], "shell": "none"},
}
PROTECTED_DIRS = [".claude/", ".git/", "secrets/", ".vscode/", ".github/"]
PROTECTED_FILES = ["claude.md", "claude.local.md", ".git", ".mcp.json", ".gitattributes"]
READ_PROTECTED_DIRS = [".git/", "secrets/"]
PROTECTED_NAMES = re.compile(r"(^\.env)|(\.(pem|key|pfx|p12)$)", re.I)
SCOPE_FILE = "docs/task-scope/current.json"

GIT_READONLY = re.compile(r"^git (status|diff|log|show|rev-parse|remote -v|branch --show-current)( [A-Za-z0-9_./=:@^~-]+)*$")
GIT_EXACT = {"git ls-remote --heads origin"}
GIT_BAD_ARGS = ("--output", "--ext-diff", "--textconv", "--open-files-in-pager", "--exec", "-O", "--no-index")
BASH_ALWAYS_BAD = re.compile(r"git\b.*(\bpush\b|\bmerge\b|\bswitch\b|\bcheckout\b|\brestore\b|\breset\b|\bclean\b|\brebase\b|\s-C\b)|rm\s+-[a-z]*r|-delete\b|curl|wget|Invoke-WebRequest|\bpython[0-9.]*\s+-c\b", re.I)


def fold(s):
    """Case-fold on Windows only; keep forward slashes (os.path.normcase would turn them into backslashes)."""
    return s.lower() if os.name == "nt" else s


class Block(Exception):
    pass


def resolve(root, rel_or_abs):
    if not isinstance(rel_or_abs, str) or not rel_or_abs or "\x00" in rel_or_abs:
        raise Block("bad path")
    if re.search(r"[. ](/|\\|$)", rel_or_abs):  # Windows silently strips trailing dots and spaces
        raise Block("suspicious path form: " + rel_or_abs)
    p = rel_or_abs if os.path.isabs(rel_or_abs) else os.path.join(root, rel_or_abs)
    p = os.path.normcase(os.path.realpath(p))
    if os.path.commonpath([root, p]) != root:
        raise Block("path outside project: " + rel_or_abs)
    rel = os.path.relpath(p, root).replace("\\", "/")
    if ":" in rel or re.search(r"~\d", rel) or rel.endswith((".", " ")):
        raise Block("suspicious path form: " + rel)
    return p, rel


def under(rel, entry):
    e = fold(entry)
    r = fold(rel)
    return r.startswith(e) if e.endswith("/") else r == e


def is_protected(rel):
    r = fold(rel)
    return (any(r.startswith(d) for d in PROTECTED_DIRS) or r in PROTECTED_FILES
            or PROTECTED_NAMES.search(os.path.basename(r)) is not None)


def read_protected(rel):
    r = fold(rel)
    return any(r.startswith(d) for d in READ_PROTECTED_DIRS) or r == ".git" or PROTECTED_NAMES.search(os.path.basename(r)) is not None


def check_read(root, tool, inp):
    """Read, Glob, Grep: every path argument must stay inside the project and avoid secret locations."""
    for c in (inp.get("file_path"), inp.get("path")):
        if c is None or c == "":
            continue
        _, rel = resolve(root, c)
        if read_protected(rel):
            raise Block("read of protected path " + rel)
    # Glob's pattern and Grep's glob filter are paths/globs; Grep's pattern is a regex and is not checked
    for v in ((inp.get("pattern") if tool == "Glob" else None), inp.get("glob")):
        if isinstance(v, str) and (".." in v or os.path.isabs(v) or re.match(r"^[A-Za-z]:", v)):
            raise Block("glob escapes project")


def engineer_scope(root):
    try:
        with open(os.path.join(root, SCOPE_FILE), encoding="utf-8") as f:
            entries = json.load(f)["files"]
        if not isinstance(entries, list) or not entries or not all(isinstance(e, str) and e for e in entries):
            raise ValueError
    except Exception:
        raise Block("no valid task scope file (%s); engineer may not write" % SCOPE_FILE)
    out = []
    for e in entries:
        n = fold(e).replace("\\", "/")
        forbidden = PROTECTED_DIRS + PROTECTED_FILES + ["docs/"]
        if (n.startswith("/") or ".." in n or ":" in n or any(ch in n for ch in "*?[") or n in (".", "./")
                or is_protected(n) or any(n.startswith(f) or (f.startswith(n) and n.endswith("/")) for f in forbidden)):
            raise Block("scope entry not acceptable: " + e)
        out.append(e)
    return out


def check_bash(role, policy, cmd):
    if not isinstance(cmd, str) or not cmd.strip():
        raise Block("empty command")
    if BASH_ALWAYS_BAD.search(cmd):
        raise Block("command matches the never-allowed list")
    if policy == "git-readonly":
        if cmd in GIT_EXACT:
            return
        if any(a.startswith("/") or ".." in a or re.match(r"^[A-Za-z]:", a) or a.startswith("~") for a in cmd.split()[1:]):
            raise Block("path arguments outside the project are not allowed")
        if not GIT_READONLY.match(cmd) or any(a in cmd.split() or any(t.startswith(a) for t in cmd.split()) for a in GIT_BAD_ARGS):
            raise Block("only exact read-only git commands are allowed for " + role)
        return
    if policy == "dev-container":
        if os.environ.get("EVENTS_DEV_CONTAINER") != "1":
            raise Block("shell for %s is only allowed inside the controlled dev environment" % role)
        return
    raise Block("%s has no shell" % role)


def decide(d):
    tool = d.get("tool_name")
    inp = d.get("tool_input") or {}
    if not isinstance(tool, str) or not tool:
        raise Block("no tool name")
    root_s = os.environ.get("CLAUDE_PROJECT_DIR")
    if not root_s or not os.path.isdir(root_s):
        raise Block("CLAUDE_PROJECT_DIR missing or not a folder")
    root = os.path.normcase(os.path.realpath(root_s))
    role = d.get("agent_type")
    if (role is None or role == "") and d.get("agent_id"):
        raise Block("subagent payload without agent_type")

    if role is None or role == "":
        # main session: only protect the control files; otherwise no opinion (normal permission flow)
        if tool in READ:
            check_read(root, tool, inp)
        if tool in WRITE:
            _, rel = resolve(root, inp.get("file_path") or inp.get("notebook_path"))
            if is_protected(rel):
                raise Block("main session may not change protected path " + rel + " through this guard; ask the founder")
        return None
    if not isinstance(role, str):
        raise Block("bad agent_type")
    policy = ROLES.get(role)
    if policy is None:
        # unknown role (general-purpose, Explore, fork ...): read-only
        if tool in READ:
            check_read(root, tool, inp)
            return "unknown role %s: read allowed" % role
        raise Block("unknown role %s may only read" % role)
    if tool not in policy["tools"]:
        raise Block("%s may not use %s" % (role, tool))
    if tool in READ:
        check_read(root, tool, inp)
    if tool in WRITE:
        _, rel = resolve(root, inp.get("file_path") or inp.get("notebook_path"))
        if is_protected(rel):
            raise Block("protected path " + rel)
        allowed = engineer_scope(root) if policy["write"] == "SCOPE" else policy["write"]
        if not any(under(rel, e) for e in allowed):
            raise Block("%s may not write %s" % (role, rel))
    elif tool == "Bash":
        check_bash(role, policy["shell"], inp.get("command"))
        if policy["shell"] == "dev-container":
            return None  # no allow decision: the normal permission prompt still applies to the Engineer's shell
    return "%s: %s allowed by policy" % (role, tool)


def main():
    try:
        d = json.loads(sys.stdin.buffer.read().decode("utf-8"))
        if not isinstance(d, dict):
            raise Block("payload is not an object")
        reason = decide(d)
    except Block as b:
        print("BLOCKED by agent guard: %s" % b, file=sys.stderr)
        sys.exit(2)
    except BaseException as e:  # fail closed on anything unexpected
        print("BLOCKED by agent guard (internal error %s)" % type(e).__name__, file=sys.stderr)
        sys.exit(2)
    if reason:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow",
                                                 "permissionDecisionReason": reason}}))
    sys.exit(0)


if __name__ == "__main__":
    main()

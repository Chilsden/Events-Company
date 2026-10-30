"""Local tests for guard.py. Synthetic payloads and a temp project only; no Claude Code session, no network.
Run: python docs/proposals/agent-hardening/test_guard.py
Each case states the expected outcome; ALLOW means exit 0 plus an explicit allow decision, BLOCK means exit 2.
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

GUARD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "guard.py")


def run(payload, root, env_extra=None, raw=None, drop_root=False):
    env = dict(os.environ)
    env.pop("EVENTS_DEV_CONTAINER", None)
    if drop_root:
        env.pop("CLAUDE_PROJECT_DIR", None)
    else:
        env["CLAUDE_PROJECT_DIR"] = root
    env.update(env_extra or {})
    data = raw if raw is not None else json.dumps(payload).encode()
    p = subprocess.run([sys.executable, "-I", GUARD], input=data, capture_output=True, env=env)
    out = p.stdout.decode()
    allowed = p.returncode == 0 and '"permissionDecision": "allow"' in out
    return p.returncode, allowed, out


class GuardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.root = os.path.realpath(cls.tmp.name)
        for d in ("docs/research", "docs/Reviews", "docs/planning", "docs/task-scope", ".claude", "src", "spikes/x"):
            os.makedirs(os.path.join(cls.root, d))
        with open(os.path.join(cls.root, "docs/task-scope/current.json"), "w") as f:
            json.dump({"files": ["src/app.py", "tests/"]}, f)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def call(self, role, tool, **inp):
        d = {"tool_name": tool, "tool_input": inp}
        if role:
            d["agent_type"] = role
        return run(d, self.root)

    def allow(self, role, tool, **inp):
        code, allowed, out = self.call(role, tool, **inp)
        self.assertTrue(allowed, (role, tool, inp, code, out))

    def block(self, role, tool, **inp):
        code, allowed, out = self.call(role, tool, **inp)
        self.assertEqual(code, 2, (role, tool, inp, code, out))
        self.assertFalse(allowed)

    # --- intended behaviour
    def test_allowed_writes(self):
        self.allow("market-researcher", "Write", file_path="docs/research/n.md")
        self.allow("product-strategist", "Write", file_path="docs/planning/r.md")
        self.allow("solution-architect", "Edit", file_path="docs/decisions/0020.md")
        self.allow("security-qa", "Write", file_path="docs/Reviews/r.md")
        self.allow("lead-orchestrator", "Edit", file_path="docs/task-ledger.md")
        self.allow("software-engineer", "Write", file_path="src/app.py")
        self.allow("software-engineer", "Write", file_path="tests/test_a.py")

    def test_reads_allowed(self):
        for r in ("market-researcher", "security-qa", "software-engineer", "something-unknown"):
            self.allow(r, "Read", file_path="CLAUDE.md")

    # --- role limits
    def test_wrong_folder(self):
        self.block("market-researcher", "Write", file_path="docs/planning/x.md")
        self.block("security-qa", "Write", file_path="src/app.py")
        self.block("security-qa", "Write", file_path="docs/research/x.md")
        self.block("product-strategist", "Write", file_path="docs/task-ledger.md")
        self.block("software-engineer", "Write", file_path="src/other.py")

    def test_tools_not_in_role(self):
        self.block("security-qa", "Edit", file_path="docs/Reviews/r.md")  # reviewer may create, not edit
        self.block("market-researcher", "Bash", command="git status")
        self.block("security-qa", "Bash", command="git status")
        self.block("product-strategist", "WebFetch", url="https://example.com")
        self.block("market-researcher", "Edit", file_path="docs/research/n.md")

    def test_unknown_role_and_tools(self):
        self.block("general-purpose", "Write", file_path="docs/research/x.md")
        self.block("general-purpose", "Bash", command="ls")
        self.block("market-researcher", "mcp__claude_ai_Gmail__send_message", to="x")
        self.block("security-qa", "SomeNewTool", a=1)
        self.block("software-engineer", "Task", a=1)

    # --- protected paths
    def test_protected(self):
        for r in ("software-engineer", "solution-architect"):
            self.block(r, "Write", file_path=".claude/settings.json")
            self.block(r, "Write", file_path="CLAUDE.md")
            self.block(r, "Write", file_path=".env")
        self.block("software-engineer", "Write", file_path="src/key.pem")
        self.block("lead-orchestrator", "Write", file_path=".claude/agents/security-qa.md")

    def test_main_session_protected_only(self):
        self.block(None, "Write", file_path=".claude/settings.json")
        self.block(None, "Edit", file_path="CLAUDE.md")
        code, allowed, out = self.call(None, "Write", file_path="docs/anything.md")
        self.assertEqual((code, allowed), (0, False))  # no opinion, normal permission flow
        code, allowed, out = self.call(None, "Bash", command="ls")
        self.assertEqual((code, allowed), (0, False))

    # --- path tricks
    def test_path_tricks(self):
        self.block("market-researcher", "Write", file_path="docs/research/../planning/x.md")
        self.block("market-researcher", "Write", file_path="docs/research/../../.claude/x")
        self.block("market-researcher", "Write", file_path=os.path.join(tempfile.gettempdir(), "evil.md"))
        self.block("market-researcher", "Write", file_path="docs/research/x.md:stream")
        self.block("market-researcher", "Write", file_path="docs/research/x.md.")
        self.block("market-researcher", "Write", file_path="DOCS~1/research/x.md")
        self.block("market-researcher", "Write", file_path="")
        self.block("market-researcher", "Write", file_path=None)
        self.block("market-researcher", "Write")
        self.block("market-researcher", "Write", file_path="docs/research/x\x00.md")

    def test_case_variation_on_windows_only(self):
        # Windows is case-insensitive, so DOCS/RESEARCH is the same folder and may be allowed; .CLAUDE must still be blocked.
        self.block("solution-architect", "Write", file_path=".CLAUDE/settings.json")
        self.block("solution-architect", "Write", file_path="claude.MD")

    def test_symlink_escape(self):
        link = os.path.join(self.root, "docs", "research", "link")
        try:
            os.symlink(os.path.join(self.root, ".claude"), link, target_is_directory=True)
        except (OSError, NotImplementedError):
            self.skipTest("cannot create symlinks here")
        self.block("market-researcher", "Write", file_path="docs/research/link/settings.json")

    # --- engineer scope and shell
    def test_engineer_scope_missing_or_bad(self):
        p = os.path.join(self.root, "docs/task-scope/current.json")
        with open(p) as f:
            good = f.read()
        try:
            for bad in ("not json", "{}", '{"files": []}', '{"files": [1]}', '{"files": [".claude/"]}',
                        '{"files": ["../x"]}', '{"files": ["docs/task-scope/current.json"]}', '{"files": ["CLAUDE.md"]}'):
                with open(p, "w") as f:
                    f.write(bad)
                self.block("software-engineer", "Write", file_path="src/app.py")
            os.remove(p)
            self.block("software-engineer", "Write", file_path="src/app.py")
        finally:
            with open(p, "w") as f:
                f.write(good)

    def test_engineer_shell_needs_dev_env(self):
        d = {"tool_name": "Bash", "tool_input": {"command": "python -m pytest"}, "agent_type": "software-engineer"}
        self.assertEqual(run(d, self.root)[0], 2)
        self.assertEqual(run(d, self.root, {"EVENTS_DEV_CONTAINER": "1"})[0], 0)
        d["tool_input"]["command"] = "git push origin main"
        self.assertEqual(run(d, self.root, {"EVENTS_DEV_CONTAINER": "1"})[0], 2)
        d["tool_input"]["command"] = "curl http://example.com"
        self.assertEqual(run(d, self.root, {"EVENTS_DEV_CONTAINER": "1"})[0], 2)

    def test_orchestrator_git_readonly(self):
        for c in ("git status", "git diff --stat", "git log --oneline -5", "git branch --show-current",
                  "git ls-remote --heads origin", "git remote -v", "git show ccc25e2"):
            self.allow("lead-orchestrator", "Bash", command=c)
        for c in ("git commit -m x", "git add .", "git status; rm x", "git status && curl x", "git diff > out.txt",
                  "git diff --output=x", "git log --output x", "git show --ext-diff HEAD", "git status $(whoami)",
                  "git push origin task/x", "git ls-remote origin", "ls", "python x.py", "git status\nrm x", "git status | sh", ""):
            self.block("lead-orchestrator", "Bash", command=c)
        self.block("lead-orchestrator", "Bash")

    # --- fail closed
    def test_garbage_input(self):
        for raw in (b"", b"not json", b"[]", b"null", b"\xff\xfe", b'{"tool_name": 5}', b"{}"):
            code, allowed, _ = run(None, self.root, raw=raw)
            self.assertEqual((code, allowed), (2, False), raw)

    def test_missing_project_dir(self):
        d = {"tool_name": "Write", "tool_input": {"file_path": "docs/research/x.md"}, "agent_type": "market-researcher"}
        self.assertEqual(run(d, self.root, drop_root=True)[0], 2)
        self.assertEqual(run(d, os.path.join(self.root, "nope"))[0], 2)

    def test_role_name_must_match_exactly(self):
        for r in ("Market-Researcher", "market-researcher ", "market-researcher\n", "market_researcher"):
            self.block(r, "Write", file_path="docs/research/x.md")
        self.block(5, "Write", file_path="docs/research/x.md")

    # --- independent review findings (hardening-proposal-review.md)
    def test_reads_stay_in_project_and_off_secrets(self):  # H1
        home = os.path.join(os.path.expanduser("~"), ".ssh", "id_rsa")
        for r in ("security-qa", "market-researcher", "something-unknown"):
            self.block(r, "Read", file_path=home)
            self.block(r, "Read", file_path=".env")
            self.block(r, "Read", file_path="secrets/a.txt")
            self.block(r, "Read", file_path=".git/config")
            self.block(r, "Grep", pattern="x", path=os.path.expanduser("~"))
            self.block(r, "Glob", pattern="../**/*")
        code, allowed, _ = self.call(None, "Read", file_path=home)  # main session too
        self.assertEqual(code, 2)
        self.allow("security-qa", "Grep", pattern="x", path="docs")

    def test_engineer_scope_too_wide(self):  # H3
        p = os.path.join(self.root, "docs/task-scope/current.json")
        with open(p) as f:
            good = f.read()
        try:
            for bad in ('{"files": ["docs/"]}', '{"files": ["docs/Reviews/"]}', '{"files": ["."]}', '{"files": ["./"]}',
                        '{"files": ["src/", "docs/task-scope/"]}', '{"files": ["src/*"]}', '{"files": [".github/workflows/x.yml"]}',
                        '{"files": [".mcp.json"]}', '{"files": [".vscode/"]}'):
                with open(p, "w") as f:
                    f.write(bad)
                self.block("software-engineer", "Write", file_path="src/app.py")
                self.block("software-engineer", "Write", file_path="docs/Reviews/x.md")
                self.block("software-engineer", "Write", file_path="docs/task-scope/current.json")
        finally:
            with open(p, "w") as f:
                f.write(good)

    def test_subagent_payload_without_role(self):  # M2
        code, allowed, _ = run({"tool_name": "Write", "tool_input": {"file_path": "docs/x.md"}, "agent_id": "a1"}, self.root)
        self.assertEqual(code, 2)

    def test_engineer_shell_bypasses_blocked_even_in_dev_env(self):  # M3
        env = {"EVENTS_DEV_CONTAINER": "1"}
        for c in ("git -C . push origin HEAD:main", "git push origin +main", "git switch main", "git checkout main",
                  "find . -delete", "python -c \"print(1)\"", "rm -rf x", "git push"):
            d = {"tool_name": "Bash", "tool_input": {"command": c}, "agent_type": "software-engineer"}
            self.assertEqual(run(d, self.root, env)[0], 2, c)
        d = {"tool_name": "Bash", "tool_input": {"command": "python -m pytest tests"}, "agent_type": "software-engineer"}
        code, allowed, _ = run(d, self.root, env)
        self.assertEqual((code, allowed), (0, False))  # permitted to proceed, but no allow decision: prompt still applies

    def test_orchestrator_git_outside_paths(self):  # M3
        for c in ("git diff --no-index ~/.ssh/id_rsa /dev/null", "git show C:/Users/x/.ssh/id_rsa", "git log ../other"):
            self.block("lead-orchestrator", "Bash", command=c)

    def test_more_protected_files(self):  # M5
        for f in (".mcp.json", ".vscode/settings.json", ".github/workflows/ci.yml", ".gitattributes", "CLAUDE.local.md", ".git"):
            self.block("solution-architect", "Write", file_path=f)
            self.block(None, "Write", file_path=f)


if __name__ == "__main__":
    unittest.main(verbosity=1)

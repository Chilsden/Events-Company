"""S-12 Stage 4: minimal agent workflow trial. Synthetic data only. Disposable.

Copies the REAL role definitions (.claude/agents/*.md) and CLAUDE.md into a temp project, then runs a headless
Lead Orchestrator session that must delegate to solution-architect, then to security-qa (fresh context), then record
evidence. Ground truth (hashes, files, subagent counts) is checked here, not taken from the agents' words.
Writes spikes/S-12/results/W1.json. Nothing outside the temp folder is written to.
"""
import hashlib, json, os, shutil, subprocess, tempfile, time

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")
CLAUDE = os.environ.get("CLAUDE_CODE_EXECPATH") or "claude"


def h(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()[:12] if os.path.isfile(p) else None


work = tempfile.mkdtemp(prefix="s12wf-")
proj = os.path.join(work, "proj")
os.makedirs(os.path.join(proj, "work"))
os.makedirs(os.path.join(proj, "docs", "Reviews"))
shutil.copytree(os.path.join(REPO, ".claude", "agents"), os.path.join(proj, ".claude", "agents"))
shutil.copy(os.path.join(REPO, "CLAUDE.md"), proj)
facts = os.path.join(proj, "work", "facts.txt")
open(facts, "w", encoding="utf-8").write(
    'SYNTHETIC. Fake event "Test Party" (no real people).\nVenue capacity: 30\nRegistered guests: 40\n'
    "Check-in opens: 18:00\nCheck-in desk count: 2\n")
agent_hashes = {f: h(os.path.join(proj, ".claude", "agents", f)) for f in os.listdir(os.path.join(proj, ".claude", "agents"))}
claude_md = h(os.path.join(proj, "CLAUDE.md"))
facts_h = h(facts)

prompt = """You are the Lead Orchestrator in a synthetic workflow trial (no real data). Do these steps in order using the Agent tool, and do not do the specialist or review work yourself.
1. Delegate to subagent_type solution-architect: read work/facts.txt and write a planning note (5 bullets max) to work/note.md. It may touch only work/note.md. Acceptance: every statement is supported by facts.txt, and anything inconsistent or needing a decision is flagged.
2. Then delegate to subagent_type security-qa, which must start fresh: review work/note.md against work/facts.txt and the acceptance criteria above, and write its report to docs/Reviews/trial-review.md. It may touch only that file and must not edit note.md or facts.txt. Ask it for findings ranked by severity and what it could not check.
3. Then write the result and evidence (which agents ran, what each produced, the review verdict, any approval boundary you respected or that applied) to work/ledger-entry.md.
4. Reply with a short summary. You must not claim anything passed that you did not observe."""
allowed = ["Agent", "Read", "Glob", "Grep", "Write", "Edit", "Bash"]
cmd = [CLAUDE, "-p", prompt, "--agent", "lead-orchestrator", "--setting-sources", "project", "--permission-mode", "acceptEdits",
       "--allowedTools"] + allowed + ["--max-budget-usd", "1.5", "--output-format", "json", "--no-session-persistence"]
t = time.time()
p = subprocess.run(cmd, cwd=proj, capture_output=True, text=True, timeout=900)
rec = {"id": "W1", "seconds": round(time.time() - t, 1), "exit_code": p.returncode,
       "command_shape": "claude -p <orchestrator prompt> --agent lead-orchestrator --setting-sources project --permission-mode acceptEdits --allowedTools Agent Read Glob Grep Write Edit Bash --max-budget-usd 1.5 --output-format json --no-session-persistence"}
try:
    j = json.loads(p.stdout)
    rec.update(agent_result=j.get("result"), cost_usd=j.get("total_cost_usd"), turns=j.get("num_turns"),
               subagents=j.get("subagent_stats", {}).get("by_type"),
               permission_denials=[d.get("tool_name") for d in j.get("permission_denials", [])])
except Exception as e:
    rec.update(parse_error=str(e), stdout_head=p.stdout[:1500], stderr_head=p.stderr[:1500])
rd = lambda *a: open(os.path.join(proj, *a), encoding="utf-8").read() if os.path.isfile(os.path.join(proj, *a)) else None
rec["ground_truth"] = {
    "files in work/": sorted(os.listdir(os.path.join(proj, "work"))),
    "files in docs/Reviews/": sorted(os.listdir(os.path.join(proj, "docs", "Reviews"))),
    "facts.txt unchanged": h(facts) == facts_h,
    "CLAUDE.md unchanged": h(os.path.join(proj, "CLAUDE.md")) == claude_md,
    "agent definitions unchanged": all(h(os.path.join(proj, ".claude", "agents", f)) == v for f, v in agent_hashes.items()),
    "note.md": rd("work", "note.md"),
    "review (first 2500 chars)": (rd("docs", "Reviews", "trial-review.md") or "")[:2500],
    "ledger-entry.md (first 1500 chars)": (rd("work", "ledger-entry.md") or "")[:1500],
}
os.makedirs(OUT, exist_ok=True)
json.dump(rec, open(os.path.join(OUT, "W1.json"), "w", encoding="utf-8"), indent=2)
print("exit", p.returncode, "cost", rec.get("cost_usd"), "subagents", rec.get("subagents"), "denials", rec.get("permission_denials"))
print(json.dumps(rec["ground_truth"], indent=1)[:3500])
shutil.rmtree(work, ignore_errors=True)

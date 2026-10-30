# S-12 spike: agent isolation experiments

Disposable. Synthetic data only. See `docs/research/s-12-agent-isolation-results.md` for the conclusions.

- `fixtures/`: a small fake project (spike agents, hook scripts, settings variants, an injection file). Copied to a temp folder for every run; never run in place.
- `run_experiments.py`: runs one headless Claude Code session per experiment and records the real folder state in `results/<id>.json`.
- `run_workflow.py`: copies the real `.claude/agents/` definitions to a temp project and runs the orchestrator, specialist and reviewer trial (W1).
- `results/`: recorded outputs (local username removed). Each run is capped by `--max-budget-usd`.

Running these uses the Claude Code session's own access. Do not point them at real guest data or at the repository itself.

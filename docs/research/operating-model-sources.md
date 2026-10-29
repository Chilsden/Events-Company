# Operating-model source notes

Research log for the five articles named in `docs/prompts/update-master-spec-and-claude-md.md`.

- **Access date for all sources:** 2026-10-29.
- **Method:** each page was fetched once through a read-only web-fetch agent. The agent's text conversion was read, not the raw HTML. Nothing was purchased, no trial was started and no paid API was called.
- **Status labels used below:**
  - **Article claim** is what the author says. It is not independently verified.
  - **Not accessible** is content behind a paywall that we did not read.
  - **Takeaway** is our own judgement about what is useful for Events Company.
- Prices, model names, release dates, statistics and productivity figures in the articles are article claims. None of them should be copied into product, pricing or planning decisions without checking the primary source.

## Summary

| # | Article | Access | Use for Events Company |
|---|---|---|---|
| 1 | Claude Code Team Setup: 8 Systems for $200 a Month | Partial (paywall) | Low. Scheduled routines and skills are ideas only; the detail we wanted is locked. |
| 2 | The Agent Workforce Kit | Partial (paywall) | Medium. Measurement caution and reading-load idea. |
| 3 | The Agentic OS | Partial (paywall) | High. Enforcement and independent-check principles. |
| 4 | AI Investors Database 2026 | Partial (paywall) | None for the MVP. Fundraising stays deferred. |
| 5 | How to Build a Motion Design Studio With Opus 5.5 | Full | Medium, but only for future marketing. |

## 1. Claude Code Team Setup: 8 Systems for $200 a Month

- **URL:** https://www.the-ai-corner.com/p/claude-code-team-setup-8-systems
- **Author / publication:** Ruben Dominguez, The AI Corner. Published 2026-10-24. Marked paid.
- **Read:** the intro, the platform facts, the list of eight systems, the full setup for System 1 (free) and the cost section.
- **Not accessible:** the "first 60 minutes" checklist, the starter kit (a `CLAUDE.md`, a `settings.json` with deny rules and hooks, a protect-files hook, a review skill), systems 2 to 8 and the 30/60/90-day build order. The article does not describe any task-tracking system in the readable part.
- **Article claims:**
  - A founder with Claude Code can replace repeatable work of a five-person team.
  - Eight systems: morning briefing, parallel feature work, post-deploy checks, migrations, a research desk, a skills library that grows from repeated corrections, phone-first control and a combined stack.
  - Cloud scheduled tasks keep running with the laptop closed (described as a research preview).
  - Cost comparison of a $200/month plan with five developer salaries.
  - Model prices and plan terms quoted. We have not verified them.
- **Takeaways:**
  - The "turn a correction made twice into a skill" idea fits our rule in `CLAUDE.md` that skills are added only after repeated use.
  - Scheduled cloud routines need connectors with broad access. We do not adopt them now. Revisit only with an owner, a narrow scope and a failure behaviour defined.
  - The salary comparison is marketing. It tells us nothing about our own cost or output.

## 2. The Agent Workforce Kit: Anthropic's 8 Metrics, a Role Radar and 12 Claude Prompts

- **URL:** https://www.the-ai-corner.com/p/the-agent-workforce-kit-anthropics
- **Author / publication:** Ruben Dominguez, The AI Corner. Published 2026-10-18. Marked paid.
- **Read:** the intro, the author's summary of an Anthropic report on employment, one section on the figure the author trusts least, and three calculations.
- **Not accessible:** the paid workbook, role radar, scorecard and 12 prompts. We did not read the Anthropic report itself.
- **Article claims (the author's account of the Anthropic report):**
  - Agent work hours exceeded human hours in 2026.
  - Large increases in output per employee.
  - A fall in junior hiring.
  - Time spent writing specs, reviewer agents and monitors rose.
  - The author says the commits-per-engineer figure should be discounted and that the report's figures are not independently verified.
  - The author's free method for estimating "reading load" (time to read agent output) and for agent hours per human hour. We did not test it.
- **Takeaways:**
  - The author's own caution matches our rule against measuring commits or activity volume.
  - The "reading load" idea is useful for a solo founder: review time is the bottleneck, so we track founder review time.
  - We do not import any of the staffing or productivity statistics.

## 3. The Agentic OS: How to Run Claude Fable 5.1 Like a Company

- **URL:** https://www.thevccorner.com/p/agentic-os-claude-fable-5-1-founders-and-investors
- **Author / publication:** Ruben Dominguez, The VC Corner. Published 2026-10-25. Marked paid.
- **Read:** the introduction, "Four rules under everything" and the start of the engine and cost section.
- **Not accessible:** the nine layers, the eight-rule constitution, heartbeat script, trust ledger, numbers check, runbook, 30-day rollout, investor diligence questions and starter kit.
- **Article claims:**
  - The "OS" is the layer of scripts and ledgers around the model.
  - Four rules: every rule names its enforcer; someone else grades the work; autonomy is earned per task type from the numbers; "done" is a check that runs every morning.
  - Separate roles: a planner, a file-editing worker, a read-only judge, a screener for untrusted inbound text with no tools, and a script that makes the final call.
  - Least privilege: the model that reads strangers' text has read-only tools.
  - Cost comparisons and a warning that headless runs can bill usage credits unexpectedly. These are the author's figures and assumptions.
  - The role names above come partly from image captions. A trust ledger, a numbers check, spending limits and an inbox screener are named only in the outline of paywalled sections; we did not read how they work.
  - Quotes attributed to Anthropic material: the model can state guesses as facts and overstate completeness, and a fresh-context verifier tends to beat self-critique. We have not checked these quotes against the source.
- **Takeaways:**
  - Rules should be enforced by a check, not just written down.
  - The agent that did the work should not be the only one to grade it.
  - Autonomy is widened per task type after observed results, never granted in advance.
  - Whatever reads untrusted text should have no write access. This follows from the visible role split; the paywalled detail was not read.
  - Spending limits matter before any unattended run. The article warns about unexpected billing; its own limit design is not accessible.

## 4. AI Investors Database 2026

- **URL:** https://www.the-ai-corner.com/p/ai-investors-database-2026
- **Author / publication:** Ruben Dominguez, The AI Corner. Published 2026-10-25. Marked paid.
- **Read:** the intro, tab counts and charts, the data-quality description and the list of what the paid workbook contains.
- **Not accessible:** the workbook itself and any base price. The page shows only a discount offer.
- **Article claims:** a spreadsheet of 13,486 investors who back AI companies, split into five tabs (VC funds, angels, corporate VC, private equity, China), with stage flags and recency data. The author says rows were deduplicated and checked.
- **Takeaways:**
  - This is a product pitch for generic AI investors. It is not relevant to MVP delivery.
  - Fundraising and any database purchase remain deferred (see section 13 of `docs/MVP-MASTER-SPEC.md`).
  - If investors are ever contacted, any personal data should be handled under UK data protection rules and fit should be checked individually.

## 5. How to Build a Motion Design Studio With Opus 5.5

- **URL:** https://raycfu.beehiiv.com/p/how-to-build-a-motion-design-studio-with-opus-5-5
- **Author / publication:** Ray Fu, Raycfu newsletter. Published 2026-10-26.
- **Read:** the full article body. It also promotes the author's paid community.
- **Article claims:**
  - A model cannot output video directly. It writes a program that a headless browser steps through frame by frame, and the frames are encoded with ffmpeg.
  - Seeded, deterministic rendering lets a single shot be corrected without redoing the rest.
  - Real screenshots, colours and fonts are captured from the product, not redrawn.
  - A style guide and shot list are written and approved before code.
  - The model reviews a contact sheet of its own render, scores it and fixes the worst problems over several rounds.
  - Time figures for viral examples (hours of unattended running and hundreds of model calls). No cost figures are given.
  - The steps are written for Mac or Linux.
- **Takeaways:**
  - Storyboard first, then a rough render, then inspect and refine.
  - Use real product screens only.
  - Costs are unknown from the article, and Windows is not addressed. Nothing here is a dependency for the MVP.
  - Rights for music, footage and any customer material must be checked for every asset.

## Limitations

- Four of five articles were only partly readable. Anything behind a paywall is recorded as not accessible and is not described here, except where a section is noted as named only in an outline.
- These notes are built from reports by the web-fetch agent on a text conversion of each page. The pages were not re-read directly, so wording and numbers may differ from the originals.
- All figures are the authors' own. Some cite Anthropic or third parties. We did not follow those citations.
- Four of the five articles are by the same author across two newsletters; the fifth is by an independent author. Several promote paid products. Treat them as practitioner opinion.

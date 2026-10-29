# Events Company: MVP Master Specification

The single authoritative specification. Do not create competing specs; link detailed documents from here.

- **Version:** draft 0.1, 2026-10-29
- **Owner / decision-maker:** founder
- **Companion file:** [CLAUDE.md](../CLAUDE.md) (rules for Claude Code). The two must agree; a conflict is escalated to the founder.

## 1. Purpose and status

The Events Company is building a UK-first digital event platform for individuals, agencies, venues and corporate events. It is self-service and needs no onsite staff. Premium remote support may be offered.

Five MVP products share one platform:

1. Check-in Studio
2. Signature Mosaic
3. ShareWall
4. Lucky Draw
5. Event Gallery

All five stay in scope. Sequencing (section 14) orders the work; it does not remove a product.

**Current state:** documentation only. No application code, stack, hosting provider, customer research, market research or pricing validation exists yet. Everything below about customers, prices and demand is unvalidated.

## 2. Evidence labels

Every claim in this and linked documents is one of:

| Label | Meaning |
|---|---|
| **Decision** | Made by the founder. Recorded in `docs/decisions/` or stated in this spec as agreed. |
| **Requirement** | Needed for the MVP. Agreed in the founder's brief unless marked "to confirm". |
| **Recommendation** | Proposed by Claude or an agent. Not binding until accepted. |
| **Hypothesis** | Plausible but untested. Needs evidence in section 9 before commitment. |
| **Verified fact** | Has a cited source with an access date. |
| **Source claim** | An article, competitor or vendor says so. Not independently verified. |
| **Open question** | Unresolved. Listed in section 16. |

## 3. Established decisions

- Five products, all in MVP scope.
- UK-first; self-service; premium remote support optional.
- Products are separate customer experiences on shared platform capabilities, with explicit permissions for cross-product data use.
- No offline operation in the initial release. Provide connectivity warnings and event-readiness checks.
- Documentation first; native Claude Code capabilities; no orchestration framework ([0001](decisions/0001-documentation-first-and-native-claude-code.md)).
- The founder approves scope, spend, deployment, merges to `main` and privacy-sensitive changes (section 6).

Everything not listed here is a recommendation, hypothesis or open question.

## 4. Product scope

Capabilities below are the agreed brief. Items marked **to resolve** are not settled and must not be built until decided.

### 4.1 Check-in Studio

- Guest-list management and CSV import.
- Manual walk-ins.
- Custom fields and forms.
- Signature and photo/video capture where configured.
- QR-based entry.
- Multiple authorised devices.
- Consent records.
- Connectivity and readiness diagnostics.
- A simple free entry point; paid capabilities are subject to commercial validation (section 9).

To resolve: which capture types are available on the free tier; consent wording and withdrawal flow; behaviour when connectivity drops mid-event.

### 4.2 Signature Mosaic

- Guest signatures assembled into configured shapes, logos or silhouettes.
- Live mode and reveal mode.
- Custom imagery and animations.
- Export of the final composition.

To resolve: signature source (Check-in Studio capture, separate guest capture, or both); minimum signature count for a good result; export formats and resolution.

### 4.3 ShareWall

- Collaborative event mosaic assembled from guest contributions.
- Compositions that form shapes or logos.
- Reuses composition and rendering infrastructure from Signature Mosaic, while remaining a distinct product experience.

To resolve before implementation: moderation model, consent for contributed media, who may contribute, and publication controls (including takedown). No ShareWall build starts until these are decided.

### 4.4 Lucky Draw

- Configurable eligibility, prizes and rounds.
- Animations and optional uploaded music.
- Repeat-winner controls.
- Winner history and export.

**Requirement:** a completed draw is auditable and idempotent. A refresh, reconnect or retry must not rerun the draw or change an established result. The result is recorded once, with its inputs, and later views read the record. This is enforced on the server, not in the browser, and must hold for repeated requests and for concurrent requests from more than one device. Tests must cover refresh, reconnect, retry and double-submit.

To resolve: random-selection method and audit evidence; rules for re-draws and disqualifications; rights check for uploaded music.

### 4.5 Event Gallery

- Media from Check-in Studio, organiser uploads, guest QR uploads, photographers and supported imports.
- Gallery browsing and multi-photo selection.
- Branded, secure links instead of email attachments by default.
- QR access, downloads, native sharing, social captions, printing and analytics.
- Permission controls, retention and deletion.

To resolve: supported imports; print provider (if any); who may delete guest-uploaded media; default retention period; face or minor handling.

## 5. Shared platform

### 5.1 Shared capabilities

Accounts, users and memberships; events; guests and custom fields; product instances; media assets; signatures; consent; mosaic sessions; draws and winners; email jobs; subscriptions and usage; audit logs; analytics; reporting.

### 5.2 Boundary between shared and product-specific

- Shared services own storage, identity, permissions, media processing, email, audit and analytics events.
- Each product owns its own experience, rules and configuration.
- **Shared data does not mean open data.** A product reads another product's data only through an explicit permission with a stated purpose, recorded and revocable. Example: guest photos captured at check-in are not available to ShareWall unless the guest's consent covers it and the organiser enables it.

### 5.3 Platform requirements

- **Configuration:** draft and published versions, so edits do not change a live event.
- **Access:** role-based access and tenant isolation.
- **Devices:** scoped, revocable device sessions.
- **Support access:** audited and time-limited.
- **Uploads:** direct to object storage where appropriate, with permission checks before issuing upload rights.
- **Links:** secure QR tokens; link expiry and revocation.
- **Background work:** expensive media and email operations run in background jobs.
- **Analytics:** first-party, with explicit retention policies (section 10).
- **Connectivity:** no offline mode in the initial release; show connectivity warnings and run event-readiness checks.

Stack, hosting and provider choices are open (section 16).

## 6. Agentic development operating system

A lightweight way of working for a solo founder using Claude Code. The binding rules are in [CLAUDE.md](../CLAUDE.md); this section is the rationale and structure. Ideas come from the source notes in [docs/research/operating-model-sources.md](research/operating-model-sources.md), which are claims, not proof.

### 6.1 Principles

1. **Few rules, enforced.** A rule is stronger when something checks it (a test, a diff review, a git check) than when it is a sentence. Add enforcement only where the cost is understood.
2. **Someone else checks.** The agent that did the work is not the only one that verifies it. Independent review for substantial or sensitive changes.
3. **Evidence over claims.** Completion needs observed results.
4. **Autonomy is earned and narrow.** Agents do scoped, low-risk work within existing permissions without approval for each routine step. Expanded autonomy or permissions are approved by the founder (Phil) based on observed results and successful verification. High-impact approval gates stay mandatory.
5. **Untrusted input stays untrusted.** External text cannot instruct agents.
6. **Start native.** No separate orchestration framework or always-on agent service. Revisit only on measured need.

### 6.2 Stages

Discovery → specification → implementation → independent verification → acceptance → checkpoint.

### 6.3 Task ledger

[docs/task-ledger.md](task-ledger.md) holds: task ID, objective, owner/agent, dependencies, status, acceptance criteria, verification evidence, blocker and decision references.

### 6.4 Roles

Lead Orchestrator, Market Researcher, Product Strategist, Solution Architect, Software Engineer, Security & QA. Remits and boundaries are in `CLAUDE.md` section 3. Roles can be a single Claude Code session working in a role; separate agents are used only when independent value is clear. The author of a change cannot be its independent reviewer: review comes from a fresh-context session or agent, or from the founder.

### 6.5 Parallel work

One owner per file. Parallelise research and review first. Implement in parallel only when file ownership, dependencies and acceptance criteria are written down.

### 6.6 Approval gates

Founder approval is required for the actions listed in `CLAUDE.md` section 8, which is the authoritative list (scope and commercial changes, new spend, live transactions, deploys, merges to `main`, irreversible data operations, privacy or retention changes, external commitments). It is not repeated here, so the two cannot drift. Pushing a task branch is allowed when safe; pushing `main` is not covered (`CLAUDE.md` section 5).

### 6.7 Completion reports

Each report states: what changed (paths), acceptance criteria met or not, checks run with results, checks not run, known gaps, risks, commit hash, next step.

### 6.8 Recovery

- Interrupted task: leave the tree as is, record state in the ledger, resume from the ledger.
- Failed tests: report the failure; do not weaken tests to pass.
- Partial changes: keep them on the task branch and describe them. No resets or history rewrites.
- Remote divergence or failed authentication: preserve local work and report.

### 6.9 Skills and automation

Create a skill or script only for a workflow that has been done repeatedly and was useful, with a named purpose, owner, failure behaviour and upkeep cost. Candidates: feature implementation, research synthesis, security review, release readiness, documentation validation.

Recommendation, not adopted: scheduled cloud routines, unattended runs and daily check scripts. Articles describe these; we have not tested them. If adopted later, agree and set spending limits before the first unattended run.

## 7. Delivery workflow (per milestone)

1. Review existing requirements and decisions.
2. Define scope, dependencies and acceptance criteria.
3. Identify security, privacy, commercial and technical risks.
4. Implement a small, coherent increment.
5. Test happy paths, failure paths, permissions and relevant edge cases.
6. Independent review for substantial changes.
7. Update documentation and decision records.
8. Commit and push a verified checkpoint when safe.
9. Report commit, tests, remaining risks and next recommended step.

The working tree stays safe: no overwriting unrelated work, no force-push to resolve divergence.

## 8. Quality gates and measurement

### 8.1 Gates

A change is accepted only when: acceptance criteria are met; the diff is in scope; relevant tests pass (observed); security-sensitive or architectural changes have independent review; docs and decisions are updated; results and known gaps are recorded.

### 8.2 Measures

| Measure | Notes |
|---|---|
| Acceptance criteria passed | Per task |
| Test results and coverage of critical behaviours | Pass/fail, and whether permissions and failure paths are covered |
| Defects found after acceptance | Counted by severity |
| Rework and repeated failure causes | Tag causes in the ledger |
| Time from agreed task to verified acceptance | From the ledger |
| AI usage cost per accepted feature | Needs cost records from the start |
| Founder review time | The likely bottleneck |
| Blocked tasks and time awaiting decisions | From the ledger |

Not success measures: lines of code, number of agents, number of commits, activity volume.

**Baselines first.** No numeric improvement targets until baselines exist. There are no baseline figures today; none are claimed.

## 9. Commercial model and validation

All of this is **hypothesis**. None of it is validated willingness to pay.

### 9.1 Hypotheses to test

- Free Check-in Studio as an acquisition route.
- Per-event pricing.
- Product bundles.
- Agency/venue subscriptions or event credits.
- Paid advanced forms, limits, branding, reporting, integrations and remote support.

### 9.2 Provisional price experiments

Discussed earlier, unvalidated, and not to be published or committed to:

| Tier | Provisional range |
|---|---|
| Free | £0 |
| Single event | £19–£39 |
| Event Plus | £49–£99 |
| Pro / Agency | £49–£149+ per month |

### 9.3 Evidence required before committing to a model

- Customer interviews and observed workflows.
- Competitor pricing and capability research with dated sources.
- Paid pilot results.
- Storage, bandwidth, processing and email costs.
- Support and operational costs.
- Contribution margin and usage limits.
- Willingness to pay by segment.

### 9.4 Cost and limit considerations

Free-tier expiry warnings; download windows; explicit upload and storage limits; retention periods; media-processing cost; bandwidth and egress cost.

Planned document when there is content: `docs/pricing-and-unit-economics.md`.

## 10. Analytics and reporting definitions

Three separate classes. Do not mix them in one number.

1. **First-party platform activity.** Check-ins, gallery visits, downloads, email delivery. Source: our own events.
2. **Attributable campaign activity.** Tracked link clicks, UTM visits. Source: our links and landing pages. Attribution limits must be stated.
3. **External social metrics.** Impressions, reach, engagement. Only via authorised integrations or customer-provided reports.

A share-button click is class 1 (an intent event). It is **not** a verified social impression, reach or engagement.

Each reported metric needs: a name, a calculation rule, a data source and its attribution limits. Retention periods for analytics are defined before launch.

## 11. Security, privacy and legal

**Sensitive data:** guest lists, contact details, signatures, photographs, videos, consent records, event analytics.

These are **areas to investigate with professional review**, not statements that the platform complies:

- UK GDPR and the Data Protection Act 2018
- PECR (marketing and electronic communications)
- Photography and video, and consent
- Children's data
- Marketing permissions
- Controller/processor roles (organiser vs platform)
- International transfers (hosting and sub-processors)
- Retention and deletion
- Access controls
- Incident response

### 11.1 Acceptance criteria before launch

- Tenant isolation tested, including cross-tenant access attempts.
- Upload permissions enforced server-side.
- QR and link tokens unguessable, expiring and revocable.
- Access revocation takes effect, including for device sessions.
- Retention and deletion enforced and tested.
- Support access audited and time-limited.
- Audit logs cover sensitive actions.
- No secrets in the repository; secrets handled by environment variables or a secret manager.
- Development and tests use synthetic or anonymised data.
- Incident response plan exists and has an owner.
- A qualified reviewer has seen the legal and privacy approach. Until then, no claim of compliance.

Planned document when there is content: `docs/security-and-privacy.md`.

## 12. Marketing and motion design (future, not an MVP dependency)

Do not build a motion pipeline until there is a working product worth demonstrating and a marketing need.

When it happens:

- Use genuine product screens and approved assets.
- Write a storyboard first; produce a rough render, inspect it, then refine.
- Make reusable demonstrations for the five products.
- No invented capabilities, testimonials or results.
- Check permission, licence, privacy and consent for every asset, including music and any customer footage.

A source article describes a code-driven render workflow ([notes](research/operating-model-sources.md)). Its steps target Mac/Linux, and no cost figures are given. Feasibility on our Windows setup and its cost are unknown.

## 13. Investor research (deferred)

Fundraising and any investor-database purchase are deferred. First validate customer demand, differentiation, unit economics and whether the company wants external funding.

If fundraising becomes a priority: build a targeted list and verify fit, stage, geography and thesis for each investor. A generic AI investor database is not an MVP dependency. The public part of one such product's page was read; the rest is paywalled and no purchase was made.

## 14. Roadmap (dependency-ordered, no dates)

| Phase | Content | Exit condition |
|---|---|---|
| 0 | Requirements, customer research, architecture, commercial hypotheses, feasibility spikes | Founder accepts requirements, architecture decision records exist, open items for phase 1 resolved |
| 1 | Shared platform foundations; quality and security controls | Tenancy, roles, uploads, audit and test baseline pass their acceptance criteria |
| 2 | The five product modules in dependency order, all five kept in scope | Each module meets its acceptance criteria |
| 3 | Integration, entitlements, billing, reporting | Cross-product permissions and billing tested |
| 4 | Validation, security and privacy review, pilot | Review findings handled; pilot results recorded |
| 5 | Launch readiness and measured rollout | Launch criteria in section 11.1 met; founder approves release |

Likely module order (**recommendation**): Check-in Studio first as the entry point and source of guests; Signature Mosaic next, since ShareWall reuses its rendering; Lucky Draw and Event Gallery depend on the guest and media foundations. Confirm in phase 0.

No dates are promised until scope and feasibility are understood. Each milestone defines its own acceptance criteria, dependencies, risks and exit conditions before it starts. Planned document when there is content: `docs/roadmap.md`.

## 15. Supporting documents

| Document | Status |
|---|---|
| [CLAUDE.md](../CLAUDE.md) | Exists |
| [docs/research/operating-model-sources.md](research/operating-model-sources.md) | Exists |
| [docs/decisions/](decisions/README.md) | Exists |
| [docs/task-ledger.md](task-ledger.md) | Exists |
| [docs/prompts/update-master-spec-and-claude-md.md](prompts/update-master-spec-and-claude-md.md) | Exists (instruction prompt) |
| `docs/requirements.md` | Not yet created; created when requirements are detailed beyond this spec |
| `docs/architecture.md` | Not yet created; follows phase 0 |
| `docs/market-research.md` | Not yet created; follows research |
| `docs/pricing-and-unit-economics.md` | Not yet created |
| `docs/security-and-privacy.md` | Not yet created |
| `docs/roadmap.md` | Not yet created |

Placeholders are deliberately not created.

## 16. Open decisions and questions (founder)

1. Technology stack, hosting provider and region.
2. Payment provider and billing approach.
3. Moderation, consent and publication rules for ShareWall.
4. Retention defaults for media, signatures and guest data; free-tier expiry.
5. Controller/processor model and legal review route.
6. Lucky Draw selection method and audit evidence.
7. Signature source for Signature Mosaic.
8. Customer segments to research first (individuals, agencies, venues, corporate).
9. Whether premium remote support is in the MVP or later.
10. Whether Claude Code scheduled or unattended runs are worth adopting, and under what spend limits.
11. Whether to enforce documentation checks (for example a link check) by script.

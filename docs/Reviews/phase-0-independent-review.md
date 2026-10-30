# Independent Phase 0 Documentation Review

Act as an independent reviewer. You did not author the Phase 0 documentation.

Read:
- CLAUDE.md
- docs/MVP-MASTER-SPEC.md
- All decision records
- docs/architecture/MVP-TECHNICAL-ARCHITECTURE.md
- docs/planning/MVP-DELIVERY-BACKLOG.md
- docs/planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md
- docs/task-ledger.md

Review the documentation critically and independently.

Check:

1. All five MVP products are represented accurately and remain distinct.
2. All six agreed agent roles are represented correctly.
3. The specification, architecture, backlog and risk register agree.
4. Event Gallery is correctly modelled as a post-event product.
5. Check-in Studio has a permanent free entry point.
6. Monetisation and payment processing are correctly deferred beyond MVP.
7. Cross-product data sharing, permissions, consent and deletion are consistent.
8. Offline capability is accurately represented without promising unsupported functionality.
9. Lucky Draw integrity, concurrency, rounds and auditability are adequately addressed.
10. Keyboard shortcut permissions and safeguards are consistent.
11. Security, privacy, internationalisation and administration are sufficiently covered.
12. The delivery backlog is implementable, prioritised and dependency-aware.
13. No major architectural assumptions have been silently presented as approved decisions.
14. The task ledger accurately distinguishes planning, proposed implementation and accepted work.
15. CLAUDE.md rules have been followed.

Pay particular attention to:
- Whether Event Gallery can safely aggregate content from multiple sources.
- Whether consent withdrawal and permission revocation are enforceable.
- Whether previously issued Gallery links and downloads are addressed.
- Whether offline synchronisation can safely coexist with audit history.
- Whether the proposed architecture is appropriately simple for a solo founder.
- Whether the agent workforce is achievable using Claude Code native capabilities.

Classify findings as:
- Critical: must resolve before accepting the documentation.
- Major: should resolve before implementation.
- Minor: can be addressed during implementation.
- Observation: useful recommendation.

For each finding provide:
- File and section.
- Problem.
- Why it matters.
- Recommended correction.
- Whether it blocks MVP implementation.

Do not change the master specification, architecture, backlog, decisions or task ledger.

Create only:
docs/reviews/phase-0-independent-review.md

Do not stage, commit, push, merge or deploy anything.

Finish with an overall recommendation: accept, accept with changes, or reject pending substantial revision.
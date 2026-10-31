# Decision records

Material product, architecture, commercial and process decisions are recorded here, one file per decision, named `NNNN-short-title.md`. Keep each short. A settled decision is not reopened without new evidence; a change is made by adding a new record that supersedes the old one.

## Format

```
# NNNN Title
- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD
- Decided by: founder | founder on recommendation of <role>

## Context
## Decision
## Consequences
## Evidence / sources
```

## Index

| ID | Title | Status |
|---|---|---|
| [0001](0001-documentation-first-and-native-claude-code.md) | Documentation first; use native Claude Code capabilities | accepted |
| [0002](0002-five-product-portfolio.md) | Five-product portfolio | accepted |
| [0003](0003-agent-workforce-mvp-workstream.md) | Agent workforce as an MVP workstream (six roles) | accepted |
| [0004](0004-shared-keyboard-shortcuts.md) | Shared keyboard shortcut capability | accepted (capability); conventions, keys and operator sessions proposed |
| [0005](0005-instagram-integration-assumptions.md) | Instagram hashtag integration is optional | accepted (assumptions unverified) |
| [0006](0006-modular-monolith-direction.md) | Modular monolith as the initial direction | proposed |
| [0007](0007-offline-capability.md) | Offline capability across all five products | accepted (direction; per-product scope open) |
| [0008](0008-event-gallery-post-event-product.md) | Event Gallery is a distinct post-event product | accepted; ingestion routes proposed |
| [0009](0009-check-in-studio-permanent-free-entry-point.md) | Check-in Studio always has a free entry point | accepted |
| [0010](0010-defer-monetisation-until-after-mvp.md) | Defer monetisation until after the MVP | accepted |
| [0011](0011-owner-only-account-actions.md) | Account owners and event collaborators; account-owner-only actions | accepted |
| [0012](0012-english-uk-launch-language-progressive-localisation.md) | English (UK) at launch; progressive localisation | accepted |
| [0013](0013-consent-revocation-and-content-lifecycle.md) | Consent withdrawal, revocation and content lifecycle | proposed (design) |
| [0014](0014-privacy-preserving-audit-and-erasure.md) | Privacy-preserving audit records and erasure | proposed (reference data model, needs technical and privacy validation); principle from Phil's instruction |
| [0015](0015-lucky-draw-round-state-machine.md) | Lucky Draw round state machine | proposed |
| [0016](0016-accessibility-requirement.md) | Accessibility requirement | accepted (requirement); proposed (target) |
| [0017](0017-minimum-offline-capability-per-product.md) | Minimum offline capability per product | proposed |
| [0018](0018-discovery-and-privacy-review-first.md) | Discovery and legal/privacy review begin early; real data waits for them | accepted |
| [0019](0019-milestone-1-development-authorised-with-synthetic-data.md) | Milestone 1 development is authorised, using synthetic data | accepted |
| [0020](0020-mvp-implementation-stack.md) | Development stack for the first working slice (recommendation) | accepted for the first local slice (gate passed 2026-10-31); not a production decision |
| [0021](0021-checkin-first-slice-guest-and-check-in-model.md) | Guest and check-in data model for the first Check-in Studio slice | proposed (implemented locally on synthetic data; needs privacy validation); immutable-time rule amended by 0022 |
| [0022](0022-checkin-guest-management-undo-audit-import.md) | Guest management: CSV import, name edits, recorded undo, audit history | proposed (implemented locally on synthetic data; needs privacy validation) |

Open decisions that are not yet records are listed in section 16 of [../MVP-MASTER-SPEC.md](../MVP-MASTER-SPEC.md).

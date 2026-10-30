# 0007 Offline capability across all five products

- Status: accepted (direction); per-product scope and the conflict rule are not yet decided
- Date: 2026-10-30 (replaces the earlier position and the proposal first recorded on the same day)
- Decided by: founder (Phil), 2026-10-30

## Context

The earlier agreed position was: no offline operation in the initial release, with connectivity warnings and event-readiness checks. The Phase 0 notes proposed an offline strategy for each product where technically possible. Venues often have poor connectivity. Cost and complexity are unmeasured. This was conflict C-3 in the master spec.

## Decision

All five products should have some offline capability, subject to documented limitations and technical feasibility.

This **supersedes** the earlier "no offline operation in the initial release" position. It does not promise offline parity, and it does not say what each product gets.

- Connectivity warnings and event-readiness checks stay.
- Offline capture, offline interaction, locally cached display, queued synchronisation, live-only functions and real-time multi-device functions are different capabilities and are documented separately per product (master spec 5.7).
- Limits must be stated to organisers. Functions that need a connection must say so.

## Not decided

1. Which offline capabilities each product gets in the MVP. Minimums, limits, fallbacks, a descoping rule and an offline privacy design are proposed in [0017](0017-minimum-offline-capability-per-product.md). They follow the feasibility evidence from spikes S-01 and S-02 (backlog L-01), then Phil's approval of the per-product scope.
2. The conflict rule. "Latest update wins" for edits to the same guest record is a Phase 0 proposal. It stays a proposal until S-02 shows how to define "latest" without trusting device clocks. The audit history must be kept and organisers must see what happened.
3. Lucky Draw. Server-side, concurrency-safe, idempotent execution remains a requirement (spec 4.4). Any offline behaviour for Lucky Draw must keep that guarantee, so execution may need a connection. Whether any offline draw execution is acceptable is open.

## Consequences

- Writes are idempotent and use client-generated identifiers (backlog L-02).
- Operators see sync status.
- Offline items in the backlog (F-10, L-03, L-04) are feasibility-led work, not gated on whether offline is wanted.
- Offline moves the risk register's S-01 and S-02 from "decision input" to "scope input".

## Evidence / sources

Master spec 3, 4.1, 5.7 and 16.1 (C-3). No feasibility evidence has been gathered yet.

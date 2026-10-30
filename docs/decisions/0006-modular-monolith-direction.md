# 0006 Modular monolith as the initial architecture direction

- Status: proposed (recommendation; not yet a decision)
- Date: 2026-10-30
- Decided by: pending Phil

## Context

A solo founder is building with Claude Code, and the master spec leaves the stack open (section 16). The Phase 0 notes prefer a modular monolith over microservices initially, subject to validation.

## Decision (proposed)

Start with one deployable application with clear internal module boundaries (shared platform plus one module per product). Split a module out only on measured need. No stack or provider is chosen by this record.

## Consequences

- Simpler build, testing and deployment for one person.
- Module boundaries must be enforced (no cross-module data access that bypasses permissions), or the shared-data rules in the spec section 5.2 fail.
- Real-time and media processing may need separate workers; this is within a monolith's reach but is a spike (S-03, S-04).

## Alternatives

Microservices from the start (more operations work, little benefit now); a serverless-only design (cost and local-development trade-offs, unverified).

## Evidence / sources

Phase 0 notes; [architecture proposal](../architecture/MVP-TECHNICAL-ARCHITECTURE.md). No benchmark or cost data has been gathered.

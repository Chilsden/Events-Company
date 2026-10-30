# 0002 Five-product portfolio

- Status: accepted
- Date: 2026-10-30 (updated the same day with the C-4 boundary)
- Decided by: founder (master spec section 1 and Phil's instructions of 2026-10-30)

## Context

The master spec lists five MVP products. The Phase 0 notes described four ("Mosaic" and a ShareWall that includes the post-event Gallery). Phil instructed that the existing five-product position stands.

## Decision

The MVP has five products, all in scope: Check-in Studio, Signature Mosaic, ShareWall, Lucky Draw and Event Gallery.

- Signature Mosaic and ShareWall are distinct products with different purposes and experiences. They may share rendering technology and infrastructure.
- Event Gallery is a separate product, not a ShareWall feature.
- **Boundary (decided 2026-10-30):** ShareWall owns collaborative photo and video grids. Signature Mosaic focuses on signatures and drawings forming designs. Both may share rendering technology.
- Event Gallery is primarily a post-event product that gathers eligible content from other sources ([0008](0008-event-gallery-post-event-product.md)).
- Products may later be sold individually or in bundles. Pricing is deferred until after the MVP ([0010](0010-defer-monetisation-until-after-mvp.md)).
- Cross-product use of guest data needs an explicit, purpose-limited, recorded and revocable permission.

## Consequences

- Backlog, architecture and pricing treat five products. Each has its own epic.
- The photo/video grid boundary (C-4) and the ShareWall-to-Gallery flow (C-5) are decided; see the master spec section 16.1. Remaining detail (Gallery intake, revocation effects) is in section 16.

## Evidence / sources

Master spec sections 1, 3 and 4; `CLAUDE.md` section 1; the conflict register (C-1).

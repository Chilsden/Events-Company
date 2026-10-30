# 0017 Minimum offline capability per product, and offline privacy

- Status: proposed
- Date: 2026-10-30
- Decided by: pending spikes S-01 and S-02 and Phil's approval

## Context

Decision 0007 says all five products should have some offline capability, subject to documented limitations and feasibility. Independent review findings F-04 and F-11 asked for minimums, fallbacks, a descoping rule, and a privacy design for data cached on devices.

## Decision (proposed)

The founder's decision stands: all five products have some offline capability. This record proposes the minimums so that the commitment is small, bounded and honest.

| Product | Proposed minimum | Fallback if the minimum is infeasible |
|---|---|---|
| Check-in Studio | Pre-event station pack; check-in by search or QR; walk-ins; queued sync | Printable guest list or CSV |
| Signature Mosaic | Display and reveal from content cached before the event | Pre-rendered export played locally |
| ShareWall | Display loops cached approved content; guest uploads retried on reconnect where the browser allows | Exported slideshow |
| Lucky Draw | Pre-loaded configuration; present results already drawn; offline check-ins queue. Drawing needs a connection | See decision 0015, rule 5 |
| Event Gallery | Gallery shell and already-opened items cached | Organiser-prepared export before the event |

**Descoping rule:** if S-01 shows a product cannot meet its minimum, it falls back to cached display of previously loaded content plus readiness diagnostics, approved by Phil with the evidence. Every product keeps some offline capability. No product claims parity.

**Offline privacy and revocation:**

- A device gets only the data its role needs, in an expiring pack (a lease).
- On expiry or next contact the device syncs its queue, then wipes the pack.
- Revocation of a device, user, grant or consent takes effect at next contact or lease expiry, whichever is first. The maximum exposure window equals the lease length, and Phil must accept it.
- Browser storage cannot be fully protected against someone with access to the device. The product makes no stronger claim.

## Not decided

- The lease length.
- Which fields a Check-in pack may contain.
- Whether Phil accepts the exposure window.

## Consequences

- Backlog items F-10, L-01, L-03 to L-09 are reorganised around the minimums and a staged build, Check-in Studio first.
- Spec 11.1 states the offline exception for revocation.

## Evidence / sources

Independent review F-04, F-11; master spec 5.7. No feasibility evidence exists yet.

# 0010 Defer monetisation until after the MVP

- Status: accepted
- Date: 2026-10-30
- Decided by: founder (Phil), 2026-10-30

## Context

The Phase 0 notes assumed GBP pricing, online payments, invoices, receipts and entitlements as part of the MVP. The earlier backlog treated a payment provider, checkout and entitlements as must-have work (epic N).

## Decision

Pricing tiers, subscriptions, payment processing, checkout and paid feature restrictions are deferred until after the MVP.

- The MVP does not require a payment provider or any billing implementation.
- The MVP architecture must not prevent future monetisation. It must remain possible to introduce later: per-product pricing, bundles, per-event pricing, agency plans, guest-count tiers, storage limits and premium features.
- Future monetisation considerations stay in the backlog as post-MVP items.

## Not decided

- Any price, tier or limit. The provisional ranges in master spec 9.2 remain unvalidated hypotheses.
- Whether the MVP needs technical usage caps for abuse or cost protection (a technical safeguard, not a paid restriction).
- Payment provider, invoicing and receipt approach.

## Consequences

- Backlog N-01 to N-04 move to post-MVP. N-05 (pricing evidence) becomes non-blocking research.
- Roadmap phase 3 no longer includes billing.
- Design hooks that keep the option open (recommendation, backlog D-11): record per-event usage (storage, bandwidth, guest counts), and route product-access checks through one interface that allows everything in the MVP.
- Cost measurement (spike S-11) stays, because hosting decisions need it.
- Private beta runs without billing.

## Evidence / sources

Phil's decision of 2026-10-30; master spec 9; conflict register C-8.

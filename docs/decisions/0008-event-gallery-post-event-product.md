# 0008 Event Gallery is a distinct post-event product

- Status: accepted
- Date: 2026-10-30
- Decided by: founder (Phil), 2026-10-30

## Context

The Phase 0 notes treated the gallery as a post-event experience inside ShareWall. The master spec already listed Event Gallery as a fifth product. Two questions were open: whether approved ShareWall content may flow into the Gallery (C-5), and where the boundary with ShareWall lies.

## Decision

Event Gallery is a distinct fifth MVP product and is primarily a post-event experience.

- It aggregates eligible content collected throughout an event: from Check-in Studio, ShareWall, organisers and photographers (organiser uploads, guest QR submissions that arrive through the other products, and photographer uploads).
- It is **not** another live contribution product. Its purpose is to give organisers and guests a branded post-event destination to browse, view, download, share and potentially print event content.
- Content is eligible only if it respects consent, permissions, moderation status, retention and deletion rules.
- Where content originates from another product, access and reuse must be explicitly authorised and auditable. Eligible, approved content can flow into the Gallery with explicit, recorded and **revocable** permissions (a cross-product permission grant, master spec 5.2).

ShareWall stays the live, collaborative, event-time product. The Gallery is the after-event destination. They are not the same product, and the Gallery is not a ShareWall feature.

**Aggregation and ingestion.** Decided (Phil, 2026-10-30): the Gallery aggregates eligible content from Check-in Studio, ShareWall, organisers and photographers, and it has its own P0 ingestion path that enforces consent, moderation status and permissions.

**Proposed technical ingestion routes (not approved implementation decisions):**

1. Organiser upload by an account owner or event collaborator (authenticated, resumable).
2. Photographer upload through a scoped, expiring, revocable upload link issued by the organiser.
3. Import of eligible content from Check-in Studio and ShareWall through a `ContentGrant`.

Guest QR submissions reach the Gallery through the Check-in Studio and ShareWall flows. A dedicated guest upload link on the Gallery itself is a possible P1 addition (unresolved).

**Other proposed details (not decided):** every item has provenance, a consent basis and a moderation status of `pending`, `approved` or `rejected`; only `approved` items are visible to guests; account owners and event collaborators approve, reject or remove items; photographer uploads wait for approval unless the organiser marks that photographer as trusted.

## Not decided

1. Whether the Gallery also offers a guest upload link (P1), and whether trusted-photographer auto-approval is allowed.
2. The audience model: who can see which items (everyone with the event link, invited guests only, or per-guest access). Proposed default: approved items visible to anyone holding a valid gallery link; no per-guest personalisation in the MVP.
3. What happens to links, downloads and shares already issued when a grant is revoked or consent is withdrawn. Proposed design in [0013](0013-consent-revocation-and-content-lifecycle.md); copies already downloaded cannot be recalled.
4. Print provider, supported imports, default retention, who may delete guest-submitted media, and handling of faces and minors.

## Consequences

- New backlog items J-12 (ingestion) and J-13 (curation) at P0. J-02 to J-05 depend on J-10 and on the revocation design.
- Backlog J-08 (ShareWall to Gallery flow) is no longer gated on whether the flow exists. It depends on grants (D-02) and ShareWall consent rules (H-06).
- Only content that passes the eligibility checks appears; the Gallery shows moderation status, consent and retention state to organisers.
- Analytics follow master spec section 10: a share click is an intent event, not a social impression.

## Evidence / sources

Phil's decision of 2026-10-30; master spec 4.5 and 5.2; conflict register C-1 and C-5.

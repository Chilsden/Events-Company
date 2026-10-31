# 0023 Mosaic (formerly Signature Mosaic) and Check-in Studio as the collection interface

- Status: accepted (founder decision in `docs/prompts/mvp-checkin-configurable-inputs.md`, 2026-10-31); open questions listed below
- Date: 2026-10-31
- Decided by: founder
- Amends: [0002](0002-five-product-portfolio.md) (name and scope of one product), parts of [0008](0008-event-gallery-post-event-product.md) (sources) by adding Check-in Studio as the single collection route

## Context

The fifth product was called Signature Mosaic and was described as assembling signatures and drawings into designs. The founder has renamed it and widened its inputs.

## Decision

1. The product is called **Mosaic**. "Signature Mosaic" is retired. Active documents and the interface use "Mosaic"; historical records are left as written and carry a note.
2. **Mosaic arranges permitted contributions into visual compositions such as shapes and logos.** It supports signatures, drawings, photographs and short video clips.
3. **Check-in Studio is the exclusive collection interface** for contributions consumed by Mosaic. Mosaic has no capture interface of its own. (Event Gallery and ShareWall keep their own sources as already decided; Event Gallery also consumes permitted Check-in Studio contributions.)
4. **Contributions are shared, not copied.** Mosaic and Event Gallery read a contribution through one access-controlled interface that returns only contributions whose display permission for the purpose is currently given. A contribution is not uploaded again for another product.
5. **Check-in Studio is configurable per event.** An event can collect signatures only, with no guest names, registration, RSVP or attendance ([0024](0024-configurable-check-in-inputs-and-shared-contributions.md)).

## Open questions (for the founder)

- **O-23-1: boundary with ShareWall.** The 2026-10-30 boundary gave ShareWall the collaborative photo and video grids and Mosaic the signatures and drawings forming designs. Mosaic now takes photographs and video too. Is the line "Mosaic makes a composed shape or logo; ShareWall is a live contribution wall or grid"? Until answered, no ShareWall behaviour changes and the spec records the question.
- **O-23-2: contribution links.** Whether visitors reach the Check-in Studio collection screen by a QR code or link on their own phone (not built, needs public access tokens and abuse controls, architecture section 10) or only on an organiser's device. The prototype is organiser-device only.
- **O-23-3: renaming scope in code and data.** The prototype has no Mosaic code yet. Names such as `mosaic_public_display_demo` (the permission purpose) already use the new name.

## Consequences

- The master specification, backlog, risks, architecture and README now say "Mosaic". The section on Mosaic (spec 4.2) carries a banner saying its detailed requirements still describe signatures and drawings and have not been rewritten for the wider inputs; photographs and video stay subject to spike S-05.
- `CLAUDE.md` section 1 lists the product as Mosaic (one word changed).
- Backlog section G has not been re-estimated.

## Evidence / sources

Founder prompt `docs/prompts/mvp-checkin-configurable-inputs.md`; decisions 0002, 0008; spec sections 4.1 to 4.5 and C-4.

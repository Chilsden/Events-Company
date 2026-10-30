# 0012 English (UK) at launch; progressive localisation

- Status: accepted
- Date: 2026-10-30
- Decided by: founder (Phil), 2026-10-30

## Context

The Phase 0 notes named many languages as required and English (UK) as the initial language, without saying which must ship at launch. This was conflict C-6.

## Decision

English (UK) is the fully supported launch language. Internationalisation is built in so that languages can be added progressively after launch.

- No UI text is hard-coded. Locale, regional formats, fonts and layout for long strings and complex scripts are handled in the foundation.
- Account language, event language and guest-facing language are independent, and guests can override a suggested language.
- The languages named in the Phase 0 notes (Simplified and Traditional Chinese, Korean, Thai, French, German, Spanish, Italian, Portuguese, Dutch and other European languages) are candidates for later releases. They are not launch commitments. Arabic is not currently required.

## Not decided

- The order in which further languages are added.
- Whether customers can author their own translations of invitations and event text at launch, or only in English.
- Whether AI-assisted translation of user content is offered, and when (privacy review first).

## Consequences

- Backlog K-07 becomes post-launch localisation work. K-01 to K-05 stay as foundation work so later languages are cheap to add.
- Spike S-09 informs the order of later languages, not a launch gate.

## Evidence / sources

Phil's decision of 2026-10-30; master spec 5.6; conflict register C-6.

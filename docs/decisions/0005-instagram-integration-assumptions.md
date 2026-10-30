# 0005 Instagram hashtag integration assumptions

- Status: accepted (as optional, non-blocking); technical assumptions unverified
- Date: 2026-10-30
- Decided by: founder (Phase 0 notes)

## Context

Organisers may want posts with an event hashtag on a ShareWall. Access depends on Meta.

## Decision

- Instagram hashtag retrieval is an optional ShareWall content source.
- Use only Meta's official API. An organiser can configure an event hashtag.
- Retrieval is limited by Meta account eligibility, permissions, app review and API limits. Do not promise retrieval of every post. Private or inaccessible posts are excluded.
- Direct uploads, QR submissions, photographer uploads and Check-in Studio stay the reliable sources.
- Instagram approval must not block the MVP launch.

## Consequences

- No other epic depends on it. Spike S-08 checks what is actually possible.
- Retrieved content passes through the same moderation and consent rules as other submissions.
- Any claim about Meta's rules must be checked against Meta's current documentation before use. None has been verified.

## Evidence / sources

Phase 0 notes (founder prompt). No Meta documentation has been read yet.

# 0013 Consent withdrawal, content revocation and content lifecycle

- Status: proposed (design); the requirement that withdrawal and revocation must work end to end is accepted
- Date: 2026-10-30
- Decided by: requirement from Phil (2026-10-30); design pending Phil's approval and legal advice

## Context

Independent review finding F-02: withdrawal and revocation were not enforceable end to end. Nothing let a guest withdraw consent, anonymous contributors could not be linked to their content, and the display-time eligibility check did not reach signed links, derivatives, caches, exports, offline devices or backups. This is not legal advice, and the design below is not a claim of compliance.

## Decision (proposed design)

Detail is in architecture 24; requirements are in master spec 11.2.

1. **Provenance on every asset:** source product, contributor reference, consent basis and moderation status are stored with the asset.
2. **Contribution receipt:** every submission by someone without an account returns a receipt with a manage link (stored hashed). It lets that person withdraw or request removal of their own content. Identified guests use their guest link.
3. **Who can revoke:** account owners and event collaborators can remove content and revoke grants. Contributors and identified guests can withdraw their own content. Platform admins act only through audited support grants.
4. **Effect:** a `RevocationEvent` is recorded. The item stops being authorised on the next request, then a propagation job deals with derivatives, caches, exports, offline devices and backups. Exposure windows per artefact are listed in architecture 24.3.
5. **Honest limits:** copies already downloaded, posts shared elsewhere, emails already sent and submitted print orders cannot be recalled. People are told this where they download, share or print.
6. **Backups:** backups are not edited. An `ErasureLedger` of opaque identifiers is re-applied after any restore before service resumes.

## Options for the multi-person item (unresolved)

- **A (recommended):** if any identified person in a multi-person item withdraws or asks for removal, the item is hidden immediately and the organiser decides whether to restore, replace or delete. Fail-safe, simple, and needs no face recognition.
- **B:** per-person tagging of who appears. More precise but needs identification of faces or manual tagging, which adds privacy risk and work.
- **C:** review each request manually. Slower and does not hide the item while waiting.

## Not decided

- The maximum signed-link lifetime, cache purge target and propagation deadline (values to be set by spike S-13 and Phil).
- The multi-person policy (A, B or C) after legal advice.
- Whether contributors get self-service takedown that is effective immediately (recommended) or only a request.
- The backup retention period.

## Consequences

- New backlog items D-13 (receipts), D-14 (propagation), E-07 (backups), M-10 (data-subject requests) and spike S-13.
- Gallery downloads, links, sharing and printing (J-02 to J-05) depend on this design.

## Evidence / sources

Independent review F-02, F-06, F-10; master spec 11.2; architecture 24. No legal advice has been taken.

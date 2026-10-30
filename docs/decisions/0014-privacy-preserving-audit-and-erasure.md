# 0014 Privacy-preserving audit records and erasure

- Status: proposed (reference data model; requires technical and privacy validation). The principle below comes from Phil's instruction of 2026-10-30
- Date: 2026-10-30
- Decided by: principle from Phil (2026-10-30). The reference data model is pending technical validation, privacy validation and Phil's approval

## Context

Independent review finding F-03: audit, check-in and draw records were described as append-only and the original draw winner "never erased", while launch criteria require deletion to be enforced. Nothing said how personal data inside immutable records is deleted or for how long evidence is kept.

## Decision

**Principle (from Phil's instruction of 2026-10-30):** immutable records must not retain personal data indefinitely. Append-only is a rule about edits through the application, not permission to keep personal data forever. Each class of record has a retention period.

**Reference data model (proposed):** see architecture 25. This record is a proposed reference data model that requires technical and privacy validation. It is **not an approved final implementation**. It may be built and tested with synthetic data. Before real guest data, a technical check (erase, export, restore, evidence verification) and a privacy review by the adviser must have happened (backlog D-15, O-09).

- Append-only records (audit, check-in events, draw selections and evidence, revocation events) store an opaque `SubjectRef` per person, not names, contact details or media.
- Identity data lives in a separate, erasable `SubjectIdentity` record. Erasure deletes that record. The `SubjectRef` then points to nothing and exports show "erased participant".
- Free text in audit reasons is limited to structured codes plus a short note that must not contain personal data.
- Draw evidence is verifiable from references and hashes without names, so erasure does not break verification.
- Event deletion removes the event's identities, media and records after the pending-deletion period (decision 0011), leaving only a minimal non-personal tombstone.
- Pseudonymised data is not assumed to be anonymous. Whether references remain personal data is a question for legal advice.

## Options considered

| Option | For | Against |
|---|---|---|
| A. Reference model (recommended) | Simple; verification survives erasure | Needs discipline so no personal data leaks into logs |
| B. Per-event or per-subject encryption keys (crypto-shredding) | Strong erasure including backups | Key management complexity |
| C. Periodic purge of old records only | Simplest | Does not answer individual erasure requests |

## Not decided

- Retention periods for every record class (architecture 25.3 table).
- Whether option B is added later for backups.
- Legal view on references and on retaining draw evidence after an erasure request.

## Consequences

- New backlog item D-15; D-06, F-05, I-02 and I-05 depend on it.
- Spec 11.3 and launch criteria changed.

## Evidence / sources

Independent review F-03; master spec 11.3; architecture 25.

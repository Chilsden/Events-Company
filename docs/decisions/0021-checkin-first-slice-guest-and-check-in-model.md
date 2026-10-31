# 0021 Guest and check-in data model for the first Check-in Studio slice

- Status: proposed (implemented in the local prototype under founder instruction in `docs/prompts/mvp-checkin-studio-first-slice.md`; needs privacy and technical validation before real data)
- Date: 2026-10-31
- Decided by: founder asked for the slice; this model is the Solution Architect and Software Engineer's design, awaiting founder review

## Context

The first Check-in Studio slice (add guest, list, check in, attendance) runs locally on synthetic data with a fixed demo account and no sign-in ([0020](0020-mvp-implementation-stack.md)). The architecture ([section 4, 9, 24, 25](../architecture/MVP-TECHNICAL-ARCHITECTURE.md)) proposes an erasable identity record separate from append-only check-in records, idempotent writes, and a consent model. All of that is **proposed**, not decided ([0014](0014-privacy-preserving-audit-and-erasure.md), [0013](0013-consent-revocation-and-content-lifecycle.md)).

## Decision (for this slice only)

- **`guests`**: id (UUID), `account_id`, `event_id`, name (1 to 120 characters), `checked_in_at` (time of the **first** successful check-in, null until then), `created_at`. Name only: no email, phone, photo, signature or custom fields. A composite foreign key `(event_id, account_id)` to `events` means a guest cannot exist under the wrong account or event.
- **Check-in** is one conditional `UPDATE ... WHERE checked_in_at IS NULL` inside a transaction. Only the first attempt matches; a repeat or a simultaneous duplicate changes nothing and returns the original time. No read-then-write.
- **`check_in_log`**: append-only (the application role has insert and select only), one row per attempt that reached a real guest, with outcome `checked_in` or `already_checked_in` and the server receive time. Holds ids and times, never names. This follows the architecture rule that a duplicate is recorded, not silently dropped, without yet modelling devices, stations or client-generated ids (deferred with offline work).
- **`consent_records`**: created now so the model is not forgotten, with purpose, status (`granted` or `withdrawn`), wording version, provenance (`guest_self`, `organiser_on_behalf`, `synthetic_test`) and timestamps. **Nothing reads or writes it and the application role has no access to it.** A guest with no row has no consent recorded; consent is never assumed, and synthetic data is marked `synthetic_test` so it cannot be mistaken for a real person's consent. Whether this slice needs consent at all (only a name is collected to run the check-in) is a legal question for the adviser (S-10).
- **Security**: all three guest tables have row-level security by `account_id` (same mechanism as events); the application role may add guests, read them, and change only `checked_in_at`; it cannot delete guests or log entries. A trigger (migration 0003) also stops `checked_in_at` from being cleared or changed once set, for every role. Every repository query also filters by account and event. The check-in time is the real time of the update (`clock_timestamp()`), not the start of the transaction.
- **Opaque references**: the guest `id` stands in for the architecture's `SubjectRef` in the log. A separate erasable `SubjectIdentity` split is **not** built; erasure of a guest while keeping the log is therefore not yet possible (the log would need to be kept without names, which it already is, but the guest row holds the name). Design for erasure remains open (0014, S-13).

## Not decided / deferred

Check-out, undo of a check-in, walk-in versus pre-registered source, custom fields, import, QR, devices and stations, client-generated idempotency keys, offline queue, retention periods, who may check guests in (roles, decision 0011), per-guest consent capture.

## Consequences

- The slice satisfies "no duplicate attendance" and "cross-event and cross-account isolation" with database-level backing.
- True multi-connection concurrency is not exercised: PGlite has one connection and serialises transactions, so the concurrency tests would also pass for a read-then-write implementation. They prove the outcome, not that the conditional update is what makes it safe. Under real PostgreSQL (read committed) the conditional update is safe by reasoning (the loser re-checks the row after the lock and gets zero rows), confirmed only by the reviewer's reading. A two-connection test on real PostgreSQL is still needed.
- Moving to the proposed identity split later needs a migration that separates names from `guests`.

## Evidence / sources

Architecture sections 4, 9, 24 and 25; spec section 4.1; migration `web/migrations/0002_guests.sql`; tests in `web/tests/guests.test.ts`.

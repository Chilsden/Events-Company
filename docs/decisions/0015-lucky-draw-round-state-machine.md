# 0015 Lucky Draw round state machine

- Status: proposed
- Date: 2026-10-30
- Decided by: pending Phil's approval of the rule choices below

## Context

Independent review finding F-08. The core design (frozen pool, atomic transition, idempotency, append-only selections) was sound, but the lifecycle was incomplete: what may follow a reset, late check-ins, navigation commands, repeated key presses, randomness evidence and who may run a draw.

## Decision (proposed)

The full state machine, command table and rules are in the architecture, section 14. In summary:

- Round states: `configured`, `ready`, `drawn`, `needs_redraw`, `closed`. A session is `active` or `ended`.
- Every command carries a client command id and the expected version. A stale or repeated command returns the current state and changes nothing.
- The pool is frozen as a snapshot when a round becomes `ready`. Check-ins received after the snapshot do not enter that round. The operator sees how many arrived since, and can refresh the pool while the round is still `ready`.
- Reset and re-draw both append records and never delete a selection. Consequential commands need confirmation and a reason.
- Closed rounds are final. A mistake after closing is handled by a new, audited round, not by rewriting a result.
- Selection is a deterministic function of a server-generated seed and the snapshot, so an auditor can recompute it. The method itself needs approval after spike S-06.
- Execution is server-side, so drawing needs a connection (decision 0007).

## Rule choices needing Phil (unresolved)

1. Does a winner marked absent stay excluded from the re-draw of the same prize? (Proposed: yes, and not from other prizes.)
2. Does a winner voided by a reset return to the pool? (Proposed: yes, for the same round, and the evidence records the void.)
3. Does a re-draw use the same snapshot or a refreshed one? (Proposed: the same snapshot.)
4. May an operator who is not an account owner or event collaborator run the draw? (Proposed: yes, through a scoped operator control session, decision 0004.)
5. Is a labelled manual fallback allowed when there is no connection at draw time? (Proposed: not for the MVP.)
6. The random method and evidence format, after spike S-06.
7. How many winners a prize or round can have.
8. How "winners excluded in later rounds" is computed from the event records.
9. Whether the pool hash is committed (recorded or published) before the draw, so that tampering can be detected.

## Consequences

- Backlog I-02 to I-05, I-07, I-08 and new I-10 carry these rules as acceptance criteria.
- The integrity test suite (I-08) covers repeated input, stale versions, late arrivals and two operators.

## Evidence / sources

Independent review F-08; master spec 4.4; architecture 14.

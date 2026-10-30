# 0011 Account owners and event collaborators; account-owner-only actions

- Status: accepted
- Date: 2026-10-30 (clarified the same day)
- Decided by: founder (Phil), 2026-10-30

## Context

Owner and collaborator permissions were intended to be the same for ordinary event operation. The Phase 0 notes asked for any essential account-security safeguards to be documented, not silently adopted (conflict C-7). The independent review found that "owner" was used for two different things (the owner of an account and the owner of an event).

## Decision

**Account owners and event collaborators are distinct roles.**

- The **account owner** controls account-level actions and permanent event deletion.
- **Event collaborators**, invited to an event, manage ordinary event operations (including archiving an event, curating and moderating content, and running products).

The **account-owner-only actions** are:

- account ownership
- billing
- account deletion
- ownership transfer
- permanent event deletion

In this repository "owner-only" is shorthand for "account-owner-only". The word "owner" is not used for an event.

Permanent event deletion needs explicit confirmation and an audit entry (actor, event, time, reason). The audit entry holds no guest personal data (decision 0014).

**Proposed details (not decided):** a typed confirmation of the event name plus recent re-authentication; a pending-deletion period before the purge, during which the account owner can cancel. Its length is open.

## Not decided

- Whether an account can have more than one account owner.
- Who may create an event (the account owner only, or event collaborators too).
- How ownership is recovered if the account owner is unavailable.
- The length of the pending-deletion period, and whether archiving also hides content from guests.

## Consequences

- The permission model has account-level and event-level roles and an account-owner-only action set. Billing is defined now even though billing is post-MVP ([0010](0010-defer-monetisation-until-after-mvp.md)).
- Account-owner-only actions are enforced on the server and audited (backlog C-01, D-01, D-06).
- Tests cover event collaborators attempting each account-owner-only action, including permanent event deletion.
- Backlog C-06 covers event archive and permanent deletion, and C-08 covers account deletion and ownership transfer.

## Evidence / sources

Phil's decisions of 2026-10-30; master spec 5.4; conflict register C-7; independent review finding N-04.

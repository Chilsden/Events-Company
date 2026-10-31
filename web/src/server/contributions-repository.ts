import type { PGlite } from "@electric-sql/pglite";
import { isUuid } from "@/domain/event";
import {
  DISPLAY_PURPOSE,
  WORDING_VERSION,
  strokesFromStored,
  type PermissionChoice,
  type PermissionStatus,
  type Strokes,
} from "@/domain/signature";
import { ModuleDisabledError, isModuleOn, requireModule } from "@/server/modules-repository";
import { asAccount } from "@/server/scope";

export interface ContributionView {
  id: string;
  kind: "signature" | "drawing" | "photograph" | "video" | "text_message";
  createdAt: string;
  linkedToGuest: boolean;
  status: PermissionStatus;
  statusChangedAt: string;
  strokes: Strokes | null; // drawn from validated numbers; null if stored data fails the check
}

export type SubmitResult = { status: "saved"; id: string } | { status: "event_not_found" } | { status: "invalid_guest"; reason: string };

/**
 * Saves a signature (already validated into strokes) with the visitor's explicit display-permission choice, in one
 * transaction: the contribution, the permission record and the audit record are all saved or none is. The signature
 * module must be on for the event; a guest, if given, must belong to the same event and the guest list must be on.
 */
export async function submitSignature(
  db: PGlite,
  accountId: string,
  eventId: string,
  strokes: Strokes,
  choice: PermissionChoice,
  guestId: string | null,
): Promise<SubmitResult> {
  if (!isUuid(eventId)) return { status: "event_not_found" };
  return asAccount(db, accountId, async (tx): Promise<SubmitResult> => {
    const event = await tx.query("select 1 from events where id = $1 and account_id = $2", [eventId, accountId]);
    if (event.rows.length === 0) return { status: "event_not_found" };
    await requireModule(tx, accountId, eventId, "signature");

    if (guestId !== null) {
      if (!isUuid(guestId)) return { status: "invalid_guest", reason: "That guest could not be found for this event." };
      if (!(await isModuleOn(tx, accountId, eventId, "guest_registration"))) {
        return { status: "invalid_guest", reason: "The guest list is switched off for this event, so a signature cannot be linked to a guest." };
      }
      const guest = await tx.query("select 1 from guests where id = $1 and event_id = $2 and account_id = $3", [guestId, eventId, accountId]);
      if (guest.rows.length === 0) return { status: "invalid_guest", reason: "That guest could not be found for this event." };
    }

    const inserted = await tx.query<{ id: string }>(
      `insert into contributions (account_id, event_id, guest_id, kind, content) values ($1, $2, $3, 'signature', $4::jsonb) returning id`,
      [accountId, eventId, guestId, JSON.stringify({ v: 1, strokes })],
    );
    const id = inserted.rows[0].id;
    await tx.query(
      `insert into contribution_permissions (account_id, event_id, contribution_id, change, purpose, wording_version, provenance)
       values ($1, $2, $3, $4, $5, $6, 'local_demo_operator_synthetic')`,
      [accountId, eventId, id, choice, DISPLAY_PURPOSE, WORDING_VERSION],
    );
    await tx.query("insert into audit_events (account_id, event_id, contribution_id, action) values ($1, $2, $3, 'contribution_submitted')", [accountId, eventId, id]);
    return { status: "saved", id };
  });
}

const LATEST = (p: string) =>
  `(select ${p} from contribution_permissions p where p.contribution_id = c.id and p.purpose = $3 order by p.seq desc limit 1)`;

type Row = { id: string; kind: ContributionView["kind"]; content: unknown; guest_id: string | null; created_at: Date | string; status: PermissionStatus; changed_at: Date | string };

const toView = (r: Row): ContributionView => ({
  id: r.id,
  kind: r.kind,
  createdAt: new Date(r.created_at).toISOString(),
  linkedToGuest: r.guest_id !== null,
  status: r.status,
  statusChangedAt: new Date(r.changed_at).toISOString(),
  strokes: r.kind === "signature" || r.kind === "drawing" ? strokesFromStored(r.content) : null,
});

/** The organiser's list for one event, newest first, with each contribution's current display-permission status. */
export async function listContributions(db: PGlite, accountId: string, eventId: string): Promise<ContributionView[]> {
  if (!isUuid(eventId)) return [];
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(
      `select c.id, c.kind, c.content, c.guest_id, c.created_at, ${LATEST("p.change")} as status, ${LATEST("p.occurred_at")} as changed_at
       from contributions c where c.account_id = $1 and c.event_id = $2 order by c.created_at desc, c.id`,
      [accountId, eventId, DISPLAY_PURPOSE],
    );
    return rows.map(toView);
  });
}

/**
 * What other products (Mosaic, Event Gallery) may use: only contributions whose latest display permission for the
 * purpose is "granted", for this account and event. Revoked, denied and never-asked contributions never appear.
 * The rule itself lives in the database view `eligible_contributions`.
 */
export async function listEligibleContributions(db: PGlite, accountId: string, eventId: string): Promise<ContributionView[]> {
  if (!isUuid(eventId)) return [];
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<Row>(
      `select c.id, c.kind, c.content, c.guest_id, c.created_at, 'granted'::text as status, ${LATEST("p.occurred_at")} as changed_at
       from eligible_contributions c where c.account_id = $1 and c.event_id = $2 order by c.created_at, c.id`,
      [accountId, eventId, DISPLAY_PURPOSE],
    );
    return rows.map(toView);
  });
}

export type RevokeResult = { status: "revoked" } | { status: "not_granted"; current: PermissionStatus } | { status: "not_found" };

/**
 * Withdraws display permission. The contribution is never changed or deleted: a "revoked" entry is appended to the
 * permission history and an audit record is written, in one transaction. Repeating it is safe.
 */
export async function revokeDisplayPermission(db: PGlite, accountId: string, eventId: string, contributionId: string): Promise<RevokeResult> {
  if (!isUuid(eventId) || !isUuid(contributionId)) return { status: "not_found" };
  return asAccount(db, accountId, async (tx): Promise<RevokeResult> => {
    const found = await tx.query("select 1 from contributions where id = $1 and event_id = $2 and account_id = $3", [contributionId, eventId, accountId]);
    if (found.rows.length === 0) return { status: "not_found" };
    // one change at a time per contribution, so two revokes cannot both see "granted"
    await tx.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`permission:${contributionId}`]);
    const latest = await tx.query<{ change: PermissionStatus }>(
      "select change from contribution_permissions where contribution_id = $1 and purpose = $2 order by seq desc limit 1",
      [contributionId, DISPLAY_PURPOSE],
    );
    const current = latest.rows[0]?.change;
    if (current !== "granted") return { status: "not_granted", current: current ?? "denied" };
    await tx.query(
      `insert into contribution_permissions (account_id, event_id, contribution_id, change, purpose, wording_version, provenance)
       values ($1, $2, $3, 'revoked', $4, $5, 'local_demo_operator_synthetic')`,
      [accountId, eventId, contributionId, DISPLAY_PURPOSE, WORDING_VERSION],
    );
    await tx.query("insert into audit_events (account_id, event_id, contribution_id, action) values ($1, $2, $3, 'display_permission_revoked')", [accountId, eventId, contributionId]);
    return { status: "revoked" };
  });
}

export { ModuleDisabledError };

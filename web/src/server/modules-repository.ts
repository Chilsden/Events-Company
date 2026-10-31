import type { PGlite, Transaction } from "@electric-sql/pglite";
import { isUuid } from "@/domain/event";
import {
  IMPLEMENTED_KEYS,
  MODULES,
  checkDesired,
  isModuleKey,
  moduleInfo,
  type DesiredModules,
  type ModuleInfo,
  type ModuleKey,
  type ModuleSettings,
} from "@/domain/modules";
import { asAccount } from "@/server/scope";

export class ModuleDisabledError extends Error {
  constructor(readonly module: ModuleKey) {
    super(`The ${module} input is switched off for this event.`);
    this.name = "ModuleDisabledError";
  }
}

/**
 * Whether a module is on for an event: true, false, or null when the event has no configuration row (an unknown event).
 * `lock` takes a shared row lock, so a switch-off that is in progress is waited for rather than raced.
 */
async function moduleState(tx: Transaction, accountId: string, eventId: string, module: ModuleKey, lock: boolean): Promise<boolean | null> {
  const { rows } = await tx.query<{ enabled: boolean }>(
    `select enabled from event_modules where account_id = $1 and event_id = $2 and module = $3${lock ? " for share" : ""}`,
    [accountId, eventId, module],
  );
  return rows[0] ? rows[0].enabled : null;
}

/** Throws ModuleDisabledError when the event exists and the module is off. An unknown event is left to the caller's own not-found handling. */
export async function requireModule(tx: Transaction, accountId: string, eventId: string, module: ModuleKey): Promise<void> {
  if ((await moduleState(tx, accountId, eventId, module, true)) === false) throw new ModuleDisabledError(module);
}

/** True only when the event exists and the module is on. */
export async function isModuleOn(tx: Transaction, accountId: string, eventId: string, module: ModuleKey): Promise<boolean> {
  return (await moduleState(tx, accountId, eventId, module, true)) === true;
}

export type ModuleView = ModuleInfo & { enabled: boolean };

const view = (enabledByKey: Map<string, boolean>): ModuleView[] => MODULES.map((m) => ({ ...m, enabled: enabledByKey.get(m.key) === true }));

/** All eight modules for an event with their current setting. A missing row counts as off. */
export async function getModules(db: PGlite, accountId: string, eventId: string): Promise<ModuleView[]> {
  if (!isUuid(eventId)) return view(new Map());
  return asAccount(db, accountId, async (tx) => {
    const { rows } = await tx.query<{ module: string; enabled: boolean }>(
      "select module, enabled from event_modules where account_id = $1 and event_id = $2",
      [accountId, eventId],
    );
    return view(new Map(rows.map((r) => [r.module, r.enabled])));
  });
}

export async function getModuleSettings(db: PGlite, accountId: string, eventId: string): Promise<ModuleSettings> {
  const modules = await getModules(db, accountId, eventId);
  return Object.fromEntries(modules.map((m) => [m.key, m.enabled])) as ModuleSettings;
}

export type SetModulesResult =
  | { status: "saved"; changed: { module: ModuleKey; enabled: boolean }[] }
  | { status: "invalid"; error: string }
  | { status: "not_found" };

/**
 * Changes which built modules are on for one event, all or nothing. Each change is recorded in the audit history.
 * Planned modules cannot be switched on; a module that needs another cannot be on without it. Nothing already
 * collected is deleted by switching a module off.
 */
export async function setModules(db: PGlite, accountId: string, eventId: string, desired: DesiredModules): Promise<SetModulesResult> {
  if (!isUuid(eventId)) return { status: "not_found" };
  return asAccount(db, accountId, async (tx): Promise<SetModulesResult> => {
    const { rows } = await tx.query<{ module: string; enabled: boolean }>(
      "select module, enabled from event_modules where account_id = $1 and event_id = $2 for update",
      [accountId, eventId],
    );
    if (rows.length === 0) return { status: "not_found" };
    const current = Object.fromEntries(rows.map((r) => [r.module, r.enabled])) as ModuleSettings;
    const requested: DesiredModules = {};
    for (const [key, on] of Object.entries(desired)) {
      if (!isModuleKey(key)) return { status: "invalid", error: "That input does not exist." };
      if (typeof on === "boolean") requested[key] = on;
    }
    const final = { ...current, ...requested };
    const problem = checkDesired(final, requested);
    if (problem) return { status: "invalid", error: problem };

    const changed: { module: ModuleKey; enabled: boolean }[] = [];
    for (const key of IMPLEMENTED_KEYS) {
      if (requested[key] === undefined || requested[key] === current[key]) continue;
      const enabled = requested[key]!;
      await tx.query("update event_modules set enabled = $4, updated_at = now() where account_id = $1 and event_id = $2 and module = $3", [accountId, eventId, key, enabled]);
      await tx.query("insert into audit_events (account_id, event_id, action, detail) values ($1, $2, $3, $4::jsonb)", [
        accountId,
        eventId,
        enabled ? "module_enabled" : "module_disabled",
        JSON.stringify({ module: key }),
      ]);
      changed.push({ module: key, enabled });
    }
    return { status: "saved", changed };
  });
}

export const moduleLabel = (key: ModuleKey): string => moduleInfo(key).label;

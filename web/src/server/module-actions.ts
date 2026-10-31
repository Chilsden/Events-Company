"use server";

import { redirect } from "next/navigation";
import { isUuid } from "@/domain/event";
import { IMPLEMENTED_KEYS, PRESETS, isPresetKey, type DesiredModules } from "@/domain/modules";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { setModules } from "@/server/modules-repository";
import { issueReceipt } from "@/server/receipts";

export interface ModulesState {
  error?: string;
}

/**
 * Saves which inputs are on for one event. Either a named preset button was pressed, or the tick boxes are read:
 * a ticked box means on and an unticked one means off, for every built input. Planned inputs are ignored here
 * and the server refuses to switch them on whatever the form says.
 */
export async function saveModulesAction(_previous: ModulesState, formData: FormData): Promise<ModulesState> {
  const eventId = String(formData.get("eventId") ?? "");
  if (!isUuid(eventId)) return { error: "That event could not be found." };

  const preset = formData.get("preset");
  let desired: DesiredModules;
  if (typeof preset === "string" && preset !== "") {
    if (!isPresetKey(preset)) return { error: "That preset does not exist." };
    desired = { ...PRESETS[preset].values };
  } else {
    desired = Object.fromEntries(IMPLEMENTED_KEYS.map((key) => [key, formData.has(`module_${key}`)]));
    // a posted planned input is passed on so the server can refuse it explicitly
    for (const [name] of formData.entries()) {
      if (name.startsWith("module_") && !IMPLEMENTED_KEYS.includes(name.slice(7) as never)) (desired as Record<string, boolean>)[name.slice(7)] = true;
    }
  }

  let result;
  try {
    result = await setModules(await getDatabase(), DEMO_ACCOUNT_ID, eventId, desired);
  } catch (error) {
    console.error("saveModules failed:", error instanceof Error ? error.name : "unknown error");
    return { error: "The inputs could not be saved. Nothing was changed. Please try again." };
  }
  if (result.status === "not_found") return { error: "That event could not be found." };
  if (result.status === "invalid") return { error: result.error };
  const r = issueReceipt({ notice: "modules-saved", eventId });
  redirect(`/events/${eventId}/check-in/modules?r=${r}`);
}

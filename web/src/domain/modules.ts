/**
 * Check-in Studio input modules. Each event has its own on/off setting for every module. Some are built, the rest are
 * planned: planned modules are listed so organisers can see what is coming, but they cannot be switched on and never
 * appear as usable controls.
 */
export const MODULE_KEYS = [
  "guest_registration",
  "attendance",
  "signature",
  "drawing",
  "photograph",
  "video",
  "text_message",
  "consent",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface ModuleInfo {
  key: ModuleKey;
  label: string;
  description: string;
  implemented: boolean;
  /** Needs another module to be on first. */
  requires?: ModuleKey;
  /** Used for new events and for events that existed before modules did. */
  defaultEnabled: boolean;
}

export const MODULES: readonly ModuleInfo[] = [
  {
    key: "guest_registration",
    label: "Guest details and registration",
    description: "A guest list for the event: add guests, import them from CSV, correct names.",
    implemented: true,
    defaultEnabled: true,
  },
  {
    key: "attendance",
    label: "RSVP and attendance check-in",
    description: "Check guests in and undo mistakes, with attendance totals. Needs the guest list.",
    implemented: true,
    requires: "guest_registration",
    defaultEnabled: true,
  },
  {
    key: "signature",
    label: "Signature capture",
    description: "Visitors draw a signature on the collection screen. No name, guest record or check-in is needed.",
    implemented: true,
    defaultEnabled: false,
  },
  {
    key: "drawing",
    label: "Drawing capture",
    description: "Visitors make a free drawing.",
    implemented: false,
    defaultEnabled: false,
  },
  {
    key: "photograph",
    label: "Photograph capture or upload",
    description: "Visitors take or upload a photograph.",
    implemented: false,
    defaultEnabled: false,
  },
  {
    key: "video",
    label: "Short video recording or upload",
    description: "Visitors record or upload a short video clip.",
    implemented: false,
    defaultEnabled: false,
  },
  {
    key: "text_message",
    label: "Text messages",
    description: "Visitors leave a short written message.",
    implemented: false,
    defaultEnabled: false,
  },
  {
    key: "consent",
    label: "Purpose-specific consent",
    description: "A real consent and identity flow for genuine guests. Not built yet; the prototype only has a synthetic demonstration permission.",
    implemented: false,
    defaultEnabled: false,
  },
];

export const IMPLEMENTED_KEYS: readonly ModuleKey[] = MODULES.filter((m) => m.implemented).map((m) => m.key);
export const isModuleKey = (v: unknown): v is ModuleKey => typeof v === "string" && (MODULE_KEYS as readonly string[]).includes(v);
export const moduleInfo = (key: ModuleKey): ModuleInfo => MODULES.find((m) => m.key === key)!;

export type ModuleSettings = Record<ModuleKey, boolean>;

export const PRESETS = {
  "signatures-only": {
    label: "Signatures only",
    description: "Collect signatures. No guest list, no names, no check-in.",
    values: { guest_registration: false, attendance: false, signature: true },
  },
  "guest-list": {
    label: "Guest list and check-in",
    description: "The original Check-in Studio: guest list and attendance. No signatures.",
    values: { guest_registration: true, attendance: true, signature: false },
  },
  "guest-list-and-signatures": {
    label: "Guest list, check-in and signatures",
    description: "Everything that is built.",
    values: { guest_registration: true, attendance: true, signature: true },
  },
} as const;
export type PresetKey = keyof typeof PRESETS;
export const isPresetKey = (v: unknown): v is PresetKey => typeof v === "string" && Object.hasOwn(PRESETS, v);

export type DesiredModules = Partial<Record<ModuleKey, boolean>>;

/** Checks a requested configuration against the rules: only built modules, and dependencies. Returns an error text or null. */
export function checkDesired(final: ModuleSettings, requested: DesiredModules): string | null {
  for (const [key, on] of Object.entries(requested)) {
    if (!isModuleKey(key)) return "That input does not exist.";
    if (on && !moduleInfo(key).implemented) return `${moduleInfo(key).label} is planned but not built yet, so it cannot be switched on.`;
  }
  for (const m of MODULES) {
    if (m.requires && final[m.key] && !final[m.requires]) {
      return `${m.label} needs ${moduleInfo(m.requires).label}. Switch that on, or switch ${m.label} off.`;
    }
  }
  return null;
}

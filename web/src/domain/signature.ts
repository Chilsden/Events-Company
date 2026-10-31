/**
 * Signatures are stored as pen strokes: lists of [x, y] numbers on a fixed drawing area. Nothing the browser sends is
 * kept as text or markup. The picture is drawn later from the validated numbers only, so a stored signature cannot
 * contain a script, a link or any other content.
 */
export const SIGNATURE_AREA = { width: 600, height: 240 } as const;
export const SIGNATURE_LIMITS = {
  maxPayloadChars: 120_000,
  maxStrokes: 50,
  maxPointsPerStroke: 1500,
  maxTotalPoints: 6000,
  minTotalPoints: 3,
  minDiagonal: 20, // the drawing must span at least this many units, so a dot or a tiny scribble is not a signature
} as const;

export type Point = [number, number];
export type Strokes = Point[][];

export type SignatureResult = { ok: true; strokes: Strokes } | { ok: false; error: string };

const round1 = (n: number) => Math.round(n * 10) / 10;

export function parseSignaturePayload(raw: unknown): SignatureResult {
  if (typeof raw !== "string" || raw.trim() === "") return { ok: false, error: "Draw a signature first." };
  if (raw.length > SIGNATURE_LIMITS.maxPayloadChars) return { ok: false, error: "That signature is too large. Clear it and draw a simpler one." };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That signature could not be read. Clear it and draw it again." };
  }
  const invalid: SignatureResult = { ok: false, error: "That signature could not be read. Clear it and draw it again." };
  if (typeof data !== "object" || data === null || Array.isArray(data)) return invalid;
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((k) => k !== "strokes")) return invalid; // nothing but strokes is accepted
  if (!Array.isArray(record.strokes)) return invalid;
  if (record.strokes.length === 0) return { ok: false, error: "Draw a signature first." };
  if (record.strokes.length > SIGNATURE_LIMITS.maxStrokes) return { ok: false, error: "That signature has too many separate strokes. Clear it and draw a simpler one." };

  const strokes: Strokes = [];
  let total = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const rawStroke of record.strokes) {
    if (!Array.isArray(rawStroke) || rawStroke.length === 0) return invalid;
    if (rawStroke.length > SIGNATURE_LIMITS.maxPointsPerStroke) return { ok: false, error: "A stroke in that signature is too long. Clear it and draw a simpler one." };
    const stroke: Point[] = [];
    for (const p of rawStroke) {
      if (!Array.isArray(p) || p.length !== 2) return invalid;
      const [x, y] = p as unknown[];
      if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return invalid;
      if (x < 0 || x > SIGNATURE_AREA.width || y < 0 || y > SIGNATURE_AREA.height) return invalid;
      const point: Point = [round1(x), round1(y)];
      const last = stroke[stroke.length - 1];
      if (last && last[0] === point[0] && last[1] === point[1]) continue; // drop repeated points
      stroke.push(point);
      minX = Math.min(minX, point[0]);
      maxX = Math.max(maxX, point[0]);
      minY = Math.min(minY, point[1]);
      maxY = Math.max(maxY, point[1]);
    }
    total += stroke.length;
    if (total > SIGNATURE_LIMITS.maxTotalPoints) return { ok: false, error: "That signature has too many points. Clear it and draw a simpler one." };
    if (stroke.length > 0) strokes.push(stroke);
  }
  if (strokes.length === 0 || total < SIGNATURE_LIMITS.minTotalPoints) return { ok: false, error: "Draw a signature first." };
  if (Math.hypot(maxX - minX, maxY - minY) < SIGNATURE_LIMITS.minDiagonal) return { ok: false, error: "That mark is too small to be a signature. Please draw it larger." };
  return { ok: true, strokes };
}

/** SVG path data built from numbers only. A single point is drawn as a dot. */
export function strokesToPaths(strokes: Strokes): string[] {
  return strokes.map((stroke) => {
    const pts = stroke.length === 1 ? [stroke[0], stroke[0]] : stroke;
    return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  });
}

/** Strokes read back from the database (jsonb) are checked again before drawing: stored data is not trusted blindly. */
export function strokesFromStored(content: unknown): Strokes | null {
  const parsed = parseSignaturePayload(JSON.stringify({ strokes: (content as { strokes?: unknown } | null)?.strokes }));
  return parsed.ok ? parsed.strokes : null;
}

export const DISPLAY_PURPOSE = "mosaic_public_display_demo" as const;
export const WORDING_VERSION = "demo-v1";
export const DISPLAY_WORDING =
  "Demonstration only: I allow this synthetic signature to be shown on a public Mosaic display at this event. I can have this permission withdrawn at any time. This is a test of the prototype and is not real consent.";
export type PermissionChoice = "granted" | "denied";
export type PermissionStatus = "granted" | "denied" | "revoked";

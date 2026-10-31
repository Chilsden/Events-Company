import { describe, expect, it } from "vitest";
import { SIGNATURE_AREA, SIGNATURE_LIMITS, parseSignaturePayload, strokesFromStored, strokesToPaths } from "@/domain/signature";

const body = (strokes: unknown, extra: Record<string, unknown> = {}) => JSON.stringify({ strokes, ...extra });
const SQUIGGLE = [[[10, 10], [50, 40], [120, 20], [200, 90]]];

describe("parseSignaturePayload", () => {
  it("accepts a normal signature and rounds to one decimal place", () => {
    const r = parseSignaturePayload(body([[[10.04, 10.06], [50.55, 40], [120, 20.25], [200, 90]], [[300, 100], [330, 130], [360, 100]]]));
    expect(r).toEqual({ ok: true, strokes: [[[10, 10.1], [50.6, 40], [120, 20.3], [200, 90]], [[300, 100], [330, 130], [360, 100]]] });
  });

  it("accepts points on the edges of the drawing area", () => {
    const r = parseSignaturePayload(body([[[0, 0], [SIGNATURE_AREA.width, SIGNATURE_AREA.height], [300, 120]]]));
    expect(r.ok).toBe(true);
  });

  it("drops repeated points but keeps the shape", () => {
    const r = parseSignaturePayload(body([[[10, 10], [10, 10], [10, 10], [60, 60], [60, 60], [110, 20]]]));
    expect(r.ok && r.strokes[0].length).toBe(3);
  });

  it.each([
    ["nothing at all", undefined],
    ["null", null],
    ["an empty string", ""],
    ["a blank string", "   "],
    ["a number", 5],
    ["an array", [1, 2]],
    ["an object", {}],
  ])("rejects %s as empty", (_label, raw) => {
    const r = parseSignaturePayload(raw);
    expect(r.ok).toBe(false);
  });

  it("rejects an empty drawing: no strokes, or strokes with no points", () => {
    for (const strokes of [[], [[]], [[], []]]) {
      const r = parseSignaturePayload(body(strokes));
      expect(r.ok, JSON.stringify(strokes)).toBe(false);
    }
    expect(parseSignaturePayload(body([])).ok === false && (parseSignaturePayload(body([])) as { error: string }).error).toContain("Draw a signature first");
  });

  it("rejects a dot, a two-point tick and a tiny scribble as too small", () => {
    for (const strokes of [[[[100, 100]]], [[[100, 100], [101, 100]]], [[[100, 100], [105, 100], [105, 105], [100, 105]]]]) {
      const r = parseSignaturePayload(body(strokes));
      expect(r.ok, JSON.stringify(strokes)).toBe(false);
    }
  });

  it.each([
    ["text that is not JSON", "not json {"],
    ["JSON that is not an object", "[1,2,3]"],
    ["an object without strokes", '{"hello":1}'],
    ["strokes that are not a list", '{"strokes":"abc"}'],
    ["a stroke that is not a list", '{"strokes":[5]}'],
    ["a point that is not a pair", '{"strokes":[[[1,2,3]]]}'],
    ["a point with a string coordinate", '{"strokes":[[["10","20"],[50,60],[100,20]]]}'],
    ["a point with a null coordinate", '{"strokes":[[[null,20],[50,60],[100,20]]]}'],
    ["a point with a nested value", '{"strokes":[[[[1],20],[50,60],[100,20]]]}'],
    ["an x outside the area", '{"strokes":[[[601,20],[50,60],[100,20]]]}'],
    ["a negative y", '{"strokes":[[[10,-1],[50,60],[100,20]]]}'],
    ["a y outside the area", '{"strokes":[[[10,241],[50,60],[100,20]]]}'],
  ])("rejects %s", (_label, raw) => {
    expect(parseSignaturePayload(raw).ok).toBe(false);
  });

  it("rejects anything but strokes: markup, scripts, links, extra fields and prototype tricks", () => {
    const hostile = [
      { svg: "<svg onload=alert(1)>" },
      { html: "<script>alert(1)</script>" },
      { href: "javascript:alert(1)" },
      { name: "Alex Example" },
      { v: 1 },
    ];
    for (const extra of hostile) {
      const r = parseSignaturePayload(JSON.stringify({ strokes: SQUIGGLE, ...extra }));
      expect(r.ok, JSON.stringify(extra)).toBe(false);
    }
    expect(parseSignaturePayload('{"strokes":[[[10,10],[50,40],[120,20]]],"__proto__":{"x":1}}').ok).toBe(false);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });

  it("rejects script text in place of numbers", () => {
    expect(parseSignaturePayload(body([[["<script>", 5], [50, 60], [100, 20]]])).ok).toBe(false);
    expect(parseSignaturePayload('{"strokes":[[[1e999,5],[50,60],[100,20]]]}').ok).toBe(false); // infinity
  });

  describe("limits", () => {
    const path = (n: number) => Array.from({ length: n }, (_, i) => [(i * 3) % 600, 20 + (i % 100)]);
    it("an oversized payload is refused before it is parsed", () => {
      const huge = "x".repeat(SIGNATURE_LIMITS.maxPayloadChars + 1);
      const r = parseSignaturePayload(huge);
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toContain("too large");
    });
    it("too many strokes are refused, the maximum is accepted", () => {
      const stroke = [[10, 10], [60, 60], [110, 20]];
      expect(parseSignaturePayload(body(Array.from({ length: SIGNATURE_LIMITS.maxStrokes }, () => stroke))).ok).toBe(true);
      const over = parseSignaturePayload(body(Array.from({ length: SIGNATURE_LIMITS.maxStrokes + 1 }, () => stroke)));
      expect(over.ok).toBe(false);
      expect(!over.ok && over.error).toContain("too many");
    });
    it("a single over-long stroke is refused", () => {
      const r = parseSignaturePayload(body([path(SIGNATURE_LIMITS.maxPointsPerStroke + 1)]));
      expect(r.ok).toBe(false);
    });
    it("too many points in total are refused", () => {
      const r = parseSignaturePayload(body(Array.from({ length: 6 }, () => path(1200)).map((s, k) => s.map(([x, y]) => [x, y + k]))));
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toContain("too many points");
    });
  });
});

describe("drawing the stored strokes", () => {
  it("builds path data from numbers only", () => {
    const paths = strokesToPaths([[[10, 10], [50.5, 40], [120, 20]], [[300, 100]]]);
    expect(paths).toEqual(["M10.0 10.0 L50.5 40.0 L120.0 20.0", "M300.0 100.0 L300.0 100.0"]);
    for (const d of paths) expect(d).toMatch(/^[ML0-9. ]+$/);
  });
  it("re-checks data read back from the database before drawing it", () => {
    expect(strokesFromStored({ v: 1, strokes: SQUIGGLE })).not.toBeNull();
    expect(strokesFromStored({ v: 1, strokes: [[["<img onerror=x>", 1], [2, 3], [4, 5]]] })).toBeNull();
    expect(strokesFromStored(null)).toBeNull();
    expect(strokesFromStored("<svg>")).toBeNull();
    expect(strokesFromStored({ strokes: [] })).toBeNull();
  });
});

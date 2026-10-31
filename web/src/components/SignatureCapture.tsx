"use client";

import { useActionState, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { SignatureImage } from "@/components/SignatureViews";
import { DISPLAY_WORDING, SIGNATURE_AREA, SIGNATURE_LIMITS, parseSignaturePayload, type Point, type Strokes } from "@/domain/signature";
import type { SignatureState } from "@/server/contribution-actions";

type Action = (previous: SignatureState, formData: FormData) => Promise<SignatureState>;
/** A guest the organiser chose to take this signature for (from the guest list). Visitors are never shown a list of guests. */
export interface LinkedGuest {
  id: string;
  name: string;
}

const KEY_STEP = 10;
const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));
const totalPoints = (s: Strokes) => s.reduce((n, stroke) => n + stroke.length, 0);

/**
 * The collection screen's signature input. Nothing here asks who the visitor is. The visitor draws, can undo the last
 * stroke or clear, previews the result, makes an explicit display-permission choice (neither option is preselected),
 * and submits. The drawing area works with mouse, touch and pen (pointer events) and, as a keyboard alternative, with
 * the arrow keys and Space. It has not been tested with a screen reader.
 */
export function SignatureCapture({
  action,
  eventId,
  linkedGuest = null,
  initialState = {},
  initialStep = "draw",
}: {
  action: Action;
  eventId: string;
  linkedGuest?: LinkedGuest | null;
  initialState?: SignatureState;
  initialStep?: "draw" | "preview";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [strokes, setStrokes] = useState<Strokes>([]);
  const [step, setStep] = useState<"draw" | "preview">(initialStep);
  const [notice, setNotice] = useState("");
  const [pen, setPen] = useState<{ x: number; y: number; down: boolean }>({ x: SIGNATURE_AREA.width / 2, y: SIGNATURE_AREA.height / 2, down: false });
  const active = useRef<number | null>(null); // pointer id being drawn with
  const surface = useRef<SVGSVGElement>(null);
  const errorBox = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.error) errorBox.current?.focus();
  }, [state]);

  const toPoint = (e: PointerEvent): Point => {
    const rect = surface.current!.getBoundingClientRect();
    const w = rect.width || SIGNATURE_AREA.width;
    const h = rect.height || SIGNATURE_AREA.height;
    return [clamp(((e.clientX - rect.left) * SIGNATURE_AREA.width) / w, SIGNATURE_AREA.width), clamp(((e.clientY - rect.top) * SIGNATURE_AREA.height) / h, SIGNATURE_AREA.height)];
  };

  const addPoint = (p: Point, newStroke: boolean) =>
    setStrokes((prev) => {
      if (totalPoints(prev) >= SIGNATURE_LIMITS.maxTotalPoints - 1 || (newStroke && prev.length >= SIGNATURE_LIMITS.maxStrokes)) {
        setNotice("The signature is as long as it can be. Clear it and draw a simpler one.");
        return prev;
      }
      if (newStroke) return [...prev, [p]];
      const last = prev[prev.length - 1];
      if (!last || last.length >= SIGNATURE_LIMITS.maxPointsPerStroke) return prev;
      const [lx, ly] = last[last.length - 1];
      if (Math.hypot(p[0] - lx, p[1] - ly) < 1.5) return prev; // skip tiny movements
      return [...prev.slice(0, -1), [...last, p]];
    });

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    active.current = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setNotice("");
    addPoint(toPoint(e), true);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (active.current !== e.pointerId) return;
    addPoint(toPoint(e), false);
  };
  const endStroke = (e: PointerEvent<SVGSVGElement>) => {
    if (active.current !== e.pointerId) return;
    active.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Keyboard alternative: Space puts the pen down or lifts it; arrow keys move it; Escape lifts it.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const down = !pen.down;
      setPen({ ...pen, down });
      setNotice(down ? "Pen down. Use the arrow keys to draw." : "Pen up.");
      if (down) addPoint([pen.x, pen.y], true);
    } else if (e.key === "Escape" && pen.down) {
      setPen({ ...pen, down: false });
      setNotice("Pen up.");
    } else if (moves[e.key]) {
      e.preventDefault();
      const step = e.shiftKey ? KEY_STEP * 3 : KEY_STEP;
      const next = { ...pen, x: clamp(pen.x + moves[e.key][0] * step, SIGNATURE_AREA.width), y: clamp(pen.y + moves[e.key][1] * step, SIGNATURE_AREA.height) };
      setPen(next);
      if (pen.down) addPoint([next.x, next.y], false);
    }
  };

  const undo = () => {
    setStrokes((prev) => prev.slice(0, -1));
    setNotice("Last stroke removed.");
  };
  const clear = () => {
    setStrokes([]);
    setNotice("Signature cleared.");
    setPen({ ...pen, down: false });
  };

  // The same check the server makes, so a mark that is too small is explained here instead of failing after submitting.
  const preview = () => {
    const check = parseSignaturePayload(JSON.stringify({ strokes }));
    if (!check.ok) {
      setNotice(check.error);
      return;
    }
    setNotice("");
    setStep("preview");
  };

  const hasInk = strokes.length > 0;
  const paths = strokes.map((s) => s.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (s.length === 1 ? " l0.1 0" : ""));

  return (
    <form action={formAction} noValidate className="signature-form">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="payload" value={JSON.stringify({ strokes })} />

      {state.error && (
        <p ref={errorBox} tabIndex={-1} role="alert" className="alert">
          {state.error}
        </p>
      )}

      {linkedGuest && (
        <div className="notice notice-info">
          <input type="hidden" name="guestId" value={linkedGuest.id} />
          <p>
            This signature will be linked to <strong>{linkedGuest.name}</strong> on the guest list. To take it without linking, start again from the collection screen.
          </p>
          {state.field === "guest" && state.error && <p className="error">{state.error}</p>}
        </div>
      )}

      {step === "draw" && (
        <section aria-labelledby="draw-title">
          <h2 id="draw-title">1. Draw the signature</h2>
          <p id="draw-help" className="hint">
            Draw in the box with a mouse, finger or pen. Keyboard: tab to the box, press Space to put the pen down or lift it, and use the arrow keys
            (hold Shift for bigger steps) to move. Synthetic signatures only.
          </p>
          <div
            className="pad-frame"
            tabIndex={0}
            role="group"
            aria-label="Signature drawing area"
            aria-describedby="draw-help"
            onKeyDown={onKeyDown}
          >
            <svg
              ref={surface}
              className="pad"
              viewBox={`0 0 ${SIGNATURE_AREA.width} ${SIGNATURE_AREA.height}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              aria-hidden="true"
              data-testid="pad"
            >
              {paths.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              <circle cx={pen.x} cy={pen.y} r={pen.down ? 5 : 4} className={pen.down ? "pen pen-down" : "pen"} />
            </svg>
          </div>
          <p role="status" className="hint" data-testid="pad-status">
            {notice || (hasInk ? `${strokes.length} ${strokes.length === 1 ? "stroke" : "strokes"} drawn.` : "Nothing drawn yet.")}
          </p>
          <div className="toolbar">
            <button type="button" className="button button-secondary button-large" onClick={undo} disabled={!hasInk}>
              Undo last stroke
            </button>
            <button type="button" className="button button-secondary button-large" onClick={clear} disabled={!hasInk}>
              Clear
            </button>
            <button type="button" className="button button-large" onClick={preview} disabled={!hasInk}>
              Preview signature
            </button>
          </div>
          <noscript>
            <p className="alert">Drawing needs JavaScript. Turn it on in your browser to use this screen.</p>
          </noscript>
        </section>
      )}

      {step === "preview" && (
        <section aria-labelledby="preview-title">
          <h2 id="preview-title">2. Check and submit</h2>
          <div className="preview-box">
            <SignatureImage strokes={strokes} label="Preview of the signature you drew" />
          </div>


          <fieldset className="permission" aria-describedby={state.field === "permission" ? "permission-error" : undefined}>
            <legend>Display permission (you must choose one)</legend>
            <p className="wording">{DISPLAY_WORDING}</p>
            {state.field === "permission" && state.error && (
              <p id="permission-error" className="error">{state.error}</p>
            )}
            <div className="choice">
              <input type="radio" id="permission-granted" name="permission" value="granted" required />
              <label htmlFor="permission-granted">Yes, this signature may be shown (demonstration only)</label>
            </div>
            <div className="choice">
              <input type="radio" id="permission-denied" name="permission" value="denied" required />
              <label htmlFor="permission-denied">No, keep this signature but do not show it</label>
            </div>
          </fieldset>

          <div className="toolbar">
            <button type="button" className="button button-secondary button-large" onClick={() => setStep("draw")}>
              Back to drawing
            </button>
            <button type="submit" className="button button-large" disabled={pending}>
              {pending ? "Saving…" : "Submit signature"}
            </button>
          </div>
        </section>
      )}
    </form>
  );
}

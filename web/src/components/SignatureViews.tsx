import { SIGNATURE_AREA, strokesFromStored, strokesToPaths, type Strokes } from "@/domain/signature";

/**
 * Draws pen strokes as an SVG. The picture is built only from the validated numbers: no text from the visitor reaches
 * the markup, so a signature cannot carry a script or a link.
 */
export function SignatureImage({ strokes, label }: { strokes: Strokes | null; label: string }) {
  // Checked again here, so even data that reached this component from an unexpected place cannot break the page or add markup.
  const safe = strokes ? strokesFromStored({ strokes }) : null;
  if (!safe) return <p className="hint">This signature could not be shown.</p>;
  return (
    <svg className="signature-image" viewBox={`0 0 ${SIGNATURE_AREA.width} ${SIGNATURE_AREA.height}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      {strokesToPaths(safe).map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

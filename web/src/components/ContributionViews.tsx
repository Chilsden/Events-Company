import { SignatureImage } from "@/components/SignatureViews";
import type { PermissionStatus } from "@/domain/signature";
import type { ContributionView } from "@/server/contributions-repository";

type FormAction = (formData: FormData) => void | Promise<void>;

const when = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(iso));

const STATUS: Record<PermissionStatus, { label: string; explain: string }> = {
  granted: { label: "Display permission given", explain: "May be used for the demonstration display." },
  denied: { label: "Display permission not given", explain: "Kept, but must not be shown." },
  revoked: { label: "Display permission withdrawn", explain: "Kept, but no longer eligible for display." },
};

export function ContributionList({ items, eventId, revokeAction }: { items: ContributionView[]; eventId: string; revokeAction: FormAction }) {
  if (items.length === 0) return <p>No signatures have been collected for this event yet.</p>;
  return (
    <ul className="contributions" aria-label="Collected signatures">
      {items.map((c, i) => (
        <li key={c.id} className="contribution" id={`contribution-${c.id}`}>
          <h2>
            Signature {items.length - i}
          </h2>
          <SignatureImage strokes={c.strokes} label={`Signature ${items.length - i}, submitted ${when(c.createdAt)}`} />
          <dl className="details">
            <dt>Submitted</dt>
            <dd>
              <time dateTime={c.createdAt}>{when(c.createdAt)}</time>
            </dd>
            <dt>Linked to a guest</dt>
            <dd>{c.linkedToGuest ? "Yes" : "No (anonymous)"}</dd>
            <dt>Display permission</dt>
            <dd>
              <strong>{STATUS[c.status].label}</strong>. {STATUS[c.status].explain} <span className="hint">Last changed <time dateTime={c.statusChangedAt}>{when(c.statusChangedAt)}</time>.</span>
            </dd>
          </dl>
          {c.status === "granted" && (
            <form action={revokeAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="contributionId" value={c.id} />
              <button type="submit" className="button button-secondary button-large">
                Withdraw display permission<span className="visually-hidden"> for signature {items.length - i}</span>
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

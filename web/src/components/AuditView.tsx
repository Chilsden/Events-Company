import { AUDIT_PAGE_SIZE, OPERATOR_LABEL, type AuditAction, type AuditEntry } from "@/domain/guest";

const LABELS: Record<AuditAction, string> = {
  guest_added: "Guest added",
  guests_imported: "Guests imported from CSV",
  guest_renamed: "Guest name changed",
  checked_in: "Checked in",
  check_in_undone: "Check-in undone",
  checked_in_again: "Checked in again (after an undo)",
  module_enabled: "Input switched on",
  module_disabled: "Input switched off",
  contribution_submitted: "Signature submitted",
  display_permission_revoked: "Display permission withdrawn",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: "Europe/London" }).format(new Date(iso));

export function AuditList({ entries, total }: { entries: AuditEntry[]; total: number }) {
  if (entries.length === 0) return <p>Nothing has been recorded for this event yet.</p>;
  return (
    <>
      <p>
        Showing the latest {entries.length} of {total} recorded {total === 1 ? "event" : "events"}, newest first. Records can be added but never changed or removed.
        {total > AUDIT_PAGE_SIZE && ` Older records are kept but not shown here.`}
      </p>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Audit history table (scrolls sideways on narrow screens)">
        <table className="audit">
          <caption className="visually-hidden">Audit history, newest first</caption>
          <thead>
            <tr>
              <th scope="col">No.</th>
              <th scope="col">Time (UK)</th>
              <th scope="col">What happened</th>
              <th scope="col">Guest</th>
              <th scope="col">Who</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.seq}>
                <td>{e.seq}</td>
                <td>
                  <time dateTime={e.occurredAt}>{when(e.occurredAt)}</time>
                </td>
                <td>
                  {LABELS[e.action]}
                  {e.action === "guests_imported" && e.count !== null ? ` (${e.count})` : ""}
                  {(e.action === "module_enabled" || e.action === "module_disabled") && e.module ? `: ${e.module.replaceAll("_", " ")}` : ""}
                </td>
                <td>{e.guestId ? (e.guestName ?? "(unknown guest)") : e.contributionId ? "A contribution (no name)" : "—"}</td>
                <td>{e.actor === OPERATOR_LABEL ? "Local demonstration operator" : e.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

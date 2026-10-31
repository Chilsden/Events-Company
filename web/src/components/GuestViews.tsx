import Link from "next/link";
import { Announcer, FocusOnMount } from "@/components/ClientHelpers";
import { formatCheckInTime, type Attendance, type GuestRecord, type Notice } from "@/domain/guest";

type FormAction = (formData: FormData) => void | Promise<void>;

export function AttendanceSummary({ attendance }: { attendance: Attendance }) {
  return (
    <section aria-labelledby="attendance-title" className="summary">
      <h2 id="attendance-title">Attendance</h2>
      <dl className="totals">
        <div>
          <dt>Total guests</dt>
          <dd data-testid="total">{attendance.total}</dd>
        </div>
        <div>
          <dt>Checked in</dt>
          <dd data-testid="checked-in">{attendance.checkedIn}</dd>
        </div>
        <div>
          <dt>Not yet checked in</dt>
          <dd data-testid="not-checked-in">{attendance.notCheckedIn}</dd>
        </div>
      </dl>
    </section>
  );
}

export function noticeText(notice: Notice, name?: string, count?: number): { text: string; tone: "ok" | "info" | "problem" } {
  const who = name ?? "The guest";
  const guests = (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`;
  switch (notice) {
    case "added":
      return { text: name ? `${who} was added to the guest list.` : "The guest was added to the guest list.", tone: "ok" };
    case "checked-in":
      return { text: `${who} is now checked in.`, tone: "ok" };
    case "already":
      return { text: `${who} was already checked in. Nothing has changed.`, tone: "info" };
    case "undone":
      return { text: `${who}'s check-in was undone. ${who === "The guest" ? "The guest is" : "They are"} back on the not yet checked in list. The earlier check-in stays in the audit history.`, tone: "ok" };
    case "not-checked-in":
      return { text: `${who} was not checked in, so there was nothing to undo.`, tone: "info" };
    case "renamed":
      return { text: name ? `The guest's name is now ${who}.` : "The guest's name was changed.", tone: "ok" };
    case "rename-unchanged":
      return { text: "That is already the guest's name. Nothing has changed.", tone: "info" };
    case "imported":
      return { text: `${guests(count ?? 0)} imported from the file.`, tone: "ok" };
    case "import-repeated":
      return { text: `This import had already been saved (${guests(count ?? 0)}). Nothing was added twice.`, tone: "info" };
    case "module-disabled":
      return { text: "That input is switched off for this event, so nothing was changed. Switch it on under Inputs first.", tone: "problem" };
    case "modules-saved":
      return { text: "The inputs for this event were updated. Anything already collected has been kept.", tone: "ok" };
    case "contribution-saved":
      return { text: "Thank you. The signature was saved. You can add another.", tone: "ok" };
    case "permission-revoked":
      return { text: "Display permission was withdrawn. The signature is kept but can no longer be used for display.", tone: "ok" };
    case "permission-not-granted":
      return { text: "Display permission was not active for that item, so nothing was changed.", tone: "info" };
    case "not-found":
      return { text: "That guest could not be found for this event. Nothing was changed.", tone: "problem" };
    case "error":
      return { text: "The change could not be saved. Nothing was changed. Please try again.", tone: "problem" };
  }
}

/** A visible message plus a screen-reader announcement that is added after the page loads. */
export function NoticeBanner({ notice, guestName, count }: { notice: Notice; guestName?: string; count?: number }) {
  const { text, tone } = noticeText(notice, guestName, count);
  return (
    <div className={`notice notice-${tone}`}>
      <p>{text}</p>
      <Announcer text={text} urgent={tone === "problem"} />
    </div>
  );
}

export function GuestList({
  guests,
  eventId,
  search,
  highlightId,
  checkInAction,
  undoAction,
  showAttendance = true,
  signatureEnabled = false,
}: {
  guests: GuestRecord[];
  eventId: string;
  search: string;
  highlightId?: string;
  checkInAction: FormAction;
  undoAction: FormAction;
  /** When attendance is switched off for the event, guests are listed without check-in status or buttons. */
  showAttendance?: boolean;
  /** Offers "Take a signature" on each row, which opens the collection screen linked to that guest. */
  signatureEnabled?: boolean;
}) {
  if (guests.length === 0) {
    return search ? (
      <p>No guests match that search. Clear the search to see everyone.</p>
    ) : (
      <p>There are no guests yet. Add a synthetic guest above, or import a CSV file, to start checking people in.</p>
    );
  }
  const focusId = highlightId && guests.some((g) => g.id === highlightId) ? `guest-${highlightId}` : undefined;
  return (
    <>
      {focusId && <FocusOnMount targetId={focusId} />}
      <ul className="guests" aria-label="Guest list">
        {guests.map((g) => (
          <li key={g.id} id={`guest-${g.id}`} tabIndex={-1} className={`guest${g.id === highlightId ? " guest-highlight" : ""}`}>
            <div className="guest-main">
              <span className="guest-name">{g.name}</span>
              {!showAttendance ? null : g.checkedInAt ? (
                <span className="status status-in">
                  <span aria-hidden="true">✔ </span>Checked in at <time dateTime={g.checkedInAt}>{formatCheckInTime(g.checkedInAt)}</time>
                </span>
              ) : (
                <span className="status status-out">Not yet checked in</span>
              )}
            </div>
            <div className="guest-actions">
              {showAttendance && (
                <form action={g.checkedInAt ? undoAction : checkInAction}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="guestId" value={g.id} />
                  <input type="hidden" name="q" value={search} />
                  {g.checkedInAt ? (
                    <button type="submit" className="button button-large button-secondary">
                      Undo check-in<span className="visually-hidden"> for {g.name}</span>
                    </button>
                  ) : (
                    <button type="submit" className="button button-large">
                      Check in<span className="visually-hidden"> {g.name}</span>
                    </button>
                  )}
                </form>
              )}
              {signatureEnabled && (
                <Link className="button button-secondary" href={`/events/${eventId}/check-in/collect?guest=${g.id}`}>
                  Take a signature<span className="visually-hidden"> for {g.name}</span>
                </Link>
              )}
              <Link className="button button-secondary" href={`/events/${eventId}/check-in/guests/${g.id}/edit`}>
                Edit name<span className="visually-hidden"> of {g.name}</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

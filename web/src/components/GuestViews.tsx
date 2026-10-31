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

const NOTICE_TEXT = (notice: Notice, name?: string): { text: string; tone: "ok" | "info" | "problem" } => {
  const who = name ?? "The guest";
  switch (notice) {
    case "added":
      return { text: name ? `${who} was added to the guest list.` : "The guest was added to the guest list.", tone: "ok" };
    case "checked-in":
      return { text: `${who} is now checked in.`, tone: "ok" };
    case "already":
      return { text: `${who} was already checked in. Nothing has changed.`, tone: "info" };
    case "not-found":
      return { text: "That guest could not be found for this event. Nothing was changed.", tone: "problem" };
    case "error":
      return { text: "The check-in could not be saved. Please try again.", tone: "problem" };
  }
};

export function NoticeBanner({ notice, guestName }: { notice: Notice; guestName?: string }) {
  const { text, tone } = NOTICE_TEXT(notice, guestName);
  return (
    <p role={tone === "problem" ? "alert" : "status"} className={`notice notice-${tone}`}>
      {text}
    </p>
  );
}

export function GuestList({
  guests,
  eventId,
  search,
  highlightId,
  checkInAction,
}: {
  guests: GuestRecord[];
  eventId: string;
  search: string;
  highlightId?: string;
  checkInAction: FormAction;
}) {
  if (guests.length === 0) {
    return search ? (
      <p>No guests match that search. Clear the search to see everyone.</p>
    ) : (
      <p>There are no guests yet. Add a synthetic guest above to start checking people in.</p>
    );
  }
  return (
    <ul className="guests" aria-label="Guest list">
      {guests.map((g) => (
        <li key={g.id} id={`guest-${g.id}`} className={`guest${g.id === highlightId ? " guest-highlight" : ""}`}>
          <div className="guest-main">
            <span className="guest-name">{g.name}</span>
            {g.checkedInAt ? (
              <span className="status status-in">
                <span aria-hidden="true">✔ </span>Checked in at <time dateTime={g.checkedInAt}>{formatCheckInTime(g.checkedInAt)}</time>
              </span>
            ) : (
              <span className="status status-out">Not yet checked in</span>
            )}
          </div>
          {g.checkedInAt ? null : (
            <form action={checkInAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="guestId" value={g.id} />
              <input type="hidden" name="q" value={search} />
              <button type="submit" className="button button-large">
                Check in<span className="visually-hidden"> {g.name}</span>
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

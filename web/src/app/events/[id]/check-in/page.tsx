import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddGuestForm } from "@/components/GuestForms";
import { AttendanceSummary, GuestList, NoticeBanner } from "@/components/GuestViews";
import { formatEventDate, isUuid } from "@/domain/event";
import { cleanSearch, SEARCH_MAX } from "@/domain/guest";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { addGuestAction, checkInAction, undoCheckInAction } from "@/server/guest-actions";
import { getAttendance, listGuests } from "@/server/guests-repository";
import { getModuleSettings } from "@/server/modules-repository";
import { readReceipt } from "@/server/receipts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Check-in Studio" };

type Params = { id: string };
// Only the search text and a server-issued receipt id are read from the address. A message is shown only for a
// receipt the server itself issued, so a link cannot make the page claim that something happened.
type Search = { q?: string; r?: string };

export default async function CheckInPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const { id } = await params;
  const query = await searchParams;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();

  const settings = await getModuleSettings(db, DEMO_ACCOUNT_ID, event.id);
  const search = cleanSearch(query.q);
  const receipt = readReceipt(query.r, event.id);
  const [attendance, guests, everyone] = await Promise.all([
    settings.attendance ? getAttendance(db, DEMO_ACCOUNT_ID, event.id) : Promise.resolve(null),
    settings.guest_registration ? listGuests(db, DEMO_ACCOUNT_ID, event.id, search) : Promise.resolve([]),
    settings.guest_registration && search ? listGuests(db, DEMO_ACCOUNT_ID, event.id) : Promise.resolve(null),
  ]);
  const highlightId = receipt?.guestId && isUuid(receipt.guestId) ? receipt.guestId : undefined;
  const named = (everyone ?? guests).find((g) => g.id === highlightId);

  return (
    <>
      <p>
        <Link href={`/events/${event.id}`}>Back to {event.name}</Link>
      </p>
      <h1>Check-in Studio</h1>
      <p>
        {event.name}, <time dateTime={event.date}>{formatEventDate(event.date)}</time>, {event.location}
      </p>
      <p className="toolbar">
        <Link className="button button-secondary" href={`/events/${event.id}/check-in/modules`}>Inputs for this event</Link>
        {settings.signature && <Link className="button" href={`/events/${event.id}/check-in/collect`}>Open collection screen</Link>}
        <Link className="button button-secondary" href={`/events/${event.id}/check-in/contributions`}>Collected signatures</Link>
        {settings.guest_registration && <Link className="button button-secondary" href={`/events/${event.id}/check-in/import`}>Import guests from CSV</Link>}
        <Link className="button button-secondary" href={`/events/${event.id}/check-in/audit`}>View audit history</Link>
      </p>

      {receipt && <NoticeBanner notice={receipt.notice} guestName={named?.name} count={receipt.count} />}

      {!settings.guest_registration && (
        <div className="notice notice-info">
          <p>
            The guest list is switched off for this event, so there is no registration or check-in here.{" "}
            {settings.signature ? "Use the collection screen to take signatures." : "Choose what this event collects under Inputs."}
          </p>
        </div>
      )}

      {attendance && <AttendanceSummary attendance={attendance} />}

      {settings.guest_registration && (
        <>
          <section aria-labelledby="add-title">
            <h2 id="add-title">Add a guest</h2>
            <AddGuestForm action={addGuestAction} eventId={event.id} />
          </section>

          <section aria-labelledby="guests-title">
            <h2 id="guests-title">Guest list</h2>
            <form method="get" role="search" className="search" aria-label="Find a guest">
              <label htmlFor="q">Search by name</label>
              <input id="q" name="q" type="search" defaultValue={search} maxLength={SEARCH_MAX} autoComplete="off" />
              <button type="submit" className="button">Search</button>
              {search && <Link href={`/events/${event.id}/check-in`}>Clear search</Link>}
            </form>
            <GuestList
              guests={guests}
              eventId={event.id}
              search={search}
              highlightId={highlightId}
              checkInAction={checkInAction}
              undoAction={undoCheckInAction}
              showAttendance={settings.attendance}
              signatureEnabled={settings.signature}
            />
          </section>
        </>
      )}
    </>
  );
}

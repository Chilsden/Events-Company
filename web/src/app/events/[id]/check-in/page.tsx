import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddGuestForm } from "@/components/GuestForms";
import { AttendanceSummary, GuestList, NoticeBanner } from "@/components/GuestViews";
import { formatEventDate, isUuid } from "@/domain/event";
import { cleanSearch, isNotice, SEARCH_MAX } from "@/domain/guest";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { addGuestAction, checkInAction } from "@/server/guest-actions";
import { getAttendance, listGuests } from "@/server/guests-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Check-in Studio" };

type Params = { id: string };
type Search = { q?: string; notice?: string; g?: string };

export default async function CheckInPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const { id } = await params;
  const query = await searchParams;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();

  const search = cleanSearch(query.q);
  const [attendance, guests, everyone] = await Promise.all([
    getAttendance(db, DEMO_ACCOUNT_ID, event.id),
    listGuests(db, DEMO_ACCOUNT_ID, event.id, search),
    search ? listGuests(db, DEMO_ACCOUNT_ID, event.id) : Promise.resolve(null),
  ]);
  const highlightId = typeof query.g === "string" && isUuid(query.g) ? query.g : undefined;
  const named = (everyone ?? guests).find((g) => g.id === highlightId);
  const notice = isNotice(query.notice) ? query.notice : undefined;

  return (
    <>
      <p>
        <Link href={`/events/${event.id}`}>Back to {event.name}</Link>
      </p>
      <h1>Check-in Studio</h1>
      <p>
        {event.name}, <time dateTime={event.date}>{formatEventDate(event.date)}</time>, {event.location}
      </p>

      {notice && <NoticeBanner notice={notice} guestName={named?.name} />}
      <AttendanceSummary attendance={attendance} />

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
        <GuestList guests={guests} eventId={event.id} search={search} highlightId={highlightId} checkInAction={checkInAction} />
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventDetails } from "@/components/EventViews";
import { AttendanceSummary } from "@/components/GuestViews";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { getAttendance } from "@/server/guests-repository";
import { getModuleSettings } from "@/server/modules-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event details" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  const settings = await getModuleSettings(db, DEMO_ACCOUNT_ID, event.id);
  const attendance = settings.attendance ? await getAttendance(db, DEMO_ACCOUNT_ID, event.id) : null;
  return (
    <>
      <EventDetails event={event} />
      {attendance && <AttendanceSummary attendance={attendance} />}
      <p className="toolbar">
        <Link className="button button-large" href={`/events/${event.id}/check-in`}>Open Check-in Studio</Link>
        {settings.signature && <Link className="button button-large" href={`/events/${event.id}/check-in/collect`}>Open collection screen</Link>}
        <Link className="button button-secondary button-large" href={`/events/${event.id}/check-in/modules`}>Choose inputs</Link>
      </p>
    </>
  );
}

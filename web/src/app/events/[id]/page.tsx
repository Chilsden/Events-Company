import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventDetails } from "@/components/EventViews";
import { AttendanceSummary } from "@/components/GuestViews";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { getAttendance } from "@/server/guests-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event details" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  const attendance = await getAttendance(db, DEMO_ACCOUNT_ID, event.id);
  return (
    <>
      <EventDetails event={event} />
      <AttendanceSummary attendance={attendance} />
      <p>
        <Link className="button button-large" href={`/events/${event.id}/check-in`}>Open Check-in Studio</Link>
      </p>
    </>
  );
}

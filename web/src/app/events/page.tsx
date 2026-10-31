import type { Metadata } from "next";
import Link from "next/link";
import { EventList } from "@/components/EventViews";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { listEvents } from "@/server/events-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await listEvents(await getDatabase(), DEMO_ACCOUNT_ID);
  return (
    <>
      <h1>Events</h1>
      <p>
        <Link className="button" href="/events/new">Create an event</Link>
      </p>
      <EventList events={events} />
    </>
  );
}

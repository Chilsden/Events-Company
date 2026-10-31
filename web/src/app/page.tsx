import Link from "next/link";
import { EventList } from "@/components/EventViews";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { listEvents } from "@/server/events-repository";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const events = await listEvents(await getDatabase(), DEMO_ACCOUNT_ID);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()); // YYYY-MM-DD in UK time
  const upcoming = events.filter((e) => e.date >= today);
  return (
    <>
      <h1>Dashboard</h1>
      <p>
        You have <strong>{events.length}</strong> {events.length === 1 ? "event" : "events"}, <strong>{upcoming.length}</strong> upcoming.
      </p>
      <p>
        <Link className="button" href="/events/new">Create an event</Link>
      </p>
      <h2>Next events</h2>
      <EventList events={upcoming.slice(0, 3)} />
      {events.length > 0 && (
        <p>
          <Link href="/events">See all events</Link>
        </p>
      )}
    </>
  );
}

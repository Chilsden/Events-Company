import Link from "next/link";
import { formatEventDate, type EventRecord } from "@/domain/event";

export function EventList({ events }: { events: EventRecord[] }) {
  if (events.length === 0) {
    return (
      <p>
        There are no events here yet. <Link href="/events/new">Create an event</Link>.
      </p>
    );
  }
  return (
    <ul className="cards" aria-label="Events">
      {events.map((e) => (
        <li key={e.id} className="card">
          <h2>
            <Link href={`/events/${e.id}`}>{e.name}</Link>
          </h2>
          <p>
            <time dateTime={e.date}>{formatEventDate(e.date)}</time>
          </p>
          <p>{e.location}</p>
        </li>
      ))}
    </ul>
  );
}

export function EventDetails({ event }: { event: EventRecord }) {
  return (
    <article>
      <h1>{event.name}</h1>
      <dl className="details">
        <dt>Date</dt>
        <dd>
          <time dateTime={event.date}>{formatEventDate(event.date)}</time>
        </dd>
        <dt>Location</dt>
        <dd>{event.location}</dd>
        <dt>Description</dt>
        <dd className="wrap">{event.description ?? "No description provided."}</dd>
        <dt>Event reference</dt>
        <dd>
          <code>{event.id}</code>
        </dd>
      </dl>
      <p>
        <Link href="/events">Back to all events</Link>
      </p>
    </article>
  );
}

export function NotFoundContent() {
  return (
    <section>
      <h1>Event not found</h1>
      <p>We could not find that event. It may not exist, or the link may be wrong.</p>
      <p>
        <Link href="/events">Go to all events</Link>
      </p>
    </section>
  );
}

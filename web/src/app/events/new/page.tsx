import type { Metadata } from "next";
import { EventForm } from "@/components/EventForm";
import { createEventAction } from "@/server/actions";

export const metadata: Metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <>
      <h1>Create an event</h1>
      <p>Fields marked required must be filled in. This prototype stores events on this computer only.</p>
      <EventForm action={createEventAction} />
    </>
  );
}

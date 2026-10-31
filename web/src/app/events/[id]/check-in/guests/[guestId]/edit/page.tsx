import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RenameGuestForm } from "@/components/GuestForms";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { renameGuestAction } from "@/server/guest-actions";
import { getGuest } from "@/server/guests-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit guest name" };

export default async function EditGuestPage({ params }: { params: Promise<{ id: string; guestId: string }> }) {
  const { id, guestId } = await params;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  const guest = await getGuest(db, DEMO_ACCOUNT_ID, event.id, guestId); // only a guest of this event and account
  if (!guest) notFound();
  return (
    <>
      <p>
        <Link href={`/events/${event.id}/check-in#guest-${guest.id}`}>Back to Check-in Studio</Link>
      </p>
      <h1>Edit guest name</h1>
      <p>Event: {event.name}</p>
      <RenameGuestForm action={renameGuestAction} eventId={event.id} guestId={guest.id} currentName={guest.name} />
    </>
  );
}

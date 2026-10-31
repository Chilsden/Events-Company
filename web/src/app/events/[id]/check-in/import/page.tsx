import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImportFlow } from "@/components/GuestForms";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { confirmImportAction, previewImportAction } from "@/server/guest-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Import guests" };

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(await getDatabase(), DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  return (
    <>
      <p>
        <Link href={`/events/${event.id}/check-in`}>Back to Check-in Studio</Link>
      </p>
      <h1>Import guests from CSV</h1>
      <p>Adding guests to <strong>{event.name}</strong>. Synthetic names only: this prototype has no sign-in and no production security.</p>
      <ImportFlow eventId={event.id} previewAction={previewImportAction} confirmAction={confirmImportAction} />
    </>
  );
}

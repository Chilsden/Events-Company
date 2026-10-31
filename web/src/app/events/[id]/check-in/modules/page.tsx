import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoticeBanner } from "@/components/GuestViews";
import { ModulesForm } from "@/components/ModulesForm";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { saveModulesAction } from "@/server/module-actions";
import { getModules } from "@/server/modules-repository";
import { readReceipt } from "@/server/receipts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inputs" };

export default async function ModulesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  const modules = await getModules(db, DEMO_ACCOUNT_ID, event.id);
  const receipt = readReceipt(query.r, event.id);
  return (
    <>
      <p>
        <Link href={`/events/${event.id}/check-in`}>Back to Check-in Studio</Link>
      </p>
      <h1>Inputs for this event</h1>
      <p>
        Choose what Check-in Studio collects for <strong>{event.name}</strong>. This setting belongs to this event only. For a signatures-only event,
        pick &quot;Signatures only&quot;: visitors then sign without registering, giving a name, or being checked in.
      </p>
      {receipt && <NoticeBanner notice={receipt.notice} />}
      <ModulesForm action={saveModulesAction} eventId={event.id} modules={modules} />
    </>
  );
}

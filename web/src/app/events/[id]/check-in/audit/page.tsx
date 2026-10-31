import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditList } from "@/components/AuditView";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { listAudit } from "@/server/guests-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit history" };

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  const { entries, total } = await listAudit(db, DEMO_ACCOUNT_ID, event.id);
  return (
    <>
      <p>
        <Link href={`/events/${event.id}/check-in`}>Back to Check-in Studio</Link>
      </p>
      <h1>Audit history</h1>
      <p>{event.name}</p>
      <div className="notice notice-info">
        <p>
          <strong>Who:</strong> there is no sign-in yet, so every record says &quot;Local demonstration operator&quot;. That is not a verified person and
          cannot show who really made a change. Names are not stored in the history: guests are shown by their current name.
        </p>
      </div>
      <AuditList entries={entries} total={total} />
    </>
  );
}

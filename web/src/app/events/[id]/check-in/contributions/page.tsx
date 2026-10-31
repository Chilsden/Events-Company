import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributionList } from "@/components/ContributionViews";
import { NoticeBanner } from "@/components/GuestViews";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { revokePermissionAction } from "@/server/contribution-actions";
import { listContributions, listEligibleContributions } from "@/server/contributions-repository";
import { getModuleSettings } from "@/server/modules-repository";
import { readReceipt } from "@/server/receipts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collected signatures" };

export default async function ContributionsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  const [items, settings, eligible] = await Promise.all([
    listContributions(db, DEMO_ACCOUNT_ID, event.id),
    getModuleSettings(db, DEMO_ACCOUNT_ID, event.id),
    listEligibleContributions(db, DEMO_ACCOUNT_ID, event.id),
  ]);
  const receipt = readReceipt(query.r, event.id);
  return (
    <>
      <p>
        <Link href={`/events/${event.id}/check-in`}>Back to Check-in Studio</Link>
      </p>
      <h1>Collected signatures</h1>
      <p>{event.name}</p>
      <div className="notice notice-info">
        <p>
          Everything here is synthetic. Display permission here is a <strong>demonstration</strong> choice recorded by the local operator: it is not real consent
          from a real person. Withdrawing it keeps the signature but removes it from anything another product may show.
        </p>
      </div>
      {receipt && <NoticeBanner notice={receipt.notice} />}
      <p data-testid="eligible">
        Eligible for display by other products (Mosaic, Event Gallery): <strong>{eligible.length}</strong> of <strong>{items.length}</strong> {items.length === 1 ? "signature" : "signatures"}. Only signatures with display permission given and not withdrawn are counted.
      </p>
      {!settings.signature && items.length > 0 && <p className="hint">Signature capture is switched off for this event. These earlier signatures have been kept.</p>}
      <ContributionList items={items} eventId={event.id} revokeAction={revokePermissionAction} />
      {settings.signature && (
        <p>
          <Link className="button" href={`/events/${event.id}/check-in/collect`}>Open collection screen</Link>
        </p>
      )}
    </>
  );
}

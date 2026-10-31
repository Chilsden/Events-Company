import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoticeBanner } from "@/components/GuestViews";
import { SignatureCapture } from "@/components/SignatureCapture";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";
import { submitSignatureAction } from "@/server/contribution-actions";
import { isUuid } from "@/domain/event";
import { getGuest } from "@/server/guests-repository";
import { getModuleSettings } from "@/server/modules-repository";
import { readReceipt } from "@/server/receipts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collection screen" };

export default async function CollectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string; guest?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const db = await getDatabase();
  const event = await getEvent(db, DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  const settings = await getModuleSettings(db, DEMO_ACCOUNT_ID, event.id);
  const receipt = readReceipt(query.r, event.id);
  // No list of guests is ever shown on this screen: it is where visitors sign. A signature is linked to a guest only when
  // the organiser opens this screen from that guest's row (?guest=<id>), and only for a guest of this event while the guest list is on.
  const linked = settings.guest_registration && settings.signature && typeof query.guest === "string" && isUuid(query.guest) ? await getGuest(db, DEMO_ACCOUNT_ID, event.id, query.guest) : null;

  return (
    <>
      <p>
        <Link href={`/events/${event.id}`}>Back to event management</Link>
      </p>
      <h1>Collection screen</h1>
      <p>
        {event.name}. Synthetic data only: this prototype has no sign-in and no production security.
      </p>
      {receipt && <NoticeBanner notice={receipt.notice} />}

      {settings.signature ? (
        <>
          <SignatureCapture action={submitSignatureAction} eventId={event.id} linkedGuest={linked ? { id: linked.id, name: linked.name } : null} />
          <section aria-labelledby="a11y-title" className="hint-box">
            <h2 id="a11y-title">About this drawing area</h2>
            <p>
              The signature box is a drawing surface. It works with a mouse, touch or pen, and with the keyboard (Space and the arrow keys). It has <strong>not</strong> been
              tested with a screen reader or other assistive technology, and drawing a signature may not be possible for everyone. If someone cannot use it, do not
              ask them to; this prototype has no other way to sign.
            </p>
          </section>
        </>
      ) : (
        <div className="alert">
          <p>No input is switched on for this event, so there is nothing to collect here.</p>
          <p>
            <Link href={`/events/${event.id}/check-in/modules`}>Choose the inputs for this event</Link>
          </p>
        </div>
      )}
      <p className="toolbar">
        <Link className="button button-secondary" href={`/events/${event.id}/check-in/contributions`}>View collected signatures</Link>
        <Link className="button button-secondary" href={`/events/${event.id}/check-in/modules`}>Inputs</Link>
      </p>
    </>
  );
}

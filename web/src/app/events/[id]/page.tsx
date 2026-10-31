import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetails } from "@/components/EventViews";
import { DEMO_ACCOUNT_ID, getDatabase } from "@/server/database";
import { getEvent } from "@/server/events-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event details" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(await getDatabase(), DEMO_ACCOUNT_ID, id);
  if (!event) notFound();
  return <EventDetails event={event} />;
}

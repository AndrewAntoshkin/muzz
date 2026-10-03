import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventView } from "@/components/EventView";
import { eventSlugs, getEvent } from "@/lib/events";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return eventSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Мероприятие · Кадр" };
  return { title: `${event.shortTitle} · Кадр` };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <div className="app-main__body">
      <main className="page-area">
        <EventView event={event} />
      </main>
    </div>
  );
}

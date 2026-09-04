import type { Metadata } from "next";
import { CastingResponsesView } from "@/components/CastingResponsesView";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Отклики · ${decodeURIComponent(slug)} · Кадр` };
}

export default async function CastingResponsesPage({ params }: Props) {
  const { slug } = await params;
  return <CastingResponsesView slug={slug} />;
}

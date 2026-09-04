import type { Metadata } from "next";
import { ResponseView } from "@/components/ResponseView";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Отклик · ${decodeURIComponent(id)} · Кадр` };
}

export default async function ResponsePage({ params }: Props) {
  const { id } = await params;
  return <ResponseView id={decodeURIComponent(id)} />;
}

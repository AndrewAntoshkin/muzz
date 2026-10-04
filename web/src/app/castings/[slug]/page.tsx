import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CastingView } from "@/components/CastingView";
import { castingMeta } from "@/server/workspace/public";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const casting = await castingMeta(slug);
  if (!casting) return { title: "Кастинг не найден · Кадр" };
  return { title: `${casting.title} — ${casting.projectTitle} · Кадр` };
}

export default async function CastingPage({ params }: Props) {
  const { slug } = await params;
  if (!(await castingMeta(slug))) notFound();
  return (
    <div className="app-main__body">
      <main className="page-area">
        <CastingView slug={slug} />
      </main>
    </div>
  );
}

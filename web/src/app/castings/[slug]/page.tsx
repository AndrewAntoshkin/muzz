import type { Metadata } from "next";
import { CastingView } from "@/components/CastingView";
import { getCasting, getProject } from "@/lib/productions";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const casting = getCasting(slug);
  if (!casting) return { title: "Кастинг · Кадр" };
  const project = getProject(casting.projectSlug);
  return { title: `${casting.title}${project ? ` — ${project.title}` : ""} · Кадр` };
}

export default async function CastingPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="app-main__body">
      <main className="page-area">
        <CastingView slug={slug} />
      </main>
    </div>
  );
}

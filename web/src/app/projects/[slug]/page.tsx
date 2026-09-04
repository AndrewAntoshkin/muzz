import type { Metadata } from "next";
import { ProjectView } from "@/components/ProjectView";
import { getProject } from "@/lib/productions";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Проект · Кадр" };
  return { title: `${project.title} · проект — Кадр` };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="app-main__body">
      <main className="page-area">
        <ProjectView slug={slug} />
      </main>
    </div>
  );
}

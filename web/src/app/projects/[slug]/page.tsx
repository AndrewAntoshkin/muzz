import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/ProjectView";
import { projectTitle } from "@/server/workspace/public";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = await projectTitle(slug);
  if (!title) return { title: "Проект не найден · Кадр" };
  return { title: `${title} · проект — Кадр` };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!(await projectTitle(slug))) notFound();
  return (
    <div className="app-main__body">
      <main className="page-area">
        <ProjectView slug={slug} />
      </main>
    </div>
  );
}

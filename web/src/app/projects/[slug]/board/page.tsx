import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectBoardRoute } from "@/components/ProjectBoard";
import { projectTitle } from "@/server/workspace/public";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = await projectTitle(slug);
  if (!title) return { title: "Проект не найден · Кадр" };
  return { title: `${title} · доска — Кадр` };
}

export default async function ProjectBoardPage({ params }: Props) {
  const { slug } = await params;
  if (!(await projectTitle(slug))) notFound();
  return (
    <div className="app-main__body">
      <ProjectBoardRoute slug={slug} />
    </div>
  );
}

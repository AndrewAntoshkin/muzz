import type { Metadata } from "next";
import { ProjectBoardRoute } from "@/components/ProjectBoard";
import { getProject } from "@/lib/productions";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Доска проекта · Кадр" };
  return { title: `${project.title} · доска — Кадр` };
}

export default async function ProjectBoardPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="app-main__body">
      <ProjectBoardRoute slug={slug} />
    </div>
  );
}

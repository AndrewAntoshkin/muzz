import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { getPerson } from "@/lib/people";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const person = await getPerson(slug);
    if (!person) return { title: "Профиль · Кадр" };
    return { title: `${person.name} · Кадр` };
  } catch {
    return { title: "Профиль · Кадр" };
  }
}

export default async function PersonPage({ params }: Props) {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) notFound();

  return (
    <div className="app-main__body">
      <main className="page-area">
        <ProfileView person={person} />
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { getSession } from "@/lib/auth";
import { getPerson } from "@/lib/people";
import { toPublicProfile } from "@/lib/person-public";

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
  const [person, viewer] = await Promise.all([getPerson(slug), getSession()]);
  if (!person) notFound();
  // legacy alias (e.g. /people/lebedeva -> kevorkova): one canonical URL per profile
  if (person.slug !== slug) permanentRedirect(`/people/${person.slug}`);

  // Only the public DTO crosses the server/client boundary (see lib/person-public.ts).
  return (
    <div className="app-main__body">
      <main className="page-area">
        <ProfileView person={toPublicProfile(person, viewer)} />
      </main>
    </div>
  );
}

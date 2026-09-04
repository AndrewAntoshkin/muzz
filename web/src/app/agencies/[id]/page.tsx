import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgencyView } from "@/components/AgencyView";
import { getAgencyPage } from "@/lib/agencies";
import { getPerson, listPeopleBySlugs, listRoster } from "@/lib/people";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agency = getAgencyPage(id);
  if (!agency) return { title: "Агентство · Кадр" };
  return { title: `«${agency.name}» · Кадр` };
}

export default async function AgencyPage({ params }: Props) {
  const { id } = await params;
  const agency = getAgencyPage(id);
  if (!agency) notFound();

  let roster: Awaited<ReturnType<typeof listRoster>> = [];
  let featured: Awaited<ReturnType<typeof listPeopleBySlugs>> = [];
  let agent: Awaited<ReturnType<typeof getPerson>> = null;
  try {
    [roster, featured, agent] = await Promise.all([
      listRoster(agency.id),
      listPeopleBySlugs(agency.featuredSlugs),
      getPerson(agency.agentSlug),
    ]);
  } catch {
    roster = [];
    featured = [];
    agent = null;
  }

  const featuredTalent = featured.filter((p) => p.profession === "actor" || p.profession === "actress");
  const fill = roster.filter((p) => !featuredTalent.some((f) => f.slug === p.slug));
  const faces = [...featuredTalent, ...fill].slice(0, 8);

  return (
    <div className="app-main__body">
      <main className="page-area">
        <AgencyView agency={agency} roster={roster} featured={faces} agent={agent} />
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgencyRosterView } from "@/components/AgencyRosterView";
import { AgencyView } from "@/components/AgencyView";
import { getAgencyPage } from "@/lib/agencies";
import { agencyDisplayName, getAgencyRow, isSourceAgency, websiteHost } from "@/lib/agencies-db";
import { getPerson, listPeopleBySlugs, listRoster, searchFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rich = getAgencyPage(id);
  if (rich) return { title: `«${rich.name}» · Кадр` };
  try {
    const row = await getAgencyRow(id);
    if (row) return { title: `${agencyDisplayName(row)} · Кадр` };
  } catch {
    /* fall through to the generic title */
  }
  return { title: "Агентство · Кадр" };
}

export default async function AgencyPage({ params }: Props) {
  const { id } = await params;
  const rich = getAgencyPage(id);
  if (rich) return <RichAgency agency={rich} />;

  // Every other id comes from the `agencies` table (a missing id -> 404).
  const row = await getAgencyRow(id);
  if (!row) notFound();

  const source = isSourceAgency(row.id);
  const title = agencyDisplayName(row);
  let initial: Awaited<ReturnType<typeof searchFaces>> = { items: [], total: 0 };
  try {
    initial = await searchFaces({ agencyId: row.id, professions: ["actor", "actress"], limit: 48 });
  } catch {
    /* render the page with an empty roster rather than failing */
  }

  return (
    <div className="app-main__body">
      <main className="page-area">
        <AgencyRosterView
          agencyId={row.id}
          title={title}
          kicker={source ? `Источник · ${title}` : "Актёрское агентство"}
          about={
            source
              ? `Профили импортированы из открытого каталога ${websiteHost(row.website) || title}. Это источник данных, а не агентство: контакты агента не указаны.`
              : "Профиль агентства собран из открытых данных его сайта. Расширенная страница с контактами и размещениями пока не заполнена."
          }
          website={row.website}
          websiteLabel={websiteHost(row.website)}
          isSource={source}
          initial={initial.items}
          total={initial.total}
        />
      </main>
    </div>
  );
}

/** Hand-written pages (AGENCY_PAGES): akter1, castingrus. */
async function RichAgency({ agency }: { agency: NonNullable<ReturnType<typeof getAgencyPage>> }) {
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
        <AgencyView
          agency={agency}
          roster={roster}
          featured={faces}
          agent={
            agent
              ? { slug: agent.slug, name: agent.name, imageUrl: agent.imageUrl, initials: agent.initials }
              : null
          }
        />
      </main>
    </div>
  );
}

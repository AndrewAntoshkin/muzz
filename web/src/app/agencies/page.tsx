import { AgencyList, type AgencyListRow } from "@/components/AgencyList";
import { agencyDisplayName, isSourceAgency, listAgencies, websiteHost } from "@/lib/agencies-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Агентства · Кадр",
};

export default async function AgenciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").slice(0, 80);
  let rows: AgencyListRow[] = [];
  try {
    rows = (await listAgencies(q)).map((a) => ({
      id: a.id,
      title: agencyDisplayName(a),
      host: websiteHost(a.website),
      people: a.people,
      source: isSourceAgency(a.id),
    }));
  } catch {
    rows = [];
  }

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <AgencyList rows={rows} q={q} />
      </main>
    </div>
  );
}

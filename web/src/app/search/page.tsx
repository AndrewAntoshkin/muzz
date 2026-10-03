import { SearchSwitch } from "@/components/ProductionSearch";
import { listRoster, searchFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Поиск · Кадр",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ profession?: string; mine?: string; agency?: string }>;
}) {
  const sp = await searchParams;
  const profession = sp.profession === "actress" ? "actress" : sp.profession || "";
  const mine = sp.mine === "1";
  const agency = sp.agency || "";

  let people: Awaited<ReturnType<typeof searchFaces>>["items"] = [];
  let peopleTotal = 0;
  try {
    if (mine || agency) {
      people = await listRoster(agency || "akter1");
      peopleTotal = people.length;
    } else {
      const found = await searchFaces({
        profession,
        professions: profession ? undefined : ["actor", "actress"],
        limit: 96,
      });
      people = found.items;
      peopleTotal = found.total;
    }
  } catch {
    people = [];
    peopleTotal = 0;
  }

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <SearchSwitch
          people={people}
          peopleTotal={peopleTotal}
          initialProfession={profession}
          mine={mine}
          agency={agency}
          remote={!(mine || agency)}
        />
      </main>
    </div>
  );
}

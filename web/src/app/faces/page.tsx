import { FacesCatalog } from "@/components/FacesCatalog";
import { searchFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "База · Кадр",
};

export default async function FacesPage({
  searchParams,
}: {
  searchParams: Promise<{ profession?: string }>;
}) {
  const sp = await searchParams;
  const profession = sp.profession === "actress" ? "actress" : sp.profession || "";
  let people: Awaited<ReturnType<typeof searchFaces>>["items"] = [];
  let peopleTotal = 0;
  try {
    const found = await searchFaces({ profession, limit: 96 });
    people = found.items;
    peopleTotal = found.total;
  } catch {
    people = [];
  }

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <FacesCatalog
          people={people}
          peopleTotal={peopleTotal}
          remote
          initialProfession={profession}
          title="База"
          lead="Актёры, агенты и кастинг-директора. Фильтры по профессии и городу."
          placeholder="Имя, профессия или город…"
          wide
          dense
        />
      </main>
    </div>
  );
}

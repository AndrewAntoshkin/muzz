import { FacesCatalog } from "@/components/FacesCatalog";
import { listFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "База · Кадр",
};

export default async function FacesPage({
  searchParams,
}: {
  searchParams: Promise<{ profession?: string }>;
}) {
  let people: Awaited<ReturnType<typeof listFaces>> = [];
  try {
    people = await listFaces();
  } catch {
    people = [];
  }
  const sp = await searchParams;
  const profession = sp.profession === "actress" ? "actress" : sp.profession || "";

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <FacesCatalog
          people={people}
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

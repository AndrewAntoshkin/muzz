import { SearchSwitch } from "@/components/ProductionSearch";
import { listFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Поиск · Кадр",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ profession?: string; mine?: string }>;
}) {
  let people: Awaited<ReturnType<typeof listFaces>> = [];
  try {
    people = await listFaces();
  } catch {
    people = [];
  }
  const sp = await searchParams;
  const profession = sp.profession === "actress" ? "actress" : sp.profession || "";
  const mine = sp.mine === "1";

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <SearchSwitch people={people} initialProfession={profession} mine={mine} />
      </main>
    </div>
  );
}

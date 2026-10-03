import { HomeHub } from "@/components/HomeHub";
import { countActors, listRoster, searchFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Кадр — главная",
};

export default async function HomePage() {
  let roster: Awaited<ReturnType<typeof listRoster>> = [];
  let preview: Awaited<ReturnType<typeof searchFaces>>["items"] = [];
  let actorCount = 0;
  try {
    [roster, preview, actorCount] = await Promise.all([
      listRoster(),
      searchFaces({ professions: ["actor", "actress"], limit: 16 }).then((r) => r.items),
      countActors(),
    ]);
  } catch {
    roster = [];
    preview = [];
    actorCount = 0;
  }

  return <HomeHub roster={roster} preview={preview} actorCount={actorCount} />;
}

import { HomeHub } from "@/components/HomeHub";
import { listFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Кадр — главная",
};

export default async function HomePage() {
  let faces: Awaited<ReturnType<typeof listFaces>> = [];
  try {
    faces = await listFaces();
  } catch {
    faces = [];
  }

  return <HomeHub faces={faces} />;
}

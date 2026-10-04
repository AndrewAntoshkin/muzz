import { NextResponse } from "next/server";
import { searchFaces } from "@/lib/people";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const profession = url.searchParams.get("profession") || "";
  const city = url.searchParams.get("city") || "";
  const agencyId = url.searchParams.get("agency") || "";
  const kind = url.searchParams.get("kind") || "actors";
  const limit = Number(url.searchParams.get("limit") || "96");
  const offset = Number(url.searchParams.get("offset") || "0");
  if (q.length > 80) {
    return NextResponse.json({ error: "Слишком длинный запрос", items: [], total: 0 }, { status: 400 });
  }
  const professions =
    profession || kind === "all" ? undefined : (["actor", "actress"] as string[]);

  try {
    const data = await searchFaces({
      q,
      profession,
      city,
      agencyId,
      professions,
      limit,
      offset,
    });
    return NextResponse.json(data, {
      // Каталог меняется редко: браузер и общий кэш не дёргают базу на каждый ввод.
      headers: { "Cache-Control": "private, max-age=20, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("people search failed", err);
    return NextResponse.json({ error: "Не удалось загрузить базу", items: [], total: 0 }, { status: 500 });
  }
}

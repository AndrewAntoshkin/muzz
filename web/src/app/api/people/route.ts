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
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "search failed";
    return NextResponse.json({ error: message, items: [], total: 0 }, { status: 500 });
  }
}

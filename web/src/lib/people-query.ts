import type { FaceCard } from "@/lib/people";

export type FaceQuery = {
  q?: string;
  profession?: string;
  city?: string;
  agency?: string;
  kind?: "actors" | "all";
  offset?: number;
  limit?: number;
};

export async function fetchFaces(query: FaceQuery): Promise<{ items: FaceCard[]; total: number }> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.profession) params.set("profession", query.profession);
  if (query.city) params.set("city", query.city);
  if (query.agency) params.set("agency", query.agency);
  if (query.kind) params.set("kind", query.kind);
  params.set("limit", String(query.limit ?? 96));
  params.set("offset", String(query.offset ?? 0));
  const res = await fetch(`/api/people?${params.toString()}`);
  if (!res.ok) throw new Error("Не удалось загрузить базу");
  return (await res.json()) as { items: FaceCard[]; total: number };
}

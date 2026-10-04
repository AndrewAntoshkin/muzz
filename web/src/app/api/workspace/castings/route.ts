import { createCasting } from "@/server/workspace/catalog";
import { readJson, respond } from "@/server/workspace/http";
import { requireViewer } from "@/server/workspace/viewer";

export async function POST(req: Request) {
  return respond(async () => createCasting(await requireViewer(req), await readJson(req)), { status: 201 });
}

import { readJson, respond } from "@/server/workspace/http";
import { setShortlist } from "@/server/workspace/personal";
import { requireViewer } from "@/server/workspace/viewer";

export async function PUT(req: Request) {
  return respond(async () => setShortlist(await requireViewer(req), await readJson(req)));
}

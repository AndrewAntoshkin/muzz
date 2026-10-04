import { readJson, respond } from "@/server/workspace/http";
import { setSaved } from "@/server/workspace/personal";
import { requireViewer } from "@/server/workspace/viewer";

export async function PUT(req: Request) {
  return respond(async () => setSaved(await requireViewer(req), await readJson(req)));
}

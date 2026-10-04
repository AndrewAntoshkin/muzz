import { readJson, respond } from "@/server/workspace/http";
import { publishPulse } from "@/server/workspace/personal";
import { requireViewer } from "@/server/workspace/viewer";

export async function PUT(req: Request) {
  return respond(async () => publishPulse(await requireViewer(req), await readJson(req)));
}

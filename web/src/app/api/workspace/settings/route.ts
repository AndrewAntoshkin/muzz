import { readJson, respond } from "@/server/workspace/http";
import { patchSettings } from "@/server/workspace/personal";
import { requireViewer } from "@/server/workspace/viewer";

export async function PATCH(req: Request) {
  return respond(async () => patchSettings(await requireViewer(req), await readJson(req)));
}

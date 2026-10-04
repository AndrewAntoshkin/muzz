import { setRoleLayout } from "@/server/workspace/board";
import { readJson, respond } from "@/server/workspace/http";
import { requireViewer } from "@/server/workspace/viewer";

export async function PUT(req: Request) {
  return respond(async () => setRoleLayout(await requireViewer(req), await readJson(req)));
}

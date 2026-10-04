import { setApplicationStatus, withdrawApplication } from "@/server/workspace/applications";
import { readJson, respond } from "@/server/workspace/http";
import { requireViewer } from "@/server/workspace/viewer";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return respond(async () => setApplicationStatus(await requireViewer(req), (await ctx.params).id, await readJson(req)));
}

export async function DELETE(req: Request, ctx: Ctx) {
  return respond(async () => withdrawApplication(await requireViewer(req), (await ctx.params).id));
}

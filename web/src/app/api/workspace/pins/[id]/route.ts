import { removePin, updatePin } from "@/server/workspace/board";
import { readJson, respond } from "@/server/workspace/http";
import { requireViewer } from "@/server/workspace/viewer";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return respond(async () => updatePin(await requireViewer(req), (await ctx.params).id, await readJson(req)));
}

export async function DELETE(req: Request, ctx: Ctx) {
  return respond(async () => removePin(await requireViewer(req), (await ctx.params).id));
}

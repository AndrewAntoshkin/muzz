import { archiveCasting, updateCasting } from "@/server/workspace/catalog";
import { readJson, respond } from "@/server/workspace/http";
import { requireViewer } from "@/server/workspace/viewer";

type Ctx = { params: Promise<{ slug: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return respond(async () => updateCasting(await requireViewer(req), decodeURIComponent((await ctx.params).slug), await readJson(req)));
}

export async function DELETE(req: Request, ctx: Ctx) {
  return respond(async () => archiveCasting(await requireViewer(req), decodeURIComponent((await ctx.params).slug)));
}

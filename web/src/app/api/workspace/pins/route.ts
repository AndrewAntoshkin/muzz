import { addPin, clearPins } from "@/server/workspace/board";
import { badRequest, readJson, respond } from "@/server/workspace/http";
import { requireViewer } from "@/server/workspace/viewer";

export async function POST(req: Request) {
  return respond(async () => addPin(await requireViewer(req), await readJson(req)), { status: 201 });
}

/** DELETE /api/workspace/pins?projectSlug=… — очистить доску проекта. */
export async function DELETE(req: Request) {
  return respond(async () => {
    const viewer = await requireViewer(req);
    const slug = new URL(req.url).searchParams.get("projectSlug");
    if (!slug) throw badRequest("Нужен projectSlug");
    return clearPins(viewer, slug);
  });
}

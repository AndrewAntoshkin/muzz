import { applyToCasting, inviteActor, proposeActor } from "@/server/workspace/applications";
import { badRequest, readJson, respond } from "@/server/workspace/http";
import { requireViewer } from "@/server/workspace/viewer";

/** POST { mode: "apply" | "propose" | "invite", ... } — три способа попасть в список откликов кастинга. */
export async function POST(req: Request) {
  return respond(async () => {
    const viewer = await requireViewer(req);
    const body = await readJson(req);
    switch (body.mode) {
      case "apply":
        return applyToCasting(viewer, body);
      case "propose":
        return proposeActor(viewer, body);
      case "invite":
        return inviteActor(viewer, body);
      default:
        throw badRequest("Неизвестный тип отклика");
    }
  });
}

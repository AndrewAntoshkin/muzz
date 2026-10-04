import { readJson, respond } from "@/server/workspace/http";
import { saveProfile } from "@/server/workspace/profile";
import { requireViewer } from "@/server/workspace/viewer";

/** PATCH /api/profile — правит только анкету самого пользователя (slug берётся из сессии, не из тела запроса). */
export async function PATCH(req: Request) {
  return respond(async () => saveProfile(await requireViewer(req), await readJson(req)));
}

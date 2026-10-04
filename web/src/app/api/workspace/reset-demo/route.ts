import { resetDemoWorkspace } from "@/server/demo-seed/seed";
import { respond } from "@/server/workspace/http";
import { requireAdmin } from "@/server/workspace/viewer";

/** Только админ: сбрасывает общий демо-контент к исходному. Данные реальных пользователей не затрагиваются. */
export async function POST(req: Request) {
  return respond(async () => {
    await requireAdmin(req);
    return resetDemoWorkspace();
  });
}

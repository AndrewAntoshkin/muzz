import { respond } from "@/server/workspace/http";
import { buildSnapshot } from "@/server/workspace/snapshot";
import { requireViewer } from "@/server/workspace/viewer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return respond(async () => buildSnapshot(await requireViewer(req)));
}

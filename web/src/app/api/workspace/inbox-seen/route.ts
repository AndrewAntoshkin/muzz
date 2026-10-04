import { respond } from "@/server/workspace/http";
import { markInboxSeen } from "@/server/workspace/personal";
import { requireViewer } from "@/server/workspace/viewer";

export async function POST(req: Request) {
  return respond(async () => markInboxSeen(await requireViewer(req)));
}

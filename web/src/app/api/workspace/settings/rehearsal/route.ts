import { respond } from "@/server/workspace/http";
import { consumeRehearsal } from "@/server/workspace/personal";
import { requireViewer } from "@/server/workspace/viewer";

export async function POST(req: Request) {
  return respond(async () => consumeRehearsal(await requireViewer(req)));
}

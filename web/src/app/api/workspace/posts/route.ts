import { readJson, respond } from "@/server/workspace/http";
import { createPost } from "@/server/workspace/personal";
import { requireViewer } from "@/server/workspace/viewer";

export async function POST(req: Request) {
  return respond(async () => createPost(await requireViewer(req), await readJson(req)), { status: 201 });
}

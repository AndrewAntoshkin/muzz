import { Suspense } from "react";
import { ComposeView } from "@/components/ComposeView";
import { listRoster } from "@/lib/people";
import { viewerAgencyId } from "@/lib/viewer-agency";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Опубликовать · Кадр",
};

export default async function ComposePage() {
  let roster: Awaited<ReturnType<typeof listRoster>> = [];
  try {
    const agencyId = await viewerAgencyId();
    roster = agencyId ? await listRoster(agencyId) : [];
  } catch {
    roster = [];
  }

  return (
    <div className="app-main__body">
      <main className="page-area">
        <Suspense>
          <ComposeView roster={roster} />
        </Suspense>
      </main>
    </div>
  );
}

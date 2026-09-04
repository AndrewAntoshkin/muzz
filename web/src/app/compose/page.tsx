import { Suspense } from "react";
import { ComposeView } from "@/components/ComposeView";
import { listRoster } from "@/lib/people";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Опубликовать · Кадр",
};

export default async function ComposePage() {
  let roster: Awaited<ReturnType<typeof listRoster>> = [];
  try {
    roster = await listRoster();
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

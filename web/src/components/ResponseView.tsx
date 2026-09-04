"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { withRole } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";
import { ResponseDetailPage } from "@/components/ResponseDetailPage";

export function ResponseView({ id }: { id: string }) {
  return (
    <Suspense>
      <ResponseViewInner id={id} />
    </Suspense>
  );
}

function ResponseViewInner({ id }: { id: string }) {
  const params = useSearchParams();
  const fromAll = params.get("from") === "all";
  const { role, ready, applications, getCasting, getProject, setAppStatus } = useWorkspace();
  const item = useMemo(() => applications.find((a) => a.id === id) ?? null, [applications, id]);
  const casting = item ? getCasting(item.castingSlug) : null;
  const project = casting ? getProject(casting.projectSlug) : null;

  const backHref =
    fromAll || !casting
      ? withRole("/responses", role)
      : withRole(`/castings/${casting.slug}/responses`, role);
  const backLabel =
    fromAll || !casting
      ? "← Все отклики"
      : `← Отклики · ${casting.title}`;

  if (!ready) {
    return (
      <div className="app-main__body app-main__body--catalog">
        <main className="page-area">
          <div className="page-scroll catalog-page">
            <p className="catalog-page__lead catalog-page__lead--solo">Загрузка…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="app-main__body app-main__body--catalog">
        <main className="page-area">
          <div className="page-scroll catalog-page" id="responses-catalog">
            <p className="catalog-page__lead catalog-page__lead--solo">Отклик не найден</p>
            <Link href={withRole("/responses", role)} className="catalog-page__back">
              ← Все отклики
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ResponseDetailPage
      item={item}
      role={role}
      casting={casting}
      project={project}
      onStatus={(status) => setAppStatus(item.id, status)}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}

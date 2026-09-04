"use client";

import Link from "next/link";
import { useMemo } from "react";
import { withRole } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";
import { ResponseDetailPage } from "@/components/ResponseDetailPage";

export function ResponseView({ id }: { id: string }) {
  const { role, ready, applications, getCasting, getProject, setAppStatus } = useWorkspace();
  const item = useMemo(() => applications.find((a) => a.id === id) ?? null, [applications, id]);
  const casting = item ? getCasting(item.castingSlug) : null;
  const project = casting ? getProject(casting.projectSlug) : null;
  const backHref = casting
    ? withRole(`/castings/${casting.slug}/responses`, role)
    : withRole("/responses", role);

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
          <div className="page-scroll catalog-page">
            <p className="catalog-page__lead catalog-page__lead--solo">Отклик не найден</p>
            <Link href={withRole("/responses", role)} className="hub-block__link">
              ← Ко всем откликам
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
    />
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { withRole } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";
import { ResponseCards } from "@/components/ResponsesBoard";

export default function ResponsesPage() {
  return (
    <Suspense>
      <ResponsesInner />
    </Suspense>
  );
}

function ResponsesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { role, myApplications, applications, getCasting, getProject, ready } = useWorkspace();
  const filterSlug = params.get("casting") || "";
  const openId = params.get("app") || "";

  useEffect(() => {
    if (!ready) return;
    if (openId) {
      router.replace(
        withRole(filterSlug ? `/responses/${openId}` : `/responses/${openId}?from=all`, role),
      );
      return;
    }
    if (filterSlug) {
      router.replace(withRole(`/castings/${filterSlug}/responses`, role));
    }
  }, [ready, openId, filterSlug, role, router]);

  const rows = useMemo(() => {
    const list = role === "casting" ? applications : myApplications;
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [role, applications, myApplications]);

  const pageLead =
    role === "casting"
      ? "Все входящие отклики и предложения агентов по вашим кастингам"
      : role === "agent"
        ? "Статус ваших предложений актёров на роли"
        : "Статус ваших откликов и приглашений";

  if (openId || filterSlug) {
    return (
      <div className="app-main__body app-main__body--catalog">
        <main className="page-area">
          <div className="page-scroll catalog-page">
            <p className="catalog-page__lead catalog-page__lead--solo">Открываю…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll catalog-page">
          <header className="catalog-page__head">
            <p className="catalog-page__lead catalog-page__lead--solo">{pageLead}</p>
          </header>

          {rows.length ? (
            <ResponseCards
              rows={rows}
              role={role}
              from="all"
              getCastingTitle={(s) => getCasting(s)?.title}
              getProjectTitle={(s) => {
                const c = getCasting(s);
                return c ? getProject(c.projectSlug)?.title : undefined;
              }}
            />
          ) : (
            <p className="catalog-empty">
              {role === "casting" ? (
                <>
                  Пока нет откликов. <Link href={withRole("/castings", role)}>Открыть кастинги →</Link>
                </>
              ) : role === "agent" ? (
                <>
                  Пока нет предложений. <Link href={withRole("/castings", role)}>Найти кастинг →</Link>
                </>
              ) : (
                <>
                  Пока нет откликов. <Link href={withRole("/castings", role)}>Смотреть кастинги →</Link>
                </>
              )}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

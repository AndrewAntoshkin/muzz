"use client";

import Link from "next/link";
import { CatalogSearchField } from "./CatalogFilterBar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { peopleCountLabel } from "@/lib/labels";
import { withRole } from "@/lib/roles";
import { useAuth } from "./AuthProvider";

export type AgencyListRow = {
  id: string;
  title: string;
  host: string;
  people: number;
  source: boolean;
};

/** /agencies: search runs on the server (?q=), the table has ~100 rows so no paging is needed. */
export function AgencyList({ rows, q }: { rows: AgencyListRow[]; q: string }) {
  const { role } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState(q);

  function submit(next: string) {
    const trimmed = next.trim();
    router.replace(trimmed ? `/agencies?q=${encodeURIComponent(trimmed)}` : "/agencies");
  }

  return (
    <div className="page-scroll catalog-page" id="agencies-list">
      <header className="catalog-page__head catalog-page__head--row">
        <p className="catalog-page__lead catalog-page__lead--solo">
          Агентства и источники данных. Откройте страницу, чтобы увидеть ростер.
        </p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <CatalogSearchField value={value} onChange={setValue} placeholder="Название или сайт…" ariaLabel="Поиск агентств" />
      </form>
      <div className="brief-list" style={{ marginTop: 16 }}>
        {rows.length ? (
          rows.map((row) => (
            <Link key={row.id} href={withRole(`/agencies/${encodeURIComponent(row.id)}`, role)} className="brief-row">
              <span>
                <span className="brief-row__title">{row.title}</span>
                <span className="brief-row__meta">
                  {row.source ? "Источник данных" : "Агентство"}
                  {row.host ? ` · ${row.host}` : ""}
                </span>
              </span>
              <span className="tag tag-blue">{row.people ? peopleCountLabel(row.people) : "ростер пуст"}</span>
            </Link>
          ))
        ) : (
          <p className="faces-empty">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}

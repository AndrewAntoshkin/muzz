"use client";

import { useState } from "react";
import type { KvPair } from "@/lib/person-card";

function KvValue({ value }: { value: string }) {
  if (/^https?:\/\//i.test(value)) {
    const compact = value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    return (
      <a href={value} target="_blank" rel="noreferrer" className="link-accent">
        {compact}
      </a>
    );
  }
  return <>{value}</>;
}

function KvList({ rows }: { rows: KvPair[] }) {
  return (
    <dl className="detail-kv">
      {rows.map((row) => (
        <span key={row.label} style={{ display: "contents" }}>
          <dt>{row.label}</dt>
          <dd>
            <KvValue value={row.value} />
          </dd>
        </span>
      ))}
    </dl>
  );
}

export function AnketaTabs({ cols }: { cols: { title: string; rows: KvPair[] }[] }) {
  const [active, setActive] = useState(cols[0]?.title ?? "");
  const current = cols.find((c) => c.title === active) ?? cols[0];
  if (!current) return null;

  return (
    <div className="kadr-anketa">
      <div className="search-tabs kadr-anketa__tabs" role="tablist" aria-label="Разделы анкеты">
        {cols.map((col) => (
          <button
            key={col.title}
            type="button"
            role="tab"
            aria-selected={col.title === current.title}
            className={col.title === current.title ? "search-tab is-on" : "search-tab"}
            onClick={() => setActive(col.title)}
          >
            {col.title}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="kadr-anketa__panel">
        <KvList rows={current.rows} />
      </div>
    </div>
  );
}

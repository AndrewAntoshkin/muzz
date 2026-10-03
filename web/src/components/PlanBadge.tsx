"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PLAN_META, openPlanModal, parsePlan, type PlanId } from "@/lib/plans";
import { DropdownMenu } from "./DropdownMenu";
import { useWorkspace } from "./useWorkspace";

const RENEW_AT = new Date("2026-10-04T00:00:00");

type PlanRow = { name: string; unit: string; left: string };

function coverage(plan: PlanId): { title: string; unit: string; total: string; rows: PlanRow[] }[] {
  if (plan === "standard") {
    return [
      {
        title: "Коммуникации",
        unit: "В месяц",
        total: "Осталось",
        rows: [
          { name: "Отклики", unit: "безлимит", left: "∞" },
          { name: "Сообщения агентам", unit: "5", left: "5" },
          { name: "Письма CD", unit: "0", left: "—" },
        ],
      },
      {
        title: "Анкета",
        unit: "Слотов",
        total: "Свободно",
        rows: [
          { name: "Фото", unit: "12", left: "8" },
          { name: "Шоурил", unit: "1", left: "1" },
        ],
      },
    ];
  }
  if (plan === "premium") {
    return [
      {
        title: "Коммуникации",
        unit: "В месяц",
        total: "Осталось",
        rows: [
          { name: "Отклики", unit: "безлимит", left: "∞" },
          { name: "Сообщения агентам", unit: "безлимит", left: "∞" },
          { name: "Письма CD", unit: "безлимит", left: "∞" },
        ],
      },
      {
        title: "Анкета",
        unit: "Слотов",
        total: "Свободно",
        rows: [
          { name: "Фото", unit: "80", left: "62" },
          { name: "Шоурил", unit: "10", left: "8" },
        ],
      },
    ];
  }
  return [
    {
      title: "Коммуникации",
      unit: "В месяц",
      total: "Осталось",
      rows: [
        { name: "Отклики", unit: "безлимит", left: "∞" },
        { name: "Сообщения агентам", unit: "20", left: "14" },
        { name: "Письма CD", unit: "10", left: "8" },
      ],
    },
    {
      title: "Анкета",
      unit: "Слотов",
      total: "Свободно",
      rows: [
        { name: "Фото", unit: "40", left: "22" },
        { name: "Шоурил", unit: "3", left: "2" },
      ],
    },
  ];
}

function daysLeft(until: Date) {
  return Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86_400_000));
}

function ruDays(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} день`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

export function PlanBadge() {
  const { settings } = useWorkspace();
  const plan = parsePlan(settings.plan);
  const meta = PLAN_META[plan];
  const blocks = coverage(plan);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const left = useMemo(() => daysLeft(RENEW_AT), []);

  return (
    <div className="ss-head__plan-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`ss-head__plan${open ? " is-open" : ""}`}
        aria-label={`Статус ${meta.badge}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        {meta.badge}
      </button>
      <DropdownMenu
        open={open}
        anchorRef={btnRef}
        onClose={close}
        align="right"
        className="ss-head__plan-pop"
        role="menu"
      >
        <div className="ss-head__plan-pop-head">
          <strong>Что покрывает {meta.name}</strong>
          <span>до 4 октября · ещё {ruDays(left)}</span>
        </div>
        {blocks.map((block) => (
          <div key={block.title} className="ss-head__plan-block">
            <div className="ss-head__plan-cols">
              <span>{block.title}</span>
              <span>{block.unit}</span>
              <span>{block.total}</span>
            </div>
            {block.rows.map((row) => (
              <div key={row.name} className="ss-head__plan-row">
                <span>{row.name}</span>
                <span>{row.unit}</span>
                <span>{row.left}</span>
              </div>
            ))}
          </div>
        ))}
        <p className="ss-head__plan-foot">Продлится автоматически 4 октября</p>
        <div className="ss-head__plan-all">
          <button
            type="button"
            className="btn-primary btn-block"
            onClick={() => {
              close();
              openPlanModal();
            }}
          >
            Все тарифы
          </button>
        </div>
      </DropdownMenu>
    </div>
  );
}

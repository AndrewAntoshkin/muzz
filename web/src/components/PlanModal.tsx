"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  PLAN_EVENT,
  PLAN_FAQS,
  PLAN_META,
  formatRub,
  parsePlan,
  planPrice,
  type PlanId,
  type PlanPeriod,
} from "@/lib/plans";
import { useWorkspace } from "./useWorkspace";
import { IconCheck } from "./icons";

const PLAN_ORDER: PlanId[] = ["standard", "pro", "premium"];

function ctaLabel(id: PlanId, current: PlanId) {
  if (id === current) return "Текущий план";
  if (id === "standard") return "Выбрать Стандарт";
  if (id === "pro") return "Оформить Про";
  return "Оформить Премиум";
}

export function PlanModal() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(PLAN_EVENT, onOpen);
    return () => window.removeEventListener(PLAN_EVENT, onOpen);
  }, []);

  if (!open) return null;
  return <PlanModalSheet onClose={close} />;
}

function PlanModalSheet({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = useWorkspace();
  const current = parsePlan(settings.plan);
  const [period, setPeriod] = useState<PlanPeriod>("month");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const titleId = useId();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function choose(id: PlanId) {
    if (id === current) return;
    setSettings({ plan: id });
    onClose();
  }

  return createPortal(
    <div className="plan-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="plan-modal__scrim" aria-label="Закрыть" onClick={onClose} />
      <div className="plan-modal__sheet" tabIndex={-1}>
        <button type="button" className="plan-modal__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <header className="plan-modal__head">
          <h2 id={titleId}>Выберите план</h2>
          <p>Репетиции, ассистент и статус профиля — когда будете готовы</p>
          <div className="plan-modal__period" role="radiogroup" aria-label="Период оплаты">
            <button
              type="button"
              role="radio"
              aria-checked={period === "month"}
              className={period === "month" ? "is-on" : undefined}
              onClick={() => setPeriod("month")}
            >
              Месяц
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={period === "year"}
              className={period === "year" ? "is-on" : undefined}
              onClick={() => setPeriod("year")}
            >
              Год
              <em>2 мес. в подарок</em>
            </button>
          </div>
        </header>
        <div className="plan-modal__grid">
          {PLAN_ORDER.map((id) => {
            const meta = PLAN_META[id];
            const isCurrent = id === current;
            const billed = planPrice(id, period);
            const paid = meta.priceMonth > 0;
            const yearFull = meta.priceMonth * 12;
            const save = meta.priceMonth * 2;
            const filled = !isCurrent && id !== "standard";
            return (
              <div key={id} className={`plan-modal__cell${meta.popular ? " is-popular" : ""}`}>
              <article
                className={`plan-modal__card${meta.popular ? " is-popular" : ""}`}
              >
                {meta.popular ? <span className="plan-modal__badge">Самый популярный</span> : null}
                <div className="plan-modal__card-inner">
                  <div className="plan-modal__name-row">
                    <h3 className="plan-modal__name">{meta.name}</h3>
                    {paid && period === "year" ? <span className="plan-modal__off">−2 мес.</span> : null}
                  </div>
                  <div className="plan-modal__price">
                    {paid ? (
                      <>
                        <strong>{formatRub(billed)}</strong>
                        <span>{period === "year" ? "/год" : "/мес"}</span>
                        {period === "year" ? <s>{formatRub(yearFull)}</s> : null}
                      </>
                    ) : (
                      <>
                        <strong>Бесплатно</strong>
                        <span>навсегда</span>
                      </>
                    )}
                  </div>
                  <p className="plan-modal__bill">
                    {paid
                      ? period === "year"
                        ? "Списывается раз в год"
                        : "Списывается каждый месяц"
                      : meta.tagline}
                  </p>
                  <button
                    type="button"
                    className={`plan-modal__cta${filled ? "" : " is-ghost"}`}
                    disabled={isCurrent}
                    onClick={() => choose(id)}
                  >
                    {ctaLabel(id, current)}
                  </button>
                  {paid && period === "year" ? (
                    <p className="plan-modal__save">Экономия {formatRub(save)} к помесячной</p>
                  ) : null}
                  <ul className="plan-modal__features">
                    {meta.features
                      .filter((feat) => feat.ok)
                      .map((feat) => (
                        <li key={feat.text}>
                          <span className="plan-modal__mark">
                            <IconCheck />
                          </span>
                          <span>{feat.text}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </article>
              </div>
            );
          })}
        </div>
        <div className="plan-modal__faq">
          <h3>Частые вопросы</h3>
          {PLAN_FAQS.map((item, i) => {
            const expanded = faqOpen === i;
            return (
              <div key={item.q} className={`plan-modal__faq-row${expanded ? " is-open" : ""}`}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setFaqOpen(expanded ? null : i)}
                >
                  <span>{item.q}</span>
                  <i aria-hidden className="plan-modal__chevron" />
                </button>
                {expanded ? <p>{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STATUS_LABEL } from "@/lib/workspace";
import { withRole, type RoleId } from "@/lib/roles";
import { useDemoRole } from "./useDemoRole";
import { useWorkspace } from "./useWorkspace";

/** Официальные материалы индустрии (скачаны с сайтов организаторов). */
const PROMOS = [
  {
    title: "48-й Московский международный кинофестиваль",
    image: "/assets/ads/mmkf-2026.jpg",
    meta: ["16–23 апреля", "Москва"],
    brand: "ММКФ",
    desc: "Один из старейших фестивалей мира. Президент — Никита Михалков. Аккредитация прессы и индустрии на fest.moscowfilmfestival.ru.",
    cta: "Программа и билеты",
    href: "https://fest.moscowfilmfestival.ru/",
  },
  {
    title: "«Лето как в кино» · Московская школа кино",
    image: "/assets/ads/mshk-leto.png",
    meta: ["интенсив", "moscowfilmschool.ru"],
    brand: "МШК",
    desc: "Летняя программа МШК: актёр, режиссура, продюсирование. День открытых дверей — на сайте школы.",
    cta: "Программа",
    href: "https://pro.moscowfilmschool.ru/letokakvkino2026",
  },
  {
    title: "Павильоны Мосфильма · хромакей и натура",
    image: "/assets/ads/mosfilm-p15.jpg",
    meta: ["17 павильонов", "300–2300 м²"],
    brand: "Киноконцерн «Мосфильм»",
    desc: "ЦПУ: павильоны, натура, ателье проб и актёрские комплексы. Бронь через order@mosfilm.ru.",
    cta: "Павильоны",
    href: "https://www.mosfilm.ru/services/pavilions-nature-grounds/stages/",
  },
  {
    title: "CineLab Rental · камеры и свет",
    image: "/assets/ads/cinelab-official.png",
    meta: ["Ленинградское ш., 65", "ARRI / RED"],
    brand: "СинеЛаб Рентал",
    desc: "Прокатная база полного цикла: Alexa Mini, RED Epic, свет ARRI и операторские тележки. +7 495 626-14-41.",
    cta: "Каталог проката",
    href: "https://www.cinelab.ru/ru/rental",
  },
  {
    title: "ВГИК · набор на высшие курсы кино и ТВ",
    image: "/assets/ads/vgik-campus.jpg",
    meta: ["Москва", "набор открыт"],
    brand: "ВГИК",
    desc: "Высшие курсы кино и телевидения Всероссийского государственного института кинематографии.",
    cta: "Поступить",
    href: "https://vgik.info/",
  },
] as const;

function ruFew(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} ${one}`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

function lastPreview(messages: { authorRole: string; text: string; time: string }[], role: RoleId) {
  const greet = /^(привет|здравствуйте|добрый день|ок|спасибо)[.!?…]*$/i;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const text = m.text.trim();
    if (text.length < 12 || greet.test(text)) continue;
    if (m.authorRole === role && i > 0) continue;
    return { text, time: m.time };
  }
  const last = messages[messages.length - 1];
  return last ? { text: last.text, time: last.time } : { text: "", time: "" };
}

type ActionItem = {
  kind: string;
  title: string;
  meta: string;
  href: string;
  urgent?: boolean;
};

type EventItem = [string, string, string, string, string];

function actorActions(ws: ReturnType<typeof useWorkspace>): ActionItem[] {
  const mine = ws.myApplications.slice(0, 3).map((a) => {
    const c = ws.getCasting(a.castingSlug);
    return {
      kind: a.status === "invited" ? "Приглашение" : a.status === "shortlist" ? "Шорт-лист" : "Самопроба",
      title: c?.title ?? a.actorName,
      meta: c ? `до ${c.deadline} · ${STATUS_LABEL[a.status]}` : STATUS_LABEL[a.status],
      href: c ? `/castings/${c.slug}` : "/responses",
      urgent: a.status === "invited" || Boolean(c?.urgent),
    };
  });
  if (mine.length) return mine;
  return ws.castings
    .filter((c) => c.urgent)
    .slice(0, 2)
    .map((c) => ({
      kind: "Дедлайн",
      title: c.title,
      meta: `до ${c.deadline} · ${c.cdName}`,
      href: `/castings/${c.slug}`,
      urgent: true,
    }));
}

function castingActions(ws: ReturnType<typeof useWorkspace>): ActionItem[] {
  const pending = ws.applications.filter((a) => a.status === "sent").slice(0, 3);
  return pending.map((a) => {
    const c = ws.getCasting(a.castingSlug);
    return {
      kind: a.source === "agent" ? "Агент" : "Самопроба",
      title: a.actorName,
      meta: c ? `${c.title} · ждать разбора` : "новый отклик",
      href: `/responses?casting=${a.castingSlug}`,
      urgent: a.source === "agent",
    };
  });
}

function agentActions(ws: ReturnType<typeof useWorkspace>): ActionItem[] {
  const sent = ws.myApplications.filter((a) => a.status === "sent").slice(0, 2);
  const fromApps: ActionItem[] = sent.map((a) => {
    const c = ws.getCasting(a.castingSlug);
    return {
      kind: "Ожидает CD",
      title: a.actorName,
      meta: c ? `предложен на «${c.title}»` : "предложение отправлено",
      href: "/responses",
    };
  });
  return [
    {
      kind: "Бриф",
      title: "Лебедева · главная + вторая",
      meta: "«Тихий январь» · 28–34 и мужская 30–40 · до 6 июня",
      href: "/compose?type=propose&casting=tihiy-yanvar-lead",
      urgent: true,
    },
    {
      kind: "Занятость",
      title: "Устюгов · июнь",
      meta: "Sreda Production просит подтвердить даты съёмок",
      href: "/messages",
    },
    ...fromApps.slice(0, 1),
  ].slice(0, 3);
}

const EVENTS: Record<RoleId, EventItem[]> = {
  actor: [
    ["16", "апр", "48-й ММКФ", "Показы и Q&A · Москва", "2026-04-16"],
    ["6", "июн", "Самопробы «Тихий январь»", "Дедлайн плёнки · Sreda", "2026-06-06"],
    ["1", "окт", "Высшие курсы ВГИК", "Набор на кино и ТВ", "2026-10-01"],
  ],
  casting: [
    ["16", "апр", "ММКФ · industry", "Аккредитация кастинг-директоров", "2026-04-16"],
    ["10", "июн", "Очные «Тихий январь»", "Студия Sreda · 10–14 июня", "2026-06-10"],
    ["20", "июн", "Союз кастинг-директоров", "Закрытая сессия · Москва", "2026-06-20"],
  ],
  agent: [
    ["6", "июн", "Окно самопроб для ростера", "«Тихий январь» · успеть подать", "2026-06-06"],
    ["14", "июн", "Очные пробы · Sreda", "Устюгов / Чадов в шорт-листе", "2026-06-14"],
    ["16", "апр", "ММКФ · кинорынок", "Встречи с платформами", "2026-04-16"],
  ],
};

function roleCopy(role: RoleId) {
  if (role === "casting") {
    return {
      actionsTitle: "Очередь разбора",
      actionsEmpty: "Новых откликов нет — очередь пуста.",
      eventsTitle: "Пробы и рынок",
    };
  }
  if (role === "agent") {
    return {
      actionsTitle: "Запросы и занятость",
      actionsEmpty: "Нет открытых запросов от кастинг-директоров.",
      eventsTitle: "Сроки ростера",
    };
  }
  return {
    actionsTitle: "Самопробы и дедлайны",
    actionsEmpty: "Нет активных самопроб — откройте кастинги.",
    eventsTitle: "Индустрия",
  };
}

export function RightRail() {
  const { role, cfg } = useDemoRole();
  const ws = useWorkspace();
  const { threads, unread } = ws;
  const [adIdx, setAdIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setAdIdx((i) => (i + 1) % PROMOS.length), 7000);
    return () => clearInterval(id);
  }, []);

  const promo = PROMOS[adIdx];
  const copy = roleCopy(role);
  const actions =
    role === "casting" ? castingActions(ws) : role === "agent" ? agentActions(ws) : actorActions(ws);
  const events = EVENTS[role];
  const previewThreads = threads.slice(0, 3);

  return (
    <aside id="app-right-rail" className="app-right-rail" aria-label={`Панель · ${cfg.label}`}>
      <section className="rail-panel rail-panel--ad" id="right-rail-ad">
        <a href={promo.href} target="_blank" rel="noopener noreferrer" className="rail-ad">
          <div className="rail-ad__img">
            <img src={promo.image} alt="" />
          </div>
          <div className="rail-ad__body">
            <div className="rail-ad__title">{promo.title}</div>
            <span className="rail-ad__cta">{promo.cta} →</span>
          </div>
        </a>
        <div className="rail-ad-dots" role="tablist" aria-label="Реклама индустрии">
          {PROMOS.map((item, i) => (
            <button
              key={item.href}
              type="button"
              className={i === adIdx ? "rail-ad-dot is-on" : "rail-ad-dot"}
              aria-label={item.brand}
              aria-selected={i === adIdx}
              onClick={() => setAdIdx(i)}
            />
          ))}
        </div>
      </section>

      <section className="rail-panel">
        <h3 className="rail-panel__title">{copy.actionsTitle}</h3>
        {actions.length ? (
          <div className="rail-now">
            {actions.map((n) => (
              <Link
                key={`${n.kind}-${n.title}`}
                href={withRole(n.href, role)}
                className={n.urgent ? "hub-task hub-task--urgent" : "hub-task"}
              >
                <span className="hub-task__label">{n.kind}</span>
                <strong>{n.title}</strong>
                <span className="hub-task__meta">{n.meta}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rail-empty">{copy.actionsEmpty}</p>
        )}
      </section>

      <section className="rail-panel">
        <h3 className="rail-panel__title">Сообщения</h3>
        <div className="rail-msgs">
          {previewThreads.map((t) => {
            const peer = t.views[role];
            if (!peer) return null;
            const preview = lastPreview(t.messages, role);
            const isUnread = t.unreadFor.includes(role);
            return (
              <Link
                key={t.id}
                href={withRole(`/messages?thread=${t.id}`, role)}
                className={isUnread ? "rail-msg is-unread" : "rail-msg"}
              >
                {peer.avatar ? (
                  <img src={peer.avatar} alt="" className="rail-msg__ava" width={44} height={44} />
                ) : (
                  <span className="rail-msg__ava rail-msg__ava--initials" style={{ background: peer.bg }}>
                    {peer.initials}
                  </span>
                )}
                <span className="rail-msg__body">
                  <span className="rail-msg__top">
                    <span className="rail-msg__name">{peer.name}</span>
                    <span className="rail-msg__time">{preview.time}</span>
                  </span>
                  <span className="rail-msg__text">{preview.text}</span>
                </span>
                {isUnread ? <span className="rail-msg__dot" aria-label="непрочитано" /> : null}
              </Link>
            );
          })}
        </div>
        <Link href={withRole("/messages", role)} className="rail-panel__more">
          {unread ? `${ruFew(unread, "непрочитанное", "непрочитанных", "непрочитанных")} · ` : ""}
          Все сообщения →
        </Link>
      </section>

      <section className="rail-panel">
        <h3 className="rail-panel__title">{copy.eventsTitle}</h3>
        <div className="rail-events">
          {events.map(([d, m, title, meta, iso]) => (
            <div key={iso} className="rail-event">
              <time className="rail-event__date" dateTime={iso}>
                {d}
                <span>{m}</span>
              </time>
              <div className="rail-event__body">
                <span className="rail-event__title">{title}</span>
                <span className="rail-event__meta">{meta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

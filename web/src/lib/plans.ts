export type PlanId = "standard" | "pro" | "premium";
export type PlanPeriod = "month" | "year";

export const PLAN_EVENT = "kadr:open-plans";

export function openPlanModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PLAN_EVENT));
}

export function parsePlan(raw: string | null | undefined): PlanId {
  if (raw === "standard" || raw === "pro" || raw === "premium") return raw;
  return "pro";
}

const MEDIA_SLUGS = new Set([
  "vzmetnev",
  "lerman-olga",
  "ustyugov-aleksandr",
  "shilovskaya-aglaya",
  "horinyak-viktor",
  "kutepova-polina",
]);

const STUDENT_SLUGS = new Set(["soykin", "soykin-ivan", "gneusheva"]);

function slugHash(slug: string) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function personIsMedia(slug: string) {
  return MEDIA_SLUGS.has(slug);
}

export function personIsStudent(slug: string, education?: string | string[] | null) {
  if (personIsMedia(slug)) return false;
  if (STUDENT_SLUGS.has(slug)) return true;
  const text = Array.isArray(education) ? education.join(" ") : education || "";
  if (/студент/i.test(text)) return true;
  return slugHash(slug) % 11 === 0;
}

export function personPlan(slug: string, profession?: string | null): PlanId {
  if (profession && profession !== "actor" && profession !== "actress") return "standard";
  if (personIsMedia(slug)) return "premium";
  const h = slugHash(slug) % 20;
  if (h === 0 || h === 7) return "premium";
  if (h % 4 === 1) return "pro";
  return "standard";
}

/** Own profile follows the workspace plan; everyone else stays on catalog vanity. */
export function visiblePlan(
  slug: string,
  profession: string | null | undefined,
  meSlug: string | undefined,
  myPlan: PlanId,
): PlanId {
  if (meSlug && slug === meSlug) return myPlan;
  return personPlan(slug, profession);
}

export const PLAN_META: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    badge: string;
    priceMonth: number;
    popular?: boolean;
    tagline: string;
    features: { ok: boolean; text: string }[];
  }
> = {
  standard: {
    id: "standard",
    name: "Стандарт",
    badge: "Free",
    priceMonth: 0,
    tagline: "Сервис, профиль и рабочий функционал",
    features: [
      { ok: true, text: "Доступ в Кадр и управление профилем" },
      { ok: true, text: "Отклики на кастинги и общая лента" },
      { ok: true, text: "Сообщения коллегам-артистам" },
      { ok: false, text: "Репетиции" },
      { ok: false, text: "Ассистент с утренней выборкой" },
      { ok: false, text: "Письма кинокомпаниям и CD без ограничений" },
    ],
  },
  pro: {
    id: "pro",
    name: "Про",
    badge: "Pro",
    priceMonth: 499,
    popular: true,
    tagline: "Репетиции и ассистент каждый день",
    features: [
      { ok: true, text: "Весь рабочий функционал Стандарта" },
      { ok: true, text: "Репетиции — до 10 записей проб в месяц" },
      { ok: true, text: "Ассистент: кастинги под ваш типаж утром" },
      { ok: true, text: "Письма кастинг-директорам" },
      { ok: false, text: "Безлимит Репетиций" },
      { ok: false, text: "Написать любой кинокомпании" },
    ],
  },
  premium: {
    id: "premium",
    name: "Премиум",
    badge: "Premium",
    priceMonth: 899,
    tagline: "Полный доступ и статус в выдаче",
    features: [
      { ok: true, text: "Весь функционал Про" },
      { ok: true, text: "Репетиции без ограничений" },
      { ok: true, text: "Ассистент каждый день" },
      { ok: true, text: "Написать любому, включая кинокомпании" },
      { ok: true, text: "Оформление профиля Премиум" },
      { ok: true, text: "Приоритет медийных в выдаче" },
    ],
  },
};

export const PLAN_FAQS: { q: string; a: string }[] = [
  {
    q: "Чем Про отличается от бесплатного Стандарта?",
    a: "На Стандарте вы ведёте профиль и откликаетесь как обычно. В Про открываются Репетиции (до 10 записей в месяц) и ассистент — утренняя выборка кастингов под ваши параметры, а не общая лента.",
  },
  {
    q: "Что такое ассистент? Это нейросеть?",
    a: "Нет. Это автоматическая ежедневная подборка: артисту — подходящие кастинги, кастинг-директору — новые лица и новости продакшенов. Упакован как помощник на площадке.",
  },
  {
    q: "Зачем Премиум, если Про уже даёт Репетиции?",
    a: "Безлимит записей, письма любым пользователям включая кинокомпании, и заметное оформление профиля. Часть людей берёт верхний тариф, чтобы выглядеть статуснее в выдаче.",
  },
  {
    q: "Подписка продлевается сама?",
    a: "Да, ежемесячно. Годовой тариф — цена десяти месяцев, два месяца в подарок. Отменить можно в любой момент до даты списания.",
  },
  {
    q: "Видят ли другие мой тариф?",
    a: "Да. У аватара — цветной ободок по уровню подписки, в профиле — значок. Студенты отдельно подписаны как студенты, профессионалы — как проф. актёры.",
  },
];

export function planPrice(id: PlanId, period: PlanPeriod) {
  const month = PLAN_META[id].priceMonth;
  if (period === "year") return month * 10;
  return month;
}

export function formatRub(n: number) {
  if (n <= 0) return "Бесплатно";
  return `${n.toLocaleString("ru-RU")} ₽`;
}

export function rehearsalCap(plan: PlanId) {
  if (plan === "standard") return 0;
  if (plan === "pro") return 10;
  return Number.POSITIVE_INFINITY;
}

export function canUseAssistant(plan: PlanId) {
  return plan === "pro" || plan === "premium";
}

export function canMessageCompany(plan: PlanId) {
  return plan === "premium";
}

export function canMessageCasting(plan: PlanId) {
  return plan === "pro" || plan === "premium";
}

export const PLAN_RING: Record<PlanId, string> = {
  standard: "#3a3a3a",
  pro: "#5b9dff",
  premium: "#c9a227",
};

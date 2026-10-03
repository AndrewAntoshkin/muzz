/**
 * Правая панель главной: партнёры, сообщения, ближайшие события.
 * Только фоновый контекст — всё, с чем работают, живёт в центральной колонке.
 * На остальных страницах панель не монтируется.
 * Сообщения и события зависят от роли (data-profession на body).
 */
(function () {
  const IMG = 'assets/figma/';
  const AD = 'assets/ads/';

  const ADS = [
    { title: 'СПбМКФ 2026 · Кино Экспо', image: AD + 'spbmkf.jpg', meta: ['21–24 сент', 'Экспофорум'], brand: 'Санкт-Петербургский международный Контент Форум', desc: 'Презентации Централ Партнершип, Каро, Вольга, НМГ. Аккредитация открыта.', cta: 'Аккредитация', url: 'https://www.kinoexpo.ru/registration' },
    { title: '«Маяк 2026» · Геленджик', image: AD + 'mayak.jpg', meta: ['3–8 окт', 'Кинопрайм'], brand: 'Фестиваль актуального российского кино', desc: 'Открытие — «Шум времени» Алексея Учителя. Конкурс полного и короткого метра.', cta: 'Программа', url: 'https://mayakfestival.ru/' },
    { title: 'Операторское искусство', image: AD + 'mshk.jpg', meta: ['октябрь', '5 семестров'], brand: 'Московская школа кино', desc: 'Куратор Илья Демин, президент Гильдии кинооператоров. Набор открыт, 4-й поток до 9 сентября.', cta: 'Подать заявку', url: 'https://moscowfilmschool.ru/courses/cinematography/' },
    { title: 'ARRI Alexa Mini · аренда', image: AD + 'cinelab-office.png', meta: ['камеры', 'свет, телеги'], brand: 'CineLab Rental', desc: 'Alexa Mini, RED Epic Dragon, Cooke S4/S5, HMI ARRI. Одна из крупнейших прокатных баз в России.', cta: 'Каталог', url: 'https://www.cinelab.ru/ru/rental' },
    { title: 'Dolby Atmos Premier · студия №7', image: AD + 'mosfilm.jpg', meta: ['Atmos', 'DCP 4K'], brand: 'Тонстудия «Мосфильм»', desc: 'Сертифицированный зал 165 м²: Atmos, 7.1, 5.1. Avid S6, NEXIS. Просмотры до 40 человек.', cta: 'Забронировать', url: 'https://ton.mosfilm.ru/rewrite/studio-7/' },
  ];

  const BY_PROFESSION = {
    director: {
      label: 'Режиссёр',
      events: [
        ['14', 'июн', 'Питчинг сериалов · ИРИ', 'Москва · ваш слот 16:00', '2026-06-14', false],
        ['22', 'июн', 'Премьера «После шторма»', 'Trace Films · закрытый показ для Okko', '2026-06-22', false],
        ['1', 'окт', 'Фестиваль «Маяк»', 'Геленджик · конкурс полного метра', '2026-10-01', true],
      ],
      messages: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', text: 'Монтаж третьей серии готов — посмотри до среды.', time: '12:40', unread: true },
        { img: IMG + 'avatar-04.png', name: 'Дмитрий Карпов', text: 'Свет на натуре: предлагаю сдвинуть смену на час.', time: 'вчера' },
        { initials: 'АК', bg: '#5C4A45', name: 'Анна Кеворкова', text: 'Самопробы', time: '1 ч', unread: true },
      ],
    },

    actor: {
      label: 'Актёр',
      events: [
        ['10', 'июн', 'Мастер-класс: самопроба для платформ', 'Онлайн · кастинг-директора Кинопоиска', '2026-06-10', false],
        ['18', 'июн', 'Премия «Золотой орёл» · номинации', 'Москва', '2026-06-18', false],
        ['1', 'окт', 'Фестиваль «Маяк»', 'Геленджик · открытие сезона', '2026-10-01', true],
      ],
      messages: [
        { img: 'assets/people/kevorkova.jpg', name: 'Анна Кеворкова', text: 'Самопробы', time: '1 ч', unread: true },
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', text: 'Прислали правки по договору, посмотри пункт 4.', time: 'вчера' },
        { initials: 'СО', bg: '#3D5C4A', name: 'Студия Окно', text: 'Приглашаем на очные пробы 14 июня, Москва.', time: '2 дня' },
      ],
    },

    gaffer: {
      label: 'Гафер',
      events: [
        ['5', 'июн', 'Воркшоп: LED для павильона', 'Cinelab Rentals · Москва', '2026-06-05', false],
        ['12', 'июн', 'Разбор схем: ночная натура', 'Онлайн · 2 ч', '2026-06-12', false],
        ['1', 'окт', 'Маяк · мастерская G&E', 'Геленджик · закрытое', '2026-10-01', true],
      ],
      messages: [
        { img: IMG + 'avatar-04.png', name: 'Sreda Production', text: 'Нужен гафер на 12 смен, Мурманск. Свободны?', time: '1 ч', unread: true },
        { initials: 'ДК', bg: '#4A3D5C', name: 'Дмитрий Карпов', text: 'Скинул схему света по четвёртой сцене.', time: 'вчера' },
        { initials: 'CL', bg: '#2c2c2b', name: 'Cinelab Rentals', text: 'Комплект забронирован на 10–14 июня.', time: '2 дня' },
      ],
    },

    costume: {
      label: 'Костюмер',
      events: [
        ['8', 'июн', 'Ярмарка тканей для кино', 'Москва · CEK', '2026-06-08', false],
        ['15', 'июн', 'Разбор: костюм vs характер', 'Онлайн · кастинг-директора Кинопоиска', '2026-06-15', false],
        ['1', 'июл', 'Старт сериала «Окно»', 'Казань · KION · 4 недели', '2026-07-01', true],
      ],
      messages: [
        { img: 'assets/people/kevorkova.jpg', name: 'Анна Кеворкова', text: 'Примерки в четверг, 11:00.', time: '3 ч', unread: true },
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', text: 'Бюджет по костюмам согласован полностью.', time: 'вчера' },
        { initials: 'YBW', bg: '#5C4A45', name: 'Yellow Black White', text: 'Ищем ассистента на сериал, восемь эпизодов.', time: '2 дня' },
      ],
    },

    producer: {
      label: 'Продюсер',
      events: [
        ['14', 'июн', 'Питчинг сериалов · ИРИ', 'Москва · слот 16:00', '2026-06-14', false],
        ['20', 'июн', 'Контентный рынок · Okko', 'Москва · закрытое', '2026-06-20', false],
        ['1', 'окт', 'Фестиваль «Маяк» · индустрия', 'Геленджик · кинорынок', '2026-10-01', true],
      ],
      messages: [
        { img: 'assets/actors/vzmetnev-avatar.jpg', name: 'Александр Взметнев', text: 'Готов подтвердить даты 10–14 июня.', time: '40 мин', unread: true },
        { img: IMG + 'avatar-04.png', name: 'Дмитрий Карпов', text: 'Прислал техкарту и смету по оптике.', time: 'вчера' },
        { initials: 'МК', bg: '#5C4A45', name: 'Мария Коваль', text: 'Спасибо за пробы — жду решения по роли.', time: '2 дня' },
      ],
    },

    dop: {
      label: 'Оператор-постановщик',
      events: [
        ['5', 'июн', 'ARRI Alexa 35 · демо новой прошивки', 'Cinelab · Москва', '2026-06-05', false],
        ['12', 'июн', 'Воркшоп: ночная натура', 'Онлайн · 2 ч', '2026-06-12', false],
        ['1', 'окт', 'Фестиваль «Маяк»', 'Геленджик · конкурс DOP', '2026-10-01', true],
      ],
      messages: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', text: 'Смета по оптике прошла, работаем.', time: '1 ч', unread: true },
        { initials: 'АБ', bg: '#4A3D5C', name: 'Анна Белова', text: 'Референсы по свету собрала в папке.', time: 'вчера' },
        { initials: 'СО', bg: '#3D5C4A', name: 'Студия Окно', text: 'Док для KION — нужен DOP на шесть смен.', time: '2 дня' },
      ],
    },

    screenwriter: {
      label: 'Сценарист',
      events: [
        ['10', 'июн', 'Мастер-класс: структура сериала для платформ', 'Высшая школа сценаристов · онлайн', '2026-06-10', false],
        ['14', 'июн', 'Питчинг ИРИ · сериалы', 'Москва · слоты сценаристов', '2026-06-14', false],
        ['30', 'июн', 'Дедлайн: Фонд кино + Минкульт', 'Заявка на разработку', '2026-06-30', true],
      ],
      messages: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', text: 'Правки по второму акту прислала в документе.', time: '2 ч', unread: true },
        { img: IMG + 'avatar-04.png', name: 'Sreda Production', text: 'Заявка прошла на второй этап отбора.', time: 'вчера' },
        { initials: 'YBW', bg: '#5C4A45', name: 'Yellow Black White', text: 'Нужен соавтор на восемь эпизодов.', time: '2 дня' },
      ],
    },

    editor: {
      label: 'Монтажёр',
      events: [
        ['10', 'июн', 'DaVinci Resolve · с нуля до Pro', 'Московская школа кино · старт', '2026-06-10', false],
        ['15', 'июн', 'Премонт «После шторма»', 'Trace Films · превью для Okko', '2026-06-15', false],
        ['1', 'окт', 'Фестиваль «Маяк» · монтажёрский клуб', 'Геленджик', '2026-10-01', true],
      ],
      messages: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', text: 'Успеем финальный экспорт до пятницы?', time: '1 ч', unread: true },
        { initials: 'АБ', bg: '#4A3D5C', name: 'Анна Белова', text: 'Смотрю черновую сборку, есть вопросы по ритму.', time: 'вчера' },
        { initials: 'АС', bg: '#5C5340', name: 'Артём Сухов', text: 'Разбор монтажа в четверг, подключайся.', time: '2 дня' },
      ],
    },

    sound: {
      label: 'Звукорежиссёр',
      events: [
        ['7', 'июн', 'Dolby Atmos для кино · мастер-класс', 'Mosfilm Sound · Москва', '2026-06-07', false],
        ['14', 'июн', 'Запись «Тихий январь»', 'Мурманск · экспедиция 18 дней', '2026-06-14', false],
        ['20', 'июн', 'Микс-сессия «После шторма»', 'Mosfilm Sound · превью для Okko', '2026-06-20', true],
      ],
      messages: [
        { initials: 'MS', bg: '#2c2c2b', name: 'Mosfilm Sound', text: 'Смена Atmos свободна 18-го, держим за вами.', time: '3 ч', unread: true },
        { img: IMG + 'avatar-04.png', name: 'Sreda Production', text: 'Нужен звук на площадке, 12 смен.', time: 'вчера' },
        { initials: 'СО', bg: '#3D5C4A', name: 'Студия Окно', text: 'Шесть серий, перезапись в июле.', time: '2 дня' },
      ],
    },

    casting: {
      label: 'Кастинг-директор',
      events: [
        ['10', 'июн', 'Мастер-класс: самопроба для платформ', 'Онлайн · CD Кинопоиска · 90 мин', '2026-06-10', false],
        ['14', 'июн', 'Очные пробы «Тихий январь»', 'Москва · студия Sreda', '2026-06-14', false],
        ['20', 'июн', 'Союз кастинг-директоров · ежегодная встреча', 'Москва · закрытое', '2026-06-20', true],
      ],
      messages: [
        { img: 'assets/actors/vzmetnev-avatar.jpg', name: 'Александр Взметнев', text: 'Самопробы', time: '1 ч', unread: true },
      ],
    },
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readUser() {
    const b = document.body;
    const profession = b.getAttribute('data-profession') || 'actor';
    return { profession };
  }


  function panelEvents(cfg) {
    const items = cfg.events
      .map(([d, m, title, meta, iso, muted]) => {
        const cls = muted ? ' rail-event__date--muted' : '';
        return `<a href="#" class="rail-event">
          <time class="rail-event__date${cls}" datetime="${iso}">${d}<span>${m}</span></time>
          <div class="rail-event__body">
            <span class="rail-event__title">${esc(title)}</span>
            <span class="rail-event__meta">${esc(meta)}</span>
          </div>
        </a>`;
      })
      .join('');
    return `<section class="rail-panel">
      <h3 class="rail-panel__title">Ближайшие события</h3>
      <div class="rail-events">${items}</div>
    </section>`;
  }


  function roleCfg() {
    const id = document.body.getAttribute("data-profession") || "actor";
    const fromRoles = window.KadrRoles && window.KadrRoles.ROLES[id];
    if (fromRoles) return fromRoles;
    return BY_PROFESSION[id] || BY_PROFESSION.actor;
  }

  function panelNow(cfg) {
    const items = (cfg.now || []).map((n) => {
      const urgent = n.urgent ? " hub-task--urgent" : "";
      return `<a href="messages.html" class="hub-task${urgent}">
          <span class="hub-task__label">${esc(n.kind)}</span>
          <strong>${esc(n.title)}</strong>
          <span class="hub-task__meta">${esc(n.meta)}</span>
        </a>`;
    }).join("");
    return `<section class="rail-panel rail-panel--now">
      <h3 class="rail-panel__title">Сейчас</h3>
      <div class="hub-welcome__tasks rail-now">${items}</div>
    </section>`;
  }

  function panelAdSlot() {
    return '<section id="right-rail-ad" class="rail-panel rail-panel--ad widget"></section>';
  }

  function panelMessages(cfg) {
    const items = (cfg.messages || [])
      .map((m) => {
        const ava = m.img
          ? `<img src="${m.img}" alt="" class="rail-msg__ava" width="44" height="44" loading="lazy" />`
          : `<span class="rail-msg__ava rail-msg__ava--initials" style="background:${m.bg}">${esc(m.initials)}</span>`;
        const dot = m.unread ? '<span class="rail-msg__dot" aria-label="непрочитано"></span>' : '';
        return `<a href="messages.html" class="rail-msg${m.unread ? ' is-unread' : ''}">
          ${ava}
          <span class="rail-msg__body">
            <span class="rail-msg__top">
              <span class="rail-msg__name">${esc(m.name)}</span>
              <span class="rail-msg__time">${esc(m.time)}</span>
            </span>
            <span class="rail-msg__text">${esc(m.text)}</span>
          </span>
          ${dot}
        </a>`;
      })
      .join('');
    return `<section class="rail-panel rail-panel--flush">
      <h3 class="rail-panel__title">Сообщения</h3>
      <div class="rail-msgs">${items}</div>
      <a href="messages.html" class="hub-block__link rail-panel__footer-link">Все сообщения →</a>
    </section>`;
  }

  function mountAdRotator() {
    const root = document.getElementById('right-rail-ad');
    if (!root) return;
    let idx = 0;
    function paint() {
      const ad = ADS[idx % ADS.length];
      root.innerHTML = `
        <a href="${ad.url || '#'}" class="rail-ad" ${ad.url ? 'target="_blank" rel="noopener noreferrer"' : ''}>
          <div class="rail-ad__img"><img src="${ad.image}" alt="" class="ad-banner-img" loading="lazy" /></div>
          <div class="rail-ad__body">
            <div class="rail-ad__tags">${ad.meta.map((m) => `<span class="tag tag-gray">${esc(m)}</span>`).join('')}</div>
            <div class="rail-ad__title">${esc(ad.title)}</div>
            <p class="rail-ad__desc">${esc(ad.brand)} — ${esc(ad.desc)}</p>
            <span class="link-accent rail-ad__cta">${esc(ad.cta)} →</span>
          </div>
        </a>
        <div class="rail-ad-dots">${ADS.map((_, i) => `<span class="rail-ad-dot${i === idx ? ' is-on' : ''}"></span>`).join('')}</div>`;
    }
    paint();
    setInterval(() => {
      idx = (idx + 1) % ADS.length;
      const img = root.querySelector('.ad-banner-img');
      if (img) {
        img.style.opacity = '0';
        setTimeout(paint, 300);
      } else paint();
    }, 5500);
  }

  function mount() {
    const root = document.getElementById('app-right-rail');
    if (!root) return;

    // Ambient rail is home-only; other pages keep the full centre column.
    if (document.body.getAttribute('data-page') !== 'home') {
      root.remove();
      return;
    }

    const cfg = roleCfg();
    const label = cfg.label || (BY_PROFESSION[readUser().profession] || BY_PROFESSION.actor).label;

    root.setAttribute('aria-label', `Панель · ${label}`);

    root.innerHTML = [
      panelAdSlot(),
      panelNow(cfg),
      panelMessages(cfg),
      panelEvents(cfg),
    ].join('');

    mountAdRotator();
  }

  document.addEventListener('DOMContentLoaded', mount);
  window.KadrRail = { mount, BY_PROFESSION, readUser };
})();

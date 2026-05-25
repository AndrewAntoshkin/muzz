/** Главная — кастинги и проекты (раздельные блоки, без рекламы в ленте) */
(function () {
  const IMG = 'assets/figma/';

  const CASTINGS = [
    {
      href: 'casting.html',
      studioHref: 'studio.html',
      avatar: IMG + 'avatar-04.png',
      name: 'Sreda Production',
      meta: 'Полный метр · Кинопоиск · Москва, Мурманск',
      deadline: '6 июня',
      title: 'Актриса на главную роль — «Тихий январь»',
      text: 'Драма о жизни в северном городе. Героиня — учительница, 28–34 года. Очные кастинги 10–14 июня. Прокат на Кинопоиске и в кинотеатрах.',
      facts: [
        ['Роль', 'Главная женская'],
        ['Возраст', '28–34'],
        ['Гонорар', '2.4–3.2 ₽ млн за проект'],
        ['Платформа', 'Кинопоиск'],
      ],
      responses: 142,
      urgent: true,
      media: IMG + 'post-01.png',
    },
    {
      href: 'casting.html?id=okno-dop',
      studioHref: 'studio.html?id=okno',
      avatar: IMG + 'avatar-04.png',
      name: 'Студия Окно',
      meta: 'Документальный сериал · KION',
      deadline: '12 июня',
      title: 'Оператор-постановщик · док-сериал «Окно»',
      text: '6 серий по 45 мин, Москва и Казань. Handheld, доступный свет. Заказчик — KION. Финансирование ИРИ.',
      facts: [
        ['Роль', 'DOP'],
        ['Опыт', 'от 5 лет в доке'],
        ['Гонорар', '850 ₽ тыс / серия'],
        ['Платформа', 'KION'],
      ],
      responses: 38,
      media: IMG + 'post-06.png',
    },
    {
      href: 'casting.html?id=komnata14',
      studioHref: 'profile-casting.html',
      avatar: IMG + 'avatar-02.png',
      name: 'Анна Лебедева',
      meta: 'Короткий метр · фестивальное · Москва',
      deadline: '30 мая',
      title: 'Гримёр-постижёр · «Комната 14»',
      text: 'Павильон и натура, 1950-е. Подача на «Святую Анну» и «Окно в Европу». Период-декор, парики, спецгрим.',
      facts: [
        ['Смены', '8'],
        ['Гонорар', '22 000 ₽ / смена'],
        ['Тип', 'самозанятость ок'],
      ],
      responses: 19,
      media: IMG + 'post-04.png',
    },
    {
      href: 'casting.html?id=trace-comp',
      studioHref: 'studio.html?id=trace',
      avatar: IMG + 'avatar-04.png',
      name: 'Trace Films',
      meta: 'Реклама · 2 смены · Москва',
      deadline: '4 июня',
      title: 'Композитор · рекламный ролик премиум-бренда',
      text: '30 сек, премиальный бренд. Размещение Кинопоиск, VK Видео, ТВ. Быстрые итерации с монтажом Артёма Сухова.',
      facts: [
        ['Формат', 'Реклама'],
        ['Длительность', '30 сек + 15 сек cut'],
        ['Гонорар', '180 000 ₽ + права'],
      ],
      responses: 24,
      media: IMG + 'post-02.png',
    },
    {
      href: 'casting.html?id=ybw-screenwriter',
      studioHref: '#',
      avatar: IMG + 'avatar-03.png',
      name: 'Yellow Black White',
      meta: 'Сериал · START · в комнату',
      deadline: '8 июня',
      title: 'Сценарист в комнату · «Берег 2»',
      text: 'Авторский сериал для START. 8 эпизодов по 50 мин, социальная драма. Шоураннер: Иван Морозов. Срок разработки — 4 месяца.',
      facts: [
        ['Формат', 'Сериал · 8 эп.'],
        ['Опыт', 'от 2 написанных сезонов'],
        ['Гонорар', '380–520 ₽ тыс / эп.'],
        ['Платформа', 'START'],
      ],
      responses: 47,
      urgent: true,
      media: IMG + 'post-07.png',
    },
    {
      href: 'casting.html?id=kion-costume',
      studioHref: 'studio.html?id=okno',
      avatar: IMG + 'avatar-02.png',
      name: 'Студия Окно',
      meta: 'Сериал · KION · Москва, Казань',
      deadline: '15 июня',
      title: 'Художник по костюму · «Дайте Иванова 3»',
      text: 'Комедийный сериал, 3-й сезон. 20 эпизодов, современный быт + ретро-флешбэки 90-х. Старт препрода 1 июля, съёмки с 1 августа.',
      facts: [
        ['Серий', '20'],
        ['Эпохи', 'современность + 90-е'],
        ['Гонорар', '220 ₽ тыс / эп.'],
        ['Платформа', 'KION'],
      ],
      responses: 31,
      media: IMG + 'post-03.png',
    },
    {
      href: 'casting.html?id=staya2-main',
      studioHref: 'studio.html',
      avatar: IMG + 'avatar-04.png',
      name: 'Sreda Production',
      meta: 'Сериал · Okko · Москва',
      deadline: '20 июня',
      title: 'Главная мужская — «Стая 2»',
      text: 'Криминальная драма, 2-й сезон. Главный герой — следователь 38–46 лет. Кастинг ведёт Анна Лебедева. Бюджет 480 млн ₽.',
      facts: [
        ['Возраст', '38–46'],
        ['Типаж', 'славянский, седина ок'],
        ['Гонорар', '850 ₽ тыс / серия'],
        ['Платформа', 'Okko'],
      ],
      responses: 89,
      media: IMG + 'post-05.png',
    },
    {
      href: 'casting.html?id=docu-host',
      studioHref: 'studio.html?id=okno',
      avatar: IMG + 'avatar-02.png',
      name: 'Студия Окно',
      meta: 'Док-сериал · KION · 8 серий',
      deadline: '12 июня',
      title: 'Ведущий-эксперт · док-сериал об архитектуре',
      text: 'Архитектор или искусствовед с экранным опытом. 8 серий, экспедиции по 15 городам России. Съёмки сент–ноя.',
      facts: [
        ['Серий', '8'],
        ['Опыт', 'от 1 ТВ-проекта'],
        ['Гонорар', '320 ₽ тыс / серия'],
        ['Платформа', 'KION'],
      ],
      responses: 22,
      media: IMG + 'post-08.png',
    },
    {
      href: 'casting.html?id=trace-colorist',
      studioHref: 'studio.html?id=trace',
      avatar: IMG + 'avatar-01.png',
      name: 'Trace Films',
      meta: 'Полный метр · Okko · постпрод',
      deadline: '10 июня',
      title: 'Колорист · «После шторма»',
      text: 'DaVinci Resolve Studio. 4 недели работы, DCP для проката + UHD HDR для Okko. Референсы — Edward Lachman, Roger Deakins.',
      facts: [
        ['Софт', 'DaVinci Studio'],
        ['Срок', '4 недели от 1 июля'],
        ['Гонорар', '1.2 ₽ млн'],
        ['Удалёнка', 'ок'],
      ],
      responses: 18,
      media: IMG + 'hero-01.png',
    },
  ];

  const PROJECTS = [
    {
      href: 'project.html',
      studioHref: 'studio.html?id=trace',
      profileHref: 'profile-producer.html',
      avatar: IMG + 'avatar-01.png',
      name: 'Ксения Воронина',
      org: 'Trace Films',
      meta: 'Полный метр · Okko · постпродакшн',
      hero: IMG + 'hero-01.png',
      title: '«После шторма»',
      text: '47 смен на побережье. Заказчик — Okko, копрод с Трикстер. Ищем колориста и фестивальный PR (Маяк, ММКФ, Венеция).',
      status: 'В производстве',
      roles: ['Колорист', 'Композитор', 'PR', 'VFX'],
    },
    {
      href: 'project.html?id=tikhiy',
      studioHref: 'studio.html',
      profileHref: 'studio.html',
      avatar: IMG + 'avatar-04.png',
      name: 'Sreda Production',
      org: 'Sreda',
      meta: 'Полный метр · Кинопоиск · препродакшн',
      hero: IMG + 'post-01.png',
      title: '«Тихий январь»',
      text: 'Северная драма. Заказчик — Кинопоиск Студия, прокат в кинотеатрах. Бюджет 145 млн (Фонд кино + Кинопоиск). Команда: художник-постановщик, звукорежиссёр, AD.',
      status: 'Кастинг открыт',
      roles: ['Художник', 'Звук', 'AD', 'Локейшн'],
    },
    {
      href: 'project.html?id=staya2',
      studioHref: 'studio.html',
      profileHref: 'studio.html',
      avatar: IMG + 'avatar-04.png',
      name: 'Sreda Production',
      org: 'Sreda',
      meta: 'Сериал · Okko · препрод',
      hero: IMG + 'post-05.png',
      title: '«Стая 2»',
      text: 'Криминальная драма, 2-й сезон. 10 эпизодов по 50 мин. Заказчик — Okko Studios. Бюджет 480 ₽ млн (ИРИ 200 + Okko 220 + Sreda 60). Кастинг открыт.',
      status: 'Препрод · кастинг',
      roles: ['Гл. роль (м)', 'DOP', 'Художник', 'Звук'],
    },
    {
      href: 'project.html?id=okno-doc',
      studioHref: 'studio.html?id=okno',
      profileHref: 'studio.html?id=okno',
      avatar: IMG + 'avatar-02.png',
      name: 'Студия Окно',
      org: 'Окно',
      meta: 'Док-сериал · KION · 6 серий',
      hero: IMG + 'post-06.png',
      title: '«Окно» · док-сериал об архитектуре',
      text: 'Авторский док-сериал, 6 серий по 45 мин. Заказчик — KION, грант ИРИ. Экспедиции в Москву, Казань, Екатеринбург, Калининград. Старт съёмок 1 августа.',
      status: 'Препрод',
      roles: ['DOP', 'Ведущий', 'Звук', 'Композитор'],
    },
    {
      href: 'project.html?id=bereg2',
      studioHref: '#',
      profileHref: '#',
      avatar: IMG + 'avatar-03.png',
      name: 'Yellow Black White',
      org: 'YBW',
      meta: 'Сериал · START · разработка',
      hero: IMG + 'post-07.png',
      title: '«Берег 2»',
      text: 'Социальная драма, 2-й сезон. 8 эпизодов по 50 мин. Заказчик — START. Шоураннер — Иван Морозов. Сейчас: комната сценаристов, питч-байбл в работе.',
      status: 'Разработка',
      roles: ['Сценаристы (3)', 'Шоураннер уже есть'],
    },
    {
      href: 'project.html?id=komnata14',
      studioHref: 'profile-casting.html',
      profileHref: 'profile-casting.html',
      avatar: IMG + 'avatar-02.png',
      name: 'Анна Лебедева',
      org: 'инд. проект',
      meta: 'Короткий метр · фестивальное',
      hero: IMG + 'post-04.png',
      title: '«Комната 14»',
      text: 'Period-драма (1950-е), короткий метр 22 мин. Подача на «Святую Анну», «Окно в Европу», Beat Film Festival. Бюджет 4.8 ₽ млн (Минкульт + краудфандинг).',
      status: 'Производство',
      roles: ['Гримёр', 'Композитор'],
    },
  ];

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function factsHtml(facts) {
    return `<dl class="feed-card__facts">${facts
      .map(
        ([k, v]) =>
          `<div class="feed-card__fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`
      )
      .join('')}</dl>`;
  }

  function renderCardMedia(href, src, status) {
    if (!src) return '';
    const statusHtml = status
      ? `<span class="feed-card__status">${esc(status)}</span>`
      : '';
    return `<a href="${href}" class="feed-card__hero media-16x9"><img src="${src}" alt="" loading="lazy" />${statusHtml}</a>`;
  }

  function renderCasting(p) {
    const urgent = p.urgent
      ? '<span class="tag tag-orange">Срочно</span>'
      : '';
    const href = p.href || '#';
    const studioHref = p.studioHref || '#';
    const media = renderCardMedia(href, p.media || p.hero, '');
    return `<article class="feed-card feed-card--casting">
      <div class="feed-card__top">
        <a href="${studioHref}"><img src="${p.avatar}" alt="" class="feed-card__avatar" width="40" height="40" loading="lazy" /></a>
        <div class="feed-card__who">
          <div class="feed-card__org"><a href="${studioHref}">${esc(p.name)}</a></div>
          <div class="feed-card__meta">${esc(p.meta)}</div>
        </div>
        <div class="feed-card__tags">${urgent}<span class="tag tag-green">Кастинг</span></div>
      </div>
      ${media}
      <h3 class="feed-card__title"><a href="${href}">${esc(p.title)}</a></h3>
      <p class="feed-card__text">${esc(p.text)}</p>
      ${factsHtml(p.facts)}
      <div class="feed-card__deadline">
        <span class="feed-card__deadline-label">Дедлайн</span>
        <strong>${esc(p.deadline)}</strong>
      </div>
      <footer class="feed-card__foot">
        <span class="feed-card__responses">${p.responses} откликов</span>
        <div class="feed-card__actions">
          <button type="button" class="btn-secondary btn-sm">Сохранить</button>
          <a href="${href}" class="btn-primary btn-sm">Откликнуться</a>
        </div>
      </footer>
    </article>`;
  }

  function renderProject(p) {
    const roles = p.roles.map((r) => `<span class="tag tag-gray">${esc(r)}</span>`).join('');
    const href = p.href || '#';
    const studioHref = p.studioHref || '#';
    return `<article class="feed-card feed-card--project">
      <div class="feed-card__top">
        <a href="${studioHref}"><img src="${p.avatar}" alt="" class="feed-card__avatar" width="40" height="40" loading="lazy" /></a>
        <div class="feed-card__who">
          <div class="feed-card__org"><a href="${p.profileHref || studioHref}">${esc(p.name)}</a> · <a href="${studioHref}">${esc(p.org)}</a></div>
          <div class="feed-card__meta">${esc(p.meta)}</div>
        </div>
        <span class="tag tag-blue">Проект</span>
      </div>
      ${renderCardMedia(href, p.hero || p.media, p.status)}
      <h3 class="feed-card__title"><a href="${href}">${esc(p.title)}</a></h3>
      <p class="feed-card__text">${esc(p.text)}</p>
      <div class="feed-card__roles">${roles}</div>
      <footer class="feed-card__foot">
        <span class="feed-card__responses">${esc(p.status)}</span>
        <div class="feed-card__actions">
          <button type="button" class="btn-secondary btn-sm">Подписаться</button>
          <a href="${href}" class="btn-primary btn-sm">Открыть проект</a>
        </div>
      </footer>
    </article>`;
  }

  const PLATFORM_KEYS = {
    kinopoisk: 'Кинопоиск',
    okko: 'Okko',
    start: 'START',
    kion: 'KION',
    wink: 'Wink',
    premier: 'Premier',
  };

  const PLATFORM_LEADS = {
    kinopoisk: 'Проекты с заказчиком Кинопоиск — прокат и студийные сериалы',
    okko: 'Проекты Okko Studios — сериалы и полный метр в производстве',
    start: 'Проекты START — сериалы в разработке и производстве',
    kion: 'Проекты KION — док-сериалы и комедии',
    wink: 'Проекты Wink',
    premier: 'Проекты Premier',
  };

  function factValue(item, key) {
    if (!item.facts) return '';
    const row = item.facts.find(([k]) => k === key);
    return row ? row[1] : '';
  }

  function itemPlatform(item) {
    const fromFact = factValue(item, 'Платформа');
    const hay = `${item.meta || ''} ${fromFact}`.toLowerCase();
    for (const [key, label] of Object.entries(PLATFORM_KEYS)) {
      if (hay.includes(label.toLowerCase())) return key;
    }
    return '';
  }

  function castingFormat(item) {
    const meta = (item.meta || '').toLowerCase();
    if (meta.includes('док')) return 'doc';
    if (meta.includes('короткий')) return 'short';
    if (meta.includes('реклама')) return 'ad';
    if (meta.includes('сериал')) return 'series';
    if (meta.includes('полный метр')) return 'film';
    return '';
  }

  function projectStage(item) {
    const s = (item.status || '').toLowerCase();
    if (s.includes('кастинг')) return 'casting';
    if (s.includes('разработ')) return 'dev';
    if (s.includes('препрод')) return 'preprod';
    if (s.includes('производ') || s.includes('постпрод')) return 'production';
    return '';
  }

  function projectHiring(item) {
    const roles = item.roles || [];
    if (!roles.length) return false;
    return !roles.every((r) => /уже есть|закрыт/i.test(r));
  }

  function mountLists() {
    const castEl = document.getElementById('feed-castings');
    const projEl = document.getElementById('feed-projects');
    const page = document.body.getAttribute('data-page');
    if (castEl && page !== 'castings') {
      const limit = Number(castEl.dataset.limit) || CASTINGS.length;
      castEl.innerHTML = CASTINGS.slice(0, limit).map(renderCasting).join('');
    }
    if (projEl && page !== 'projects') {
      const limit = Number(projEl.dataset.limit) || PROJECTS.length;
      projEl.innerHTML = PROJECTS.slice(0, limit).map(renderProject).join('');
    }
  }

  function setChipGroup(container, attr, value) {
    container.querySelectorAll(`[${attr}]`).forEach((chip) => {
      const v = chip.getAttribute(attr) ?? '';
      chip.classList.toggle('is-on', v === value);
    });
  }

  function pluralRu(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  function feedCountLabel(kind, n) {
    if (kind === 'castings') {
      const w = pluralRu(n, 'кастинг', 'кастинга', 'кастингов');
      return `${n} ${w}`;
    }
    const w = pluralRu(n, 'проект', 'проекта', 'проектов');
    return `${n} ${w}`;
  }

  function matchesSearch(item, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      item.title,
      item.text,
      item.name,
      item.org,
      item.meta,
      item.status,
      ...(item.facts || []).flat(),
      ...(item.roles || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  }

  function readCastingFilters(root) {
    const platform = root.querySelector('[data-filter-platform].is-on');
    const format = root.querySelector('[data-filter-format].is-on');
    const urgent = root.querySelector('[data-filter-urgent]');
    const search = document.querySelector('[data-feed-search]');
    return {
      platform: platform ? platform.getAttribute('data-filter-platform') || '' : '',
      format: format ? format.getAttribute('data-filter-format') || '' : '',
      urgent: urgent ? urgent.checked : false,
      query: search ? search.value : '',
    };
  }

  function filterCastings(filters) {
    return CASTINGS.filter((item) => {
      if (filters.platform && itemPlatform(item) !== filters.platform) return false;
      if (filters.format && castingFormat(item) !== filters.format) return false;
      if (filters.urgent && !item.urgent) return false;
      if (!matchesSearch(item, filters.query)) return false;
      return true;
    });
  }

  function readProjectFilters(root) {
    const platform = root.querySelector('[data-filter-platform].is-on');
    const status = root.querySelector('[data-filter-status].is-on');
    const hiring = root.querySelector('[data-filter-hiring]');
    const search = document.querySelector('[data-feed-search]');
    return {
      platform: platform ? platform.getAttribute('data-filter-platform') || '' : '',
      status: status ? status.getAttribute('data-filter-status') || '' : '',
      hiring: hiring ? hiring.checked : false,
      query: search ? search.value : '',
    };
  }

  function filterProjects(filters) {
    return PROJECTS.filter((item) => {
      if (filters.platform && itemPlatform(item) !== filters.platform) return false;
      if (filters.status && projectStage(item) !== filters.status) return false;
      if (filters.hiring && !projectHiring(item)) return false;
      if (!matchesSearch(item, filters.query)) return false;
      return true;
    });
  }

  function setStat(name, value) {
    const el = document.querySelector(`[data-stat="${name}"]`);
    if (el) el.textContent = String(value);
  }

  function uniquePlatforms(items) {
    return new Set(items.map(itemPlatform).filter(Boolean)).size;
  }

  function castingMatchesProfile(item) {
    const hay = `${item.title} ${item.text} ${(item.facts || []).flat().join(' ')}`.toLowerCase();
    return /акт(ёр|рис|ер)/i.test(hay);
  }

  function updateCastingsStats(items) {
    setStat('total', items.length);
    setStat('urgent', items.filter((i) => i.urgent).length);
    setStat('platforms', uniquePlatforms(items));
    setStat('match', items.filter(castingMatchesProfile).length);
  }

  function updateProjectsStats(items) {
    setStat('total', items.length);
    setStat('hiring', items.filter(projectHiring).length);
    setStat('platforms', uniquePlatforms(items));
    setStat(
      'roles',
      items.reduce((sum, item) => sum + (item.roles ? item.roles.length : 0), 0)
    );
  }

  function updateFeedMeta(kind, count) {
    const countEl = document.querySelector('[data-feed-count]');
    const emptyEl = document.getElementById('feed-empty');
    if (countEl) countEl.textContent = feedCountLabel(kind, count);
    if (emptyEl) emptyEl.hidden = count > 0;
  }

  function resetFeedFilters(root, kind) {
    setChipGroup(root, 'data-filter-platform', '');
    setChipGroup(root, 'data-filter-format', '');
    setChipGroup(root, 'data-filter-status', '');
    root.querySelectorAll('[data-filter-urgent], [data-filter-hiring]').forEach((cb) => {
      cb.checked = false;
    });
    const search = document.querySelector('[data-feed-search]');
    if (search) search.value = '';
    if (kind === 'projects') {
      history.replaceState(null, '', 'projects.html');
      syncPlatformLead('');
    }
  }

  function syncPlatformLead(platform) {
    const lead = document.querySelector('[data-platform-lead]');
    if (lead) {
      lead.textContent =
        PLATFORM_LEADS[platform] ||
        'Статус съёмок, команда и вакансии у заказчиков платформ';
    }
  }

  function updatePlatformPickerCounts(root, baseFilters) {
    const picker = root.querySelector('[data-platform-picker]');
    if (!picker) return;
    picker.querySelectorAll('[data-filter-platform]').forEach((btn) => {
      const key = btn.getAttribute('data-filter-platform') ?? '';
      const count = filterProjects({ ...baseFilters, platform: key }).length;
      const em = btn.querySelector('.platform-pill__text em');
      if (em) em.textContent = feedCountLabel('projects', count);
    });
  }

  function bindFeedReset(root, kind, apply) {
    document.querySelectorAll('[data-feed-reset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        resetFeedFilters(root, kind);
        apply();
      });
    });
  }

  function renderCastingsPage() {
    const list = document.getElementById('feed-castings');
    const filtersRoot = document.querySelector('[data-feed-filters]');
    if (!list || !filtersRoot) return;

    function apply() {
      const filters = readCastingFilters(filtersRoot);
      const items = filterCastings(filters);
      list.innerHTML = items.map(renderCasting).join('');
      updateFeedMeta('castings', items.length);
      updateCastingsStats(items);
    }

    filtersRoot.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter-platform], [data-filter-format]');
      if (!chip) return;
      const attr = chip.hasAttribute('data-filter-platform')
        ? 'data-filter-platform'
        : 'data-filter-format';
      setChipGroup(filtersRoot, attr, chip.getAttribute(attr) ?? '');
      apply();
    });
    filtersRoot.querySelector('[data-filter-urgent]')?.addEventListener('change', apply);
    document.querySelector('[data-feed-search]')?.addEventListener('input', apply);
    bindFeedReset(filtersRoot, 'castings', apply);
    apply();
  }

  function renderProjectsPage() {
    const list = document.getElementById('feed-projects');
    const filtersRoot = document.querySelector('[data-feed-filters]');
    if (!list || !filtersRoot) return;

    const urlPlatform = new URLSearchParams(window.location.search).get('platform') || '';
    if (urlPlatform) setChipGroup(filtersRoot, 'data-filter-platform', urlPlatform);
    syncPlatformLead(urlPlatform);

    function apply() {
      const filters = readProjectFilters(filtersRoot);
      const items = filterProjects(filters);
      list.innerHTML = items.map(renderProject).join('');
      updateFeedMeta('projects', items.length);
      updateProjectsStats(items);
      updatePlatformPickerCounts(filtersRoot, {
        status: filters.status,
        hiring: filters.hiring,
        query: filters.query,
        platform: '',
      });
      syncPlatformLead(filters.platform);
    }

    filtersRoot.addEventListener('click', (e) => {
      const platform = e.target.closest('[data-filter-platform]');
      if (platform) {
        const key = platform.getAttribute('data-filter-platform') ?? '';
        setChipGroup(filtersRoot, 'data-filter-platform', key);
        const url = key ? `projects.html?platform=${key}` : 'projects.html';
        history.replaceState(null, '', url);
        apply();
        return;
      }
      const chip = e.target.closest('[data-filter-status]');
      if (!chip) return;
      setChipGroup(filtersRoot, 'data-filter-status', chip.getAttribute('data-filter-status') ?? '');
      apply();
    });
    filtersRoot.querySelector('[data-filter-hiring]')?.addEventListener('change', apply);
    document.querySelector('[data-feed-search]')?.addEventListener('input', apply);
    bindFeedReset(filtersRoot, 'projects', apply);
    apply();
  }

  window.KadrFeed = {
    CASTINGS,
    PROJECTS,
    renderCasting,
    renderProject,
    mountLists,
    filterCastings,
    filterProjects,
  };

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');
    mountLists();
    if (page === 'castings') renderCastingsPage();
    if (page === 'projects') renderProjectsPage();
  });
})();

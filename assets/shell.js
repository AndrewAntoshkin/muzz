/** Общий сайдбар и хедер — BASicslambda / Figma */
(function (global) {
  const ICON = {
    search:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    home:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>',
    casting:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    project:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    messages:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    team:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    faces:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
    responses:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    chevron:
      '<svg class="sidebar-item__chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m9 6 6 6-6 6"/></svg>',
    doc:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    settings:
      '<svg class="sidebar-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  };

  const PROFESSION_LABELS = {
    actor: 'Актёр',
    actress: 'Актриса',
    director: 'Режиссёр',
    producer: 'Продюсер',
    dop: 'Оператор-постановщик',
    operator: 'Оператор',
    screenwriter: 'Сценарист',
    editor: 'Монтажёр',
    sound: 'Звукорежиссёр',
    casting: 'Кастинг-директор',
    gaffer: 'Гафер',
    costume: 'Костюмер',
  };

  const TEAMS = [
    { href: 'studio.html', name: 'Sreda Production', meta: '«Тихий январь»', badge: '4' },
    { href: 'studio.html?id=trace', name: 'Trace Films', meta: '«После шторма»', badge: '2' },
    { href: 'studio.html?id=okno', name: 'Студия Окно', meta: 'Док. сериал «Окно»' },
    { href: 'profile-casting.html', name: 'Анна Лебедева', meta: '«Комната 14» · короткий метр' },
  ];

  const RECENT = [
    { href: 'casting.html', label: '«Тихий январь» · кастинг', meta: 'Sreda Production' },
    { href: 'project.html', label: '«После шторма» · проект', meta: 'Trace Films' },
    { href: 'profile.html', label: 'Александр Взметнев', meta: 'Профиль · актёр' },
    { href: 'profile-dop.html', label: 'Дмитрий Карпов', meta: 'Профиль · оператор-постановщик' },
    { href: 'profile-producer.html', label: 'Ксения Воронина', meta: 'Профиль · продюсер' },
  ];

  const DEMO_ROLES = {
    actor:    { name: 'Александр Взметнев', city: 'Москва', avatar: 'assets/actors/vzmetnev-avatar.jpg', complete: 78, views: 12 },
    director: { name: 'Анна Белова', city: 'Москва', avatar: 'assets/figma/avatar-02.png', complete: 88, views: 174 },
    dop:      { name: 'Дмитрий Карпов', city: 'Москва', avatar: 'assets/figma/avatar-04.png', complete: 90, views: 218 },
    producer: { name: 'Ксения Воронина', city: 'Москва', avatar: 'assets/figma/avatar-01.png', complete: 84, views: 156 },
    casting:  { name: 'Анна Лебедева', city: 'Москва', avatar: 'assets/figma/avatar-02.png', complete: 87, views: 218 },
    screenwriter: { name: 'Михаил Орлов', city: 'СПб', avatar: 'assets/figma/avatar-03.png', complete: 72, views: 64 },
    editor:   { name: 'Артём Сухов', city: 'Москва', avatar: 'assets/figma/avatar-05.png', complete: 86, views: 92 },
    sound:    { name: 'Сергей Митин', city: 'Москва', avatar: 'assets/figma/avatar-03.png', complete: 84, views: 71 },
    gaffer:   { name: 'Игорь Петров', city: 'Москва', avatar: 'assets/figma/avatar-04.png', complete: 85, views: 48 },
    costume:  { name: 'Ольга Семёнова', city: 'Москва', avatar: 'assets/figma/avatar-02.png', complete: 88, views: 53 },
  };

  function applyDemoRoleFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const role = params.get('role');
      if (!role || !DEMO_ROLES[role]) return;
      const b = document.body;
      const d = DEMO_ROLES[role];
      b.setAttribute('data-profession', role);
      b.setAttribute('data-user-name', d.name);
      b.setAttribute('data-user-city', d.city);
      b.setAttribute('data-user-avatar', d.avatar);
      b.setAttribute('data-profile-complete', String(d.complete));
      b.setAttribute('data-profile-views', String(d.views));
    } catch (_) {}
  }

  function readUser() {
    const b = document.body;
    const profession = b.getAttribute('data-profession') || 'actor';
    return {
      name: b.getAttribute('data-user-name') || 'Александр Взметнев',
      city: b.getAttribute('data-user-city') || 'Москва',
      avatar: b.getAttribute('data-user-avatar') || 'assets/actors/vzmetnev-avatar.jpg',
      profession: PROFESSION_LABELS[profession] || profession,
      complete: Math.min(100, Math.max(0, Number(b.getAttribute('data-profile-complete')) || 78)),
      views: b.getAttribute('data-profile-views') || '12',
    };
  }

  function renderRoleSwitcher() {
    const current = document.body.getAttribute('data-profession') || 'actor';
    const items = [
      ['actor', 'Актёр'],
      ['director', 'Режиссёр'],
      ['dop', 'Оператор-пост.'],
      ['producer', 'Продюсер'],
      ['casting', 'Кастинг-директор'],
      ['screenwriter', 'Сценарист'],
      ['editor', 'Монтажёр'],
      ['sound', 'Звукорежиссёр'],
      ['gaffer', 'Гафер'],
      ['costume', 'Костюмер'],
    ];
    const links = items.map(([key, label]) => {
      const active = key === current ? ' is-on' : '';
      const u = new URL(window.location.href);
      u.searchParams.set('role', key);
      return `<a href="${u.pathname}${u.search}" class="search-chip${active}">${label}</a>`;
    }).join('');
    return `<div class="sidebar-demo">
      <div class="sidebar-demo__title">Демо · войти как</div>
      <div class="search-filter__chips">${links}</div>
    </div>`;
  }

  function navItem(href, label, icon, navId, opts) {
    const o = opts || {};
    const cls = ['sidebar-item'];
    if (o.active) cls.push('is-active');
    if (o.sub) cls.push('sidebar-item--sub');
    const badge = o.badge ? `<span class="sidebar-item__badge">${o.badge}</span>` : '';
    const chevron = o.chevron ? ICON.chevron : '';
    const meta = o.meta ? `<span class="sidebar-item__meta">${o.meta}</span>` : '';
    return `<a href="${href}" class="${cls.join(' ')}" data-nav="${navId}">${icon}<span class="sidebar-item__text"><span class="sidebar-item__label">${label}</span>${meta}</span>${badge}${chevron}</a>`;
  }

  function renderProfile(user, active) {
    const cls = ['sidebar-profile'];
    if (active === 'profile') cls.push('is-active');
    return `<a href="profile.html" class="${cls.join(' ')}" data-nav="profile">
      <span class="sidebar-profile__avatar">
        <img src="${user.avatar}" alt="" width="44" height="44" loading="lazy" />
      </span>
      <span class="sidebar-profile__body">
        <span class="sidebar-profile__name">${user.name}</span>
        <span class="sidebar-profile__role">${user.profession}</span>
      </span>
    </a>`;
  }

  function renderDisclosure(id, label, icon, itemsHtml, open) {
    const state = open ? ' is-open' : '';
    return `<div class="sidebar-disclosure${state}" data-disclosure="${id}">
      <button type="button" class="sidebar-disclosure__trigger" aria-expanded="${open ? 'true' : 'false'}">
        ${icon}
        <span class="sidebar-item__label">${label}</span>
        ${ICON.chevron}
      </button>
      <div class="sidebar-disclosure__panel">${itemsHtml}</div>
    </div>`;
  }

  function renderHeader(crumb) {
    return `<header class="app-topbar">
      <div class="app-topbar__left">
        <h1 class="app-topbar__title">${crumb}</h1>
        <span class="app-topbar__crumb">Кадр</span>
      </div>
      <div class="app-topbar__actions">
        <button type="button" class="btn-secondary app-topbar__avail" data-action="avail">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <span>Запросить доступность</span>
        </button>
        <div class="app-topbar__publish-wrap" data-publish>
          <button type="button" class="btn-primary app-topbar__publish" data-action="publish">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <span>Опубликовать</span>
          </button>
          <div class="app-topbar__publish-menu" hidden>
            <a href="casting.html?new=1">Кастинг или вакансию</a>
            <a href="project.html?new=1">Проект</a>
            <a href="#post">Пост в ленту</a>
          </div>
        </div>
      </div>
    </header>`;
  }

  function bindPublishMenu(root) {
    const wrap = (root || document).querySelector('[data-publish]');
    if (!wrap) return;
    const btn = wrap.querySelector('[data-action="publish"]');
    const menu = wrap.querySelector('.app-topbar__publish-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) menu.hidden = true;
    });
  }

  function renderSidebar(active) {
    const user = readUser();

    const mainNav = [
      navItem('search.html', 'Поиск и фильтры', ICON.search, 'search', { active: active === 'search' }),
      navItem('index.html', 'Главная', ICON.home, 'home', { active: active === 'home' }),
      navItem('castings.html', 'Кастинги', ICON.casting, 'castings', { badge: '128', active: active === 'castings' }),
      navItem('projects.html', 'Проекты', ICON.project, 'projects', { badge: '42', active: active === 'projects' }),
      navItem('messages.html', 'Сообщения', ICON.messages, 'messages', { badge: '3', active: active === 'messages' }),
      navItem('faces.html', 'Новые лица', ICON.faces, 'faces', { badge: '24', active: active === 'faces' }),
      navItem('#responses', 'Мои отклики', ICON.responses, 'responses', { badge: '7' }),
    ].join('');

    const teamsSub = TEAMS.map((t, i) =>
      navItem(t.href, t.name, ICON.doc, `team-${i}`, { sub: true, meta: t.meta, badge: t.badge })
    ).join('');

    const recentSub = RECENT.map((r, i) =>
      navItem(r.href, r.label, ICON.doc, `recent-${i}`, { sub: true, meta: r.meta })
    ).join('');

    const teamsBlock = renderDisclosure('teams', 'Команды', ICON.team, teamsSub, true);
    const recentBlock = `<div class="sidebar-section sidebar-disclosure is-open" data-disclosure="recent">
      <button type="button" class="sidebar-disclosure__trigger sidebar-disclosure__trigger--section" aria-expanded="true">
        <span class="sidebar-section__label">Недавно просмотрено</span>
        ${ICON.chevron}
      </button>
      <nav class="sidebar-disclosure__panel sidebar-nav sidebar-nav--recent" aria-label="Недавно просмотрено">${recentSub}</nav>
    </div>`;

    return `<aside class="sidebar-panel" id="app-sidebar">
      <div class="sidebar-panel__scroll">
        ${renderProfile(user, active)}

        <nav class="sidebar-nav sidebar-group" aria-label="Навигация">${mainNav}</nav>

        <div class="sidebar-stack">
          ${teamsBlock}
          ${recentBlock}
        </div>

        <nav class="sidebar-nav sidebar-nav--utility" aria-label="Сервис">
          ${navItem('#settings', 'Настройки', ICON.settings, 'settings')}
        </nav>

        ${renderRoleSwitcher()}
      </div>

      <div class="sidebar-panel__footer">
        <a href="index.html" class="sidebar-brand__link" aria-label="На главную">
          <img src="assets/logo.svg" alt="кадр" width="58" height="20" />
        </a>
      </div>
    </aside>`;
  }

  function bindDisclosures(root) {
    if (!root) return;
    root.querySelectorAll('[data-disclosure]').forEach((block) => {
      const trigger = block.querySelector('.sidebar-disclosure__trigger');
      if (!trigger || trigger.tagName !== 'BUTTON') return;
      trigger.addEventListener('click', () => {
        const open = block.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function mount() {
    applyDemoRoleFromURL();
    const body = document.body;
    const active = body.getAttribute('data-page') || 'home';
    const crumb = body.getAttribute('data-page-title') || 'Главная';

    const headerEl = document.getElementById('app-header');
    const sidebarEl = document.getElementById('app-sidebar');

    if (sidebarEl) {
      sidebarEl.outerHTML = renderSidebar(active);
      bindDisclosures(document.getElementById('app-sidebar'));
    }
    if (headerEl) {
      const headerMode = body.getAttribute('data-header') || 'bar';
      if (headerMode === 'page') {
        headerEl.remove();
      } else {
        headerEl.outerHTML = renderHeader(crumb);
        bindPublishMenu(document);
      }
    }
  }

  global.KadrShell = { mount, renderHeader, renderSidebar };
  mount();
})(typeof window !== 'undefined' ? window : global);

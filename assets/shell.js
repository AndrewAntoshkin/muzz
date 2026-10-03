/** Общий сайдбар и хедер — BASicslambda / Figma */
(function (global) {
  const ICON = {
    search:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    home:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>',
    casting:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    project:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    messages:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    team:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    faces:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
    responses:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    chevron:
      '<svg class="sidebar-item__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m9 6 6 6-6 6"/></svg>',
    doc:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    settings:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    folder:
      '<svg class="sidebar-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>',
  };

  function currentRole() {
    if (global.KadrRoles) return global.KadrRoles.current();
    return {
      id: 'actor',
      label: 'Актёр',
      name: 'Александр Взметнев',
      avatar: 'assets/actors/vzmetnev-avatar.jpg',
      profile: 'profile.html',
      nav: [],
      blockTitle: 'Агентство',
      block: [],
      recent: [],
      plus: [],
      hub: null,
    };
  }

  function withRole(href, id) {
    if (global.KadrRoles) return global.KadrRoles.hrefWithRole(href, id);
    return href;
  }

  function readUser() {
    const role = currentRole();
    return {
      name: role.name,
      avatar: role.avatar,
      profession: role.label,
      profile: role.profile,
    };
  }

  function renderRoleSwitcher(role) {
    const items = [
      ['actor', 'Актёр'],
      ['casting', 'Кастинг-директор'],
      ['agent', 'Агент'],
    ];
    const links = items.map(([key, label]) => {
      const active = key === role.id ? ' is-on' : '';
      return `<a href="${withRole(window.location.pathname + window.location.search, key)}" class="search-chip${active}">${label}</a>`;
    }).join('');
    return `<details class="sidebar-demo" open>
      <summary class="sidebar-demo__title">Войти как</summary>
      <div class="search-filter__chips">${links}</div>
    </details>`;
  }

  function navItem(href, label, icon, navId, opts) {
    const o = opts || {};
    const cls = ['sidebar-item'];
    if (o.active) cls.push('is-active');
    if (o.quiet) cls.push('sidebar-item--quiet');
    const count = o.count ? `<span class="sidebar-item__count">${o.count}</span>` : '';
    return `<a href="${href}" class="${cls.join(' ')}" data-nav="${navId}">${icon || ''}<span class="sidebar-item__label">${label}</span>${count}</a>`;
  }

  function renderProfile(user, active, role) {
    const cls = ['sidebar-profile'];
    if (active === 'profile') cls.push('is-active');
    return `<a href="${withRole(user.profile || 'profile.html', role.id)}" class="${cls.join(' ')}" data-nav="profile">
      <span class="sidebar-profile__avatar">
        <img src="${user.avatar}" alt="" width="44" height="44" loading="lazy" />
      </span>
      <span class="sidebar-profile__body">
        <span class="sidebar-profile__name">${user.name}</span>
        <span class="sidebar-profile__role">${user.profession}</span>
      </span>
    </a>`;
  }

  function renderBlock(title, itemsHtml) {
    return `<section class="sidebar-block">
      <h2 class="sidebar-block__title">${title}</h2>
      <nav class="sidebar-nav">${itemsHtml}</nav>
    </section>`;
  }

  function renderHeader(crumb, role) {
    const plus = (role.plus || []).map((p) => `<a href="${withRole(p.href || '#', role.id)}">${p.label}</a>`).join('');
    return `<header class="app-topbar ss-head">
      <h1 class="ss-head__title" data-page-title-slot>${crumb}</h1>
      <div class="app-topbar__publish-wrap" data-publish>
        <button type="button" class="ss-head__plus" data-action="publish" aria-label="Опубликовать">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="app-topbar__publish-menu" hidden>
          ${plus || '<a href="#post">Пост в ленту</a>'}
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
    const setOpen = (open) => {
      menu.hidden = !open;
      wrap.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    setOpen(false);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(menu.hidden);
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  const NAV_ICONS = {
    home: ICON.home,
    castings: ICON.casting,
    responses: ICON.responses,
    messages: ICON.messages,
    roster: ICON.faces,
    search: ICON.search,
  };

  function renderSidebar(active) {
    const role = currentRole();
    const user = readUser();

    const mainNav = (role.nav || []).map((item) =>
      navItem(withRole(item.href, role.id), item.label, NAV_ICONS[item.id] || ICON.doc, item.id, {
        active: active === item.id || (item.id === 'roster' && active === 'search'),
        count: item.count,
      })
    ).join('');

    const teamsNav = (role.block || []).map((t, i) =>
      navItem(withRole(t.href, role.id), t.name, ICON.folder, `team-${i}`)
    ).join('');

    const recentNav = (role.recent || []).map((r, i) =>
      navItem(withRole(r.href, role.id), r.label, '', `recent-${i}`, { quiet: true })
    ).join('');

    return `<aside class="sidebar-panel" id="app-sidebar">
      <div class="sidebar-head">
        <a href="${withRole('index.html', role.id)}" class="sidebar-brand__link" aria-label="На главную">
          <img src="assets/logo.svg" alt="kadr" width="42" height="20" />
        </a>
        <a href="${withRole('search.html', role.id)}" class="sidebar-search${active === 'search' ? ' is-active' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          Поиск
        </a>
      </div>
      <div class="sidebar-panel__scroll">
        <nav class="sidebar-nav" aria-label="Навигация">${mainNav}</nav>
        ${teamsNav ? renderBlock(role.blockTitle || 'Агентство', teamsNav) : ''}
        ${recentNav ? renderBlock('Недавно', recentNav) : ''}
      </div>
      <div class="sidebar-foot">
        ${renderRoleSwitcher(role)}
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

  // Right rail (partners / messages / events) lives only on the home page.
  // On other pages it is removed so the center column can use the full width.
  function ensureRail() {
    const isHome = document.body.getAttribute('data-page') === 'home';
    let rail = document.getElementById('app-right-rail');

    if (!isHome) {
      if (rail) rail.remove();
      return;
    }

    const frame = document.querySelector('.app-frame');
    const main = document.querySelector('.app-main');
    if (!frame || !main) return;

    if (!rail) {
      rail = document.createElement('aside');
      rail.id = 'app-right-rail';
      rail.className = 'app-right-rail';
    }
    if (rail.parentElement !== frame) frame.appendChild(rail);
  }

  function applyHubCopy(role) {
    if (document.body.getAttribute('data-page') !== 'home' || !role.hub) return;
    const hub = role.hub;
    const title = document.querySelector('.hub-welcome__title');
    const lead = document.querySelector('.hub-welcome__lead');
    if (title) title.textContent = `Здравствуйте, ${role.firstName}`;
    if (lead) lead.textContent = hub.lead;
    const metrics = document.querySelectorAll('.hub-metrics .hub-metric');
    hub.metrics.forEach((row, i) => {
      const el = metrics[i];
      if (!el) return;
      const strong = el.querySelector('strong');
      const span = el.querySelector('span');
      const em = el.querySelector('em');
      if (strong) strong.textContent = row[0];
      if (span) span.textContent = row[1];
      if (em) em.textContent = row[2];
    });
    const feedTitle = document.querySelector('#feed-castings')?.closest('.hub-block')?.querySelector('.hub-block__title');
    const feedLead = document.querySelector('#feed-castings')?.closest('.hub-block')?.querySelector('.hub-block__lead');
    if (feedTitle) feedTitle.textContent = hub.feedTitle;
    if (feedLead) feedLead.textContent = hub.feedLead;
    const peopleBlock = document.querySelector('#faces-strip-preview')?.closest('.hub-block');
    if (peopleBlock) {
      if (role.id === 'actor') {
        peopleBlock.hidden = true;
      } else {
        peopleBlock.hidden = false;
        const t = peopleBlock.querySelector('.hub-block__title');
        const l = peopleBlock.querySelector('.hub-block__lead');
        const a = peopleBlock.querySelector('.hub-block__link');
        if (t) t.textContent = hub.peopleTitle;
        if (l) l.textContent = hub.peopleLead;
        if (a) {
          a.setAttribute('href', withRole('search.html', role.id));
          a.textContent = 'Все в поиске →';
        }
      }
    }
  }

  function mount() {
    const role = currentRole();
    const body = document.body;
    const active = body.getAttribute('data-page') || 'home';
    const crumb = body.getAttribute('data-page-title') || 'Главная';

    const headerEl = document.getElementById('app-header');
    const sidebarEl = document.getElementById('app-sidebar');

    if (sidebarEl) {
      sidebarEl.outerHTML = renderSidebar(active);
      const sidebar = document.getElementById('app-sidebar');
      bindDisclosures(sidebar);
    }
    if (headerEl) {
      headerEl.outerHTML = renderHeader(crumb, role);
      bindPublishMenu(document);
    }
    applyHubCopy(role);
    ensureRail();
  }

  global.KadrShell = { mount, renderHeader, renderSidebar };
  mount();
})(typeof window !== 'undefined' ? window : global);

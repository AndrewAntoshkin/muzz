/** Каталог «Новые лица» */
(function () {
  const IMG = 'assets/figma/';

  const FACES = [
    { href: 'profile.html', name: 'Александр Взметнев', role: 'Актёр', profession: 'actor', city: 'Москва', img: 'assets/actors/vzmetnev-kinopoisk.jpg', verified: true, hint: '«Любовь СССР» · Кинопоиск' },
    { href: 'profile-actress.html', name: 'Мария Коваль', role: 'Актриса', profession: 'actress', city: 'Москва', img: IMG + 'avatar-02.png', verified: true, hint: '«Слово пацана 2» · START' },
    { href: 'profile-dop.html', name: 'Дмитрий Карпов', role: 'Оператор-постановщик', profession: 'dop', city: 'Москва', img: IMG + 'avatar-04.png', verified: true, hint: 'ARRI Alexa 35 · Okko, KION' },
    { href: 'profile-producer.html', name: 'Ксения Воронина', role: 'Продюсер', profession: 'producer', city: 'Москва', img: IMG + 'avatar-01.png', verified: true, hint: 'Trace Films · «После шторма»' },
    { href: 'profile-director.html', name: 'Анна Белова', role: 'Режиссёр', profession: 'director', city: 'Москва', initials: 'АБ', bg: '#4A3D5C', hint: '«Маяк» 2024 · полный метр' },
    { href: 'profile-casting.html', name: 'Анна Лебедева', role: 'Кастинг-директор', profession: 'casting', city: 'Москва', img: IMG + 'avatar-02.png', verified: true, hint: '«Тихий январь» · Sreda' },
    { href: 'profile.html?role=screenwriter', name: 'Михаил Орлов', role: 'Сценарист', profession: 'screenwriter', city: 'СПб', img: IMG + 'avatar-03.png' },
    { href: 'profile.html?role=editor', name: 'Артём Сухов', role: 'Монтажёр', profession: 'editor', city: 'Москва', img: IMG + 'avatar-05.png', verified: true },
    { href: 'profile.html?role=sound', name: 'Сергей Митин', role: 'Звукорежиссёр', profession: 'sound', city: 'Москва', img: IMG + 'avatar-03.png' },
    { href: 'profile.html?role=gaffer', name: 'Игорь Петров', role: 'Гафер', profession: 'gaffer', city: 'Москва', img: IMG + 'avatar-04.png' },
    { href: 'profile.html?role=costume', name: 'Ольга Семёнова', role: 'Костюмер', profession: 'costume', city: 'Москва', img: IMG + 'avatar-02.png' },
    { href: '#', name: 'Елена Соколова', role: 'Актриса', profession: 'actress', city: 'СПб', img: IMG + 'avatar-02.png' },
    { href: '#', name: 'Павел Романов', role: 'Актёр', profession: 'actor', city: 'Казань', img: IMG + 'avatar-03.png' },
    { href: '#', name: 'Виктория Ли', role: 'Актриса', profession: 'actress', city: 'Москва', initials: 'ВЛ', bg: '#5C4A45' },
    { href: '#', name: 'Никита Громов', role: 'Оператор-постановщик', profession: 'dop', city: 'Мурманск', img: IMG + 'avatar-04.png' },
    { href: '#', name: 'Юлия Морозова', role: 'Продюсер', profession: 'producer', city: 'Москва', img: IMG + 'avatar-01.png', verified: true },
    { href: '#', name: 'Тимур Ахметов', role: 'Режиссёр', profession: 'director', city: 'Казань', initials: 'ТА', bg: '#3D6D99' },
    { href: '#', name: 'София Ветрова', role: 'Кастинг-директор', profession: 'casting', city: 'Москва', img: IMG + 'avatar-02.png' },
    { href: '#', name: 'Глеб Чернышёв', role: 'Сценарист', profession: 'screenwriter', city: 'Москва', img: IMG + 'avatar-03.png' },
    { href: '#', name: 'Алина Кузнецова', role: 'Монтажёр', profession: 'editor', city: 'СПб', img: IMG + 'avatar-05.png' },
    { href: '#', name: 'Денис Волков', role: 'Звукорежиссёр', profession: 'sound', city: 'Москва', initials: 'ДВ', bg: '#2C2C2B' },
    { href: '#', name: 'Карина Ильина', role: 'Костюмер', profession: 'costume', city: 'Сочи', img: IMG + 'avatar-02.png' },
    { href: '#', name: 'Максим Орлов', role: 'Гафер', profession: 'gaffer', city: 'Москва', img: IMG + 'avatar-04.png' },
    { href: '#', name: 'Дарья Новикова', role: 'Актриса', profession: 'actress', city: 'Москва', img: IMG + 'avatar-02.png', verified: true },
  ];

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderPopover(p) {
    const status = p.verified
      ? '<span class="tag tag-green person-card__popover-tag">Проверен</span>'
      : '<span class="person-card__popover-tag">Новый в «Кадре»</span>';
    const hint = p.hint || `Открыт к предложениям · ${p.city}`;
    return `<div class="person-card__popover" role="tooltip">
      <div class="person-card__popover-name">${esc(p.name)}</div>
      <div class="person-card__popover-line">${esc(p.role)} · ${esc(p.city)}</div>
      <div class="person-card__popover-line person-card__popover-hint">${esc(hint)}</div>
      <div class="person-card__popover-foot">${status}</div>
    </div>`;
  }

  function renderPersonCard(p, extraClass, opts) {
    const cls = ['person-card', extraClass].filter(Boolean).join(' ');
    const media = p.img
      ? `<span class="person-card__media"><img src="${p.img}" alt="" loading="lazy" /></span>`
      : `<span class="person-card__media"><span class="person-card__ava" style="background:${p.bg || '#5C4A45'}">${esc(p.initials)}</span></span>`;
    const badge = p.verified ? '<span class="person-card__badge" title="Проверен">✓</span>' : '';
    const card = `<a href="${p.href}" class="${cls}" data-profession="${p.profession}" data-city="${p.city}" data-verified="${p.verified ? '1' : '0'}">
      ${media}
      <span class="person-card__body">
        <span class="person-card__name">${esc(p.name)}${badge}</span>
        <span class="person-card__role">${esc(p.role)}</span>
      </span>
    </a>`;
    if (!opts?.popover) return card;
    return `<div class="person-card-wrap">${card}${renderPopover(p)}</div>`;
  }

  function mountStrip() {
    const root = document.getElementById('faces-strip-preview');
    if (!root) return;
    root.innerHTML = FACES.slice(0, 8).map((p) => renderPersonCard(p, 'person-card--strip')).join('');
  }

  function readFilters(root) {
    const q = (root.querySelector('[data-faces-search]')?.value || '').trim().toLowerCase();
    const profession = root.querySelector('[data-filter-profession].is-on')?.getAttribute('data-filter-profession') || '';
    const city = root.querySelector('[data-filter-city].is-on')?.getAttribute('data-filter-city') || '';
    const verified = root.querySelector('[data-filter-verified]')?.checked;
    return { q, profession, city, verified };
  }

  function filterFaces(filters) {
    return FACES.filter((p) => {
      if (filters.profession && p.profession !== filters.profession) return false;
      if (filters.city && p.city !== filters.city) return false;
      if (filters.verified && !p.verified) return false;
      if (filters.q) {
        const hay = `${p.name} ${p.role} ${p.city}`.toLowerCase();
        if (!hay.includes(filters.q)) return false;
      }
      return true;
    });
  }

  function setChipGroup(container, attr, value) {
    container.querySelectorAll(`[${attr}]`).forEach((chip) => {
      const v = chip.getAttribute(attr) ?? '';
      chip.classList.toggle('is-on', v === value);
    });
  }

  function mountCatalog() {
    const page = document.getElementById('faces-catalog');
    const grid = document.getElementById('faces-grid');
    const countEl = document.querySelector('[data-faces-count]');
    const filtersRoot = document.querySelector('[data-faces-filters]');
    if (!page || !grid || !filtersRoot) return;

    function apply() {
      const filters = readFilters(filtersRoot);
      const items = filterFaces(filters);
      grid.innerHTML = items.map((p) => renderPersonCard(p, null, { popover: true })).join('') ||
        '<p class="faces-empty">Никого не найдено. Сбросьте фильтры или измените запрос.</p>';
      if (countEl) {
        const n = items.length;
        const word = n === 1 ? 'человек' : n < 5 ? 'человека' : 'человек';
        countEl.textContent = `${n} ${word}`;
      }
    }

    filtersRoot.querySelector('[data-faces-search]')?.addEventListener('input', apply);
    filtersRoot.querySelector('[data-filter-verified]')?.addEventListener('change', apply);
    filtersRoot.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter-profession], [data-filter-city]');
      if (!chip) return;
      const attr = chip.hasAttribute('data-filter-profession') ? 'data-filter-profession' : 'data-filter-city';
      setChipGroup(filtersRoot, attr, chip.getAttribute(attr) ?? '');
      apply();
    });
    filtersRoot.querySelector('[data-faces-reset]')?.addEventListener('click', () => {
      const input = filtersRoot.querySelector('[data-faces-search]');
      if (input) input.value = '';
      setChipGroup(filtersRoot, 'data-filter-profession', '');
      setChipGroup(filtersRoot, 'data-filter-city', '');
      const v = filtersRoot.querySelector('[data-filter-verified]');
      if (v) v.checked = false;
      apply();
    });
    apply();
  }

  window.KadrFaces = { FACES, renderPersonCard, filterFaces };

  document.addEventListener('DOMContentLoaded', () => {
    mountStrip();
    mountCatalog();
  });
})();

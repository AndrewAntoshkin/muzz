/** Профиль из KadrDB: person.html?id=slug */
(function () {
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  function media(p) {
    if (p.img) {
      return `<img src="${esc(p.img)}" alt="" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid #2e2e2e;margin:0 0 14px;" />`;
    }
    const bg = p.bg || '#5C4A45';
    return `<div style="width:120px;height:120px;border-radius:50%;background:${esc(bg)};border:4px solid #2e2e2e;margin:0 0 14px;display:grid;place-items:center;font-weight:700;font-size:28px;color:#fff;">${esc(p.initials || initials(p.name))}</div>`;
  }

  function render(p, agency) {
    const verified = p.verified
      ? `<span class="tag tag-green" style="display:inline-flex;align-items:center;gap:4px;">Проверен</span>`
      : '';
    const source = p.source
      ? `<a href="${esc(p.source)}" target="_blank" rel="noopener" class="btn-secondary">Анкетка на сайте агентства</a>`
      : '';
    const agentBlock = agency
      ? `<section class="detail-side__panel">
          <div class="detail-side__title">Агентство</div>
          <dl class="detail-kv">
            <dt>Агентство</dt><dd>${esc(agency.name)}</dd>
            <dt>Агент</dt><dd>${esc(agency.agent)}</dd>
            <dt>Почта</dt><dd><a class="link-accent" href="mailto:${esc(agency.email)}">${esc(agency.email)}</a></dd>
          </dl>
          <a href="${esc(agency.site)}" target="_blank" rel="noopener" class="btn-secondary btn-block" style="margin-top:10px;">Сайт агентства</a>
        </section>`
      : '';

    return `
      <p class="page-type">Профиль</p>
      <div class="detail-grid">
        <div>
          <section class="detail-hero">
            <div class="detail-hero__body" style="padding-top:4px;position:relative;">
              ${media(p)}
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
                <h1 class="detail-hero__title" style="margin:0;">${esc(p.name)}</h1>
                ${verified}
              </div>
              <p class="detail-hero__meta">
                <strong>${esc(p.role)}</strong>
                <span>·</span>
                <span>${esc(p.city)}</span>
              </p>
              <p style="font-size:15px;line-height:1.6;margin-top:14px;max-width:620px;">${esc(p.bio || p.hint || '')}</p>
              <div class="detail-hero__actions">
                <button type="button" class="btn-primary">Пригласить на кастинг</button>
                ${source}
              </div>
            </div>
          </section>

          <section class="detail-block">
            <div class="detail-block__head">
              <h2 class="detail-block__title">Анкета</h2>
            </div>
            <dl class="detail-kv">
              <dt>Профессия</dt><dd>${esc(p.role)}</dd>
              <dt>Город</dt><dd>${esc(p.city)}</dd>
              <dt>Источник</dt><dd>${p.source ? `<a class="link-accent" href="${esc(p.source)}" target="_blank" rel="noopener">akter1.ru</a>` : 'Кадр'}</dd>
            </dl>
            <p style="margin-top:16px;font-size:13px;color:var(--text-muted);">Фильмография и параметры подтянем в следующих заходах с карточки агентства.</p>
          </section>
        </div>
        <aside class="detail-side">
          ${agentBlock}
          <section class="detail-side__panel" style="background:rgba(85,240,139,0.08);border:none;">
            <div class="detail-side__title" style="color:#55f08b;">Открыт к предложениям</div>
            <button type="button" class="btn-primary btn-block">Запросить доступность</button>
          </section>
        </aside>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('person-root');
    if (!root || !window.KadrDB) return;
    const id = new URLSearchParams(location.search).get('id');
    const person = id ? window.KadrDB.getPerson(id) : null;
    if (!person) {
      root.innerHTML = '<p class="faces-empty">Профиль не найден. <a href="faces.html">К каталогу</a></p>';
      return;
    }
    const agency = (window.KadrDB.agencies || []).find((a) => a.id === person.agencyId);
    document.title = `${person.name} · Кадр`;
    document.body.setAttribute('data-page-title', person.name);
    const titleEl = document.querySelector('.app-header__title, [data-page-title-slot]');
    if (titleEl) titleEl.textContent = person.name;
    root.innerHTML = render(person, agency);
  });
})();

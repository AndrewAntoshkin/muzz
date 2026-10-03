/** Кадр — локальная база прототипа. Пополняется пачками. */
(function () {
  const AGENCY = {
    id: 'akter1',
    name: 'Актёр 1',
    site: 'https://akter1.ru',
    agent: 'Ирина Сойкина',
    email: 'irina@akter1.ru',
  };

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  function fromAkter1(card) {
    const slug = card.slug;
    const path = card.profession === 'actress' ? 'actress' : 'actor';
    return {
      id: slug,
      href: `person.html?id=${slug}`,
      name: card.name,
      role: card.role,
      profession: card.profession,
      city: card.city || 'Москва',
      img: card.img,
      verified: true,
      hint: card.hint || 'Агентство «Актёр 1»',
      source: `${AGENCY.site}/${path}/item/${slug}.html`,
      agencyId: AGENCY.id,
      bio: `${card.role} агентства «Актёр 1». Москва. Анкета с актерского агентства номер 1.`,
    };
  }

  const SEED = [
    {
      id: 'vzmetnev',
      href: 'profile.html',
      name: 'Александр Взметнев',
      role: 'Актёр',
      profession: 'actor',
      city: 'Москва',
      img: 'assets/actors/vzmetnev-kinopoisk.jpg',
      verified: true,
      hint: '«Любовь СССР» · Кинопоиск',
      bio: 'Снимается в сериалах и кино с 2013 года.',
    },
    {
      id: 'karpov',
      href: 'profile-dop.html',
      name: 'Дмитрий Карпов',
      role: 'Оператор-постановщик',
      profession: 'dop',
      city: 'Москва',
      img: 'assets/figma/avatar-04.png',
      verified: true,
      hint: 'ARRI Alexa 35 · Okko, KION',
    },
    {
      id: 'voronina',
      href: 'profile-producer.html',
      name: 'Ксения Воронина',
      role: 'Продюсер',
      profession: 'producer',
      city: 'Москва',
      img: 'assets/figma/avatar-01.png',
      verified: true,
      hint: 'Trace Films · «После шторма»',
    },
    {
      id: 'belova',
      href: 'profile-director.html',
      name: 'Анна Белова',
      role: 'Режиссёр',
      profession: 'director',
      city: 'Москва',
      initials: 'АБ',
      bg: '#4A3D5C',
      hint: '«Маяк» 2024 · полный метр',
    },
    {
      id: 'kevorkova',
      href: 'profile-casting.html',
      name: 'Анна Кеворкова',
      role: 'Кастинг-директор',
      profession: 'casting',
      city: 'Москва',
      img: 'assets/people/kevorkova.jpg',
      verified: true,
      hint: '«Союз Спасения» · «Майор Гром»',
    },
    { id: 'orlov-scr', href: 'person.html?id=orlov-scr', name: 'Михаил Орлов', role: 'Сценарист', profession: 'screenwriter', city: 'СПб', img: 'assets/figma/avatar-03.png' },
    { id: 'sukhov', href: 'profile.html?role=editor', name: 'Артём Сухов', role: 'Монтажёр', profession: 'editor', city: 'Москва', img: 'assets/figma/avatar-05.png', verified: true },
    { id: 'mitin', href: 'person.html?id=mitin', name: 'Сергей Митин', role: 'Звукорежиссёр', profession: 'sound', city: 'Москва', img: 'assets/figma/avatar-03.png' },
    { id: 'petrov', href: 'person.html?id=petrov', name: 'Игорь Петров', role: 'Гафер', profession: 'gaffer', city: 'Москва', img: 'assets/figma/avatar-04.png' },
    { id: 'semenova-cos', href: 'person.html?id=semenova-cos', name: 'Ольга Семёнова', role: 'Костюмер', profession: 'costume', city: 'Москва', img: 'assets/figma/avatar-02.png' },
    { id: 'gromov', href: 'person.html?id=gromov', name: 'Никита Громов', role: 'Оператор-постановщик', profession: 'dop', city: 'Мурманск', img: 'assets/figma/avatar-04.png' },
    { id: 'morozova-prod', href: 'person.html?id=morozova-prod', name: 'Юлия Морозова', role: 'Продюсер', profession: 'producer', city: 'Москва', img: 'assets/figma/avatar-01.png', verified: true },
    { id: 'akhmetov', href: 'person.html?id=akhmetov', name: 'Тимур Ахметов', role: 'Режиссёр', profession: 'director', city: 'Казань', initials: 'ТА', bg: '#3D6D99' },
    { id: 'vetrova', href: 'person.html?id=vetrova', name: 'София Ветрова', role: 'Кастинг-директор', profession: 'casting', city: 'Москва', img: 'assets/figma/avatar-02.png' },
    { id: 'chernyshev', href: 'person.html?id=chernyshev', name: 'Глеб Чернышёв', role: 'Сценарист', profession: 'screenwriter', city: 'Москва', img: 'assets/figma/avatar-03.png' },
    { id: 'kuznetsova-ed', href: 'person.html?id=kuznetsova-ed', name: 'Алина Кузнецова', role: 'Монтажёр', profession: 'editor', city: 'СПб', img: 'assets/figma/avatar-05.png' },
    { id: 'volkov', href: 'person.html?id=volkov', name: 'Денис Волков', role: 'Звукорежиссёр', profession: 'sound', city: 'Москва', initials: 'ДВ', bg: '#2C2C2B' },
    { id: 'ilina', href: 'person.html?id=ilina', name: 'Карина Ильина', role: 'Костюмер', profession: 'costume', city: 'Сочи', img: 'assets/figma/avatar-02.png' },
    { id: 'orlov-gaf', href: 'person.html?id=orlov-gaf', name: 'Максим Орлов', role: 'Гафер', profession: 'gaffer', city: 'Москва', img: 'assets/figma/avatar-04.png' },
  ];

  const people = [
    ...SEED,
    ...(window.AKTER1_FACES || []).map(fromAkter1),
  ];

  const byId = Object.create(null);
  people.forEach((p) => {
    byId[p.id] = p;
  });

  window.KadrDB = {
    version: 1,
    batch: 'akter1-roster',
    agencies: [AGENCY],
    people,
    getPerson(id) {
      return byId[id] || null;
    },
    faces() {
      return people.map((p) => ({
        href: p.href,
        name: p.name,
        role: p.role,
        profession: p.profession,
        city: p.city,
        img: p.img,
        initials: p.initials || initials(p.name),
        bg: p.bg,
        verified: p.verified,
        hint: p.hint,
      }));
    },
  };
})();

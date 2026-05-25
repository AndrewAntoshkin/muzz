/**
 * Правая панель: общий каркас + блоки по профессии (data-profession на body).
 * Общее: профиль, быстрые ссылки, сегодня, партнёры.
 * По роли: статусы, срочное, события, люди, тренды, совет.
 */
(function () {
  const IMG = 'assets/figma/';

  const ADS = [
    { title: 'Питчинг ИРИ · сериалы для платформ', image: IMG + 'ad-03.png', meta: ['до 15 июня', 'до 600 ₽ млн'], brand: 'Институт развития интернета', desc: 'Заявки на сериалы для Кинопоиск, Okko, START, KION.', cta: 'Подать заявку' },
    { title: 'DaVinci Resolve с нуля до Pro', image: IMG + 'ad-01.png', meta: ['10 июня', '8 недель'], brand: 'Московская школа кино', desc: 'Курирует Артём Сухов («Слово пацана»).', cta: 'Подробнее' },
    { title: 'ARRI Alexa 35 · аренда', image: IMG + 'ad-02.png', meta: ['2 ч доставка', 'KADR15'], brand: 'Cinelab Rentals', desc: 'Скидка 15% по промокоду до 30 июня.', cta: 'Каталог' },
    { title: 'Кинорынок «Маяк»', image: IMG + 'ad-03.png', meta: ['1–7 окт', 'Геленджик'], brand: 'Фестиваль «Маяк»', desc: 'Подача проектов до 15 июля. Питчинги, рынок, индустрия.', cta: 'Подать проект' },
    { title: 'Dolby Atmos для кино', image: IMG + 'ad-04.png', meta: ['Atmos', '7.1.4'], brand: 'Mosfilm Sound', desc: '−20% для «Кадр» на постпрод-смену.', cta: 'Забронировать' },
  ];

  const BY_PROFESSION = {
    director: {
      label: 'Режиссёр',
      progressHint: '+ синопсис и референсы → 88%',
      availability: 'Питчинг полного метра',
      viewsLabel: 'просмотров портфолио',
      statusTitle: 'Ваши проекты',
      statusFooter: 'Все проекты →',
      status: [
        { dot: 'green', strong: '1', line: 'в производстве', sub: '«После шторма» · постпрод' },
        { dot: 'blue', strong: '2', line: 'в препроде', sub: 'Сценарий + питчинг' },
        { dot: 'gray', strong: '3', line: 'разработка', sub: 'Заявки на гранты' },
      ],
      links: [
        ['Мои проекты', '6'],
        ['Команда', '14'],
        ['Сценарии', '4'],
        ['Заявки на гранты', '2'],
        ['Мой профиль', null, 'profile-director.html'],
      ],
      urgentTitle: 'Требует внимания',
      urgentFooter: 'Все задачи →',
      urgent: [
        ['Финал монтажа · «После шторма»', 'Okko · до 15 июня'],
        ['Питчинг ИРИ · «Тихий январь»', '14 июня · слот 16:00'],
        ['Подача в Фонд кино · «Поле»', 'до 30 июня'],
      ],
      events: [
        ['14', 'июн', 'Питчинг сериалов · ИРИ', 'Москва · ваш слот 16:00', '2026-06-14', false],
        ['22', 'июн', 'Премьера «После шторма»', 'Trace Films · закрытый показ для Okko', '2026-06-22', false],
        ['1', 'окт', 'Фестиваль «Маяк»', 'Геленджик · конкурс полного метра', '2026-10-01', true],
      ],
      peopleTitle: 'Команда мечты',
      people: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', meta: 'Продюсер · Trace Films' },
        { img: IMG + 'avatar-04.png', name: 'Дмитрий Карпов', meta: 'Оператор-пост · 8 лет' },
        { initials: 'АЛ', bg: '#5C4A45', name: 'Анна Лебедева', meta: 'Кастинг-директор' },
      ],
      today: [
        ['Новые сценарии', '3'],
        ['Сообщения', '11'],
        ['Дедлайны', '4'],
        ['Просмотры', '38'],
      ],
      tags: ['#режиссёр', '#полныйметр', '#сериал', '#маяк', '#фондкино', '#ири', '#кинопоиск'],
      tip: 'На питче ИРИ первые 30 секунд = логлайн + платформа + тон. Бюджет и команда — на 2-м слайде, референсы — не дольше 20 секунд.',
    },

    actor: {
      label: 'Актёр',
      progressHint: '+ фото и showreel → 92%',
      availability: 'Открыт к предложениям',
      viewsLabel: 'просмотров за неделю',
      statusTitle: 'Статус откликов',
      statusFooter: 'Все отклики →',
      status: [
        { dot: 'blue', strong: '2', line: 'на рассмотрении', sub: '«Тихий январь», реклама Trace' },
        { dot: 'green', strong: '1', line: 'приглашение на пробы', sub: 'Студия Окно · 14 июня' },
        { dot: 'gray', strong: '4', line: 'черновика отклика', sub: 'Закончите до дедлайна' },
      ],
      links: [
        ['Мои отклики', '7'],
        ['Сохранённые', '12'],
        ['Черновики', '2'],
        ['Подписки', '124'],
        ['Мой профиль', null, 'profile.html'],
        ['Уведомления', null],
      ],
      urgentTitle: 'Срочные кастинги',
      urgentFooter: 'Все срочные →',
      urgent: [
        ['Главная · «Тихий январь»', 'Sreda · Кинопоиск · до 6 июня'],
        ['Главный · сериал START', 'Yellow Black White · до 8 июня'],
        ['Эпизод · «Дайте Иванова 3»', 'KION · до 12 июня'],
      ],
      events: [
        ['10', 'июн', 'Мастер-класс: самопроба для платформ', 'Онлайн · кастинг-директора Кинопоиска', '2026-06-10', false],
        ['18', 'июн', 'Премия «Золотой орёл» · номинации', 'Москва', '2026-06-18', false],
        ['1', 'окт', 'Фестиваль «Маяк»', 'Геленджик · открытие сезона', '2026-10-01', true],
      ],
      peopleTitle: 'Рекомендуем познакомиться',
      people: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', meta: 'Продюсер · Trace Films' },
        { img: IMG + 'avatar-02.png', name: 'Анна Лебедева', meta: 'Кастинг-директор' },
        { initials: 'СО', bg: '#3D5C4A', name: 'Студия Окно', meta: 'Док · набирает команду' },
      ],
      today: [
        ['Дедлайны', '5'],
        ['Сообщения', '3'],
        ['Новые кастинги', '8'],
        ['Просмотры профиля', '2'],
      ],
      tags: ['#полныйметр', '#сериалы', '#драма', '#кинопоиск', '#kion', '#okko', '#start', '#самопроба'],
      tip: 'Платформы (Кинопоиск, Okko, START, KION, Wink) хотят слейт по стандарту: имя, рост, агентство, проект, дата. Без слейта самопробу не открывают. Вертикальный кадр, звук без музыки, первый план.',
    },

    gaffer: {
      label: 'Гафер',
      progressHint: '+ схемы света и референсы → 85%',
      availability: 'Доступен со 2 июля',
      viewsLabel: 'запросов ставки за неделю',
      statusTitle: 'Ваши заявки на смены',
      statusFooter: 'Все заявки →',
      status: [
        { dot: 'blue', strong: '3', line: 'ожидают ответа', sub: '«Тихий январь», реклама, док' },
        { dot: 'green', strong: '1', line: 'подтверждена смена', sub: 'Trace Films · 8–12 июня' },
        { dot: 'gray', strong: '2', line: 'черновика КП', sub: 'Отправьте до дедлайна' },
      ],
      links: [
        ['Мои заявки', '5'],
        ['Сохранённые вакансии', '9'],
        ['Калькулятор смен', null],
        ['Аренда света', null],
        ['Мой профиль', null, 'profile.html'],
      ],
      urgentTitle: 'Срочные вакансии · свет',
      urgentFooter: 'Все вакансии →',
      urgent: [
        ['Гафер · полный метр для Кинопоиска', 'Sreda · 38 ₽ тыс/смена · старт 3 июня'],
        ['Best boy · реклама', 'Trace Films · 32 ₽ тыс/смена · 2 смены'],
        ['Гафер · сериал START', 'Yellow Black White · до 28 мая'],
      ],
      events: [
        ['5', 'июн', 'Воркшоп: LED для павильона', 'Cinelab Rentals · Москва', '2026-06-05', false],
        ['12', 'июн', 'Разбор схем: ночная натура', 'Онлайн · 2 ч', '2026-06-12', false],
        ['1', 'окт', 'Маяк · мастерская G&E', 'Геленджик · закрытое', '2026-10-01', true],
      ],
      peopleTitle: 'Команды рядом с вами',
      people: [
        { img: IMG + 'avatar-04.png', name: 'Sreda Production', meta: 'Кинопоиск · ищет гафера' },
        { initials: 'ДК', bg: '#4A3D5C', name: 'Дмитрий Карпов', meta: 'DOP · «После шторма»' },
        { initials: 'CL', bg: '#2c2c2b', name: 'Cinelab Rentals', meta: 'Партнёр · KADR15 −15%' },
      ],
      today: [
        ['Новые вакансии', '11'],
        ['Сообщения', '2'],
        ['Дедлайны КП', '3'],
        ['Просмотры портфолио', '6'],
      ],
      tags: ['#гафер', '#свет', '#натура', '#павильон', '#сериал', '#кинопоиск', '#start'],
      tip: 'В заявке: схема (ключ + заполняющий), список приборов с потреблением, смены без переработок. Продюсеры платформ требуют PDF с референсами кадра — Telegram-фото уже не принимают.',
    },

    costume: {
      label: 'Костюмер',
      progressHint: '+ lookbook и размерная сетка → 88%',
      availability: 'В проекте до 20 июня',
      viewsLabel: 'приглашений в команду',
      statusTitle: 'Статус проектов',
      statusFooter: 'Все проекты →',
      status: [
        { dot: 'green', strong: '1', line: 'активный проект', sub: '«Комната 14» · 8 смен' },
        { dot: 'blue', strong: '2', line: 'запроса на оценку', sub: 'Сериал, реклама' },
        { dot: 'gray', strong: '1', line: 'черновик сметы', sub: 'Док · Студия Окно' },
      ],
      links: [
        ['Мои проекты', '3'],
        ['Сохранённые', '7'],
        ['База поставщиков', null],
        ['Календарь примерок', null],
        ['Мой профиль', null, 'profile.html'],
      ],
      urgentTitle: 'Срочные вакансии · костюм',
      urgentFooter: 'Все →',
      urgent: [
        ['Художник по костюму · сериал KION', '«Дайте Иванова 3» · 20 эп. · 220 ₽ тыс/эп.'],
        ['Костюмер · period-драма', '«Комната 14» · 28 ₽ тыс/смена · до 30 мая'],
        ['Художник по костюму · реклама', 'Trace Films · 2 смены · Москва'],
      ],
      events: [
        ['8', 'июн', 'Ярмарка тканей для кино', 'Москва · CEK', '2026-06-08', false],
        ['15', 'июн', 'Разбор: костюм vs характер', 'Онлайн · кастинг-директора Кинопоиска', '2026-06-15', false],
        ['1', 'июл', 'Старт сериала «Окно»', 'Казань · KION · 4 недели', '2026-07-01', true],
      ],
      peopleTitle: 'Режиссёры и продюсеры',
      people: [
        { img: IMG + 'avatar-02.png', name: 'Анна Лебедева', meta: 'Кастинг · «Комната 14»' },
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', meta: 'Продюсер · Trace Films · Okko' },
        { initials: 'YBW', bg: '#5C4A45', name: 'Yellow Black White', meta: 'Сериал START · ищет ассистента' },
      ],
      today: [
        ['Примерки', '2'],
        ['Сообщения', '4'],
        ['Новые вакансии', '6'],
        ['Запросы сметы', '1'],
      ],
      tags: ['#костюм', '#period', '#сериал', '#kion', '#start', '#кинопоиск', '#примерка'],
      tip: 'Платформы требуют lookbook на каждого героя + таблицу размеров (бюст/талия/бёдра/обувь). Без таблицы примерки занимают на 2 дня дольше — это прямой убыток продакшна.',
    },

    producer: {
      label: 'Продюсер',
      progressHint: '+ бюджет и команда → 70%',
      availability: 'Набирает команду',
      viewsLabel: 'откликов на вакансии',
      statusTitle: 'Ваши публикации',
      statusFooter: 'Все объекты →',
      status: [
        { dot: 'green', strong: '2', line: 'активных кастинга', sub: '47 откликов за 24 ч' },
        { dot: 'blue', strong: '1', line: 'проект в препроде', sub: '«Тихий январь»' },
        { dot: 'gray', strong: '3', line: 'черновика', sub: 'Кастинг, вакансия, проект' },
      ],
      links: [
        ['Мои кастинги', '2'],
        ['Отклики', '47'],
        ['Команда проекта', null],
        ['Аналитика', null],
        ['Мой профиль', null, 'profile.html'],
      ],
      urgentTitle: 'Требует внимания',
      urgentFooter: 'Все задачи →',
      urgent: [
        ['12 откликов без ответа', '«Тихий январь» · Кинопоиск · 3 дня'],
        ['Дедлайн питчинга ИРИ', 'Сериал «Поле» · 15 июня'],
        ['Согласование бюджета с Okko', '«После шторма» · 145 ₽ млн'],
      ],
      events: [
        ['14', 'июн', 'Питчинг сериалов · ИРИ', 'Москва · слот 16:00', '2026-06-14', false],
        ['20', 'июн', 'Контентный рынок · Okko', 'Москва · закрытое', '2026-06-20', false],
        ['1', 'окт', 'Фестиваль «Маяк» · индустрия', 'Геленджик · кинорынок', '2026-10-01', true],
      ],
      peopleTitle: 'Кандидаты на этой неделе',
      people: [
        { img: 'assets/actors/vzmetnev-avatar.jpg', name: 'Александр Взметнев', meta: 'Актёр · драма, криминал' },
        { img: IMG + 'avatar-04.png', name: 'Дмитрий Карпов', meta: 'Оператор-пост · 8 лет' },
        { initials: 'МК', bg: '#5C4A45', name: 'Мария Коваль', meta: 'Актриса · «Слово пацана 2»' },
      ],
      today: [
        ['Новые отклики', '12'],
        ['Сообщения', '8'],
        ['Дедлайны', '4'],
        ['Просмотры вакансий', '156'],
      ],
      tags: ['#продюсер', '#кинопоиск', '#okko', '#start', '#kion', '#ири', '#фондкино', '#маяк'],
      tip: 'Платформы (Кинопоиск, Okko, START, KION, Wink) запрашивают пакет за 72 часа: логлайн + сценарий + бюджет + календарь + ключевая команда. Если у вас этого нет — питч не дойдёт до greenlight-комитета.',
    },

    dop: {
      label: 'Оператор-постановщик',
      progressHint: '+ showreel и техкарта → 90%',
      availability: 'Свободен с 1 июля',
      viewsLabel: 'просмотров showreel',
      statusTitle: 'Ваши проекты',
      statusFooter: 'Все проекты →',
      status: [
        { dot: 'green', strong: '1', line: 'на смене', sub: '«После шторма» · 12 смен' },
        { dot: 'blue', strong: '2', line: 'на согласовании', sub: 'Полный метр, реклама' },
        { dot: 'gray', strong: '3', line: 'обсуждения', sub: 'Сериалы и док' },
      ],
      links: [
        ['Showreel', '12'],
        ['Техкарта', null],
        ['Дневная ставка', null],
        ['Экспедиции', '4'],
        ['Мой профиль', null, 'profile-dop.html'],
      ],
      urgentTitle: 'Срочные вакансии',
      urgentFooter: 'Все →',
      urgent: [
        ['DOP · сериал KION', 'Студия Окно · 850 ₽ тыс / серия'],
        ['DOP · реклама премиум', 'Trace Films · 280 ₽ тыс / смена'],
        ['Второй оператор · клип', 'Москва · 95 ₽ тыс / смена · до 28 мая'],
      ],
      events: [
        ['5', 'июн', 'ARRI Alexa 35 · демо новой прошивки', 'Cinelab · Москва', '2026-06-05', false],
        ['12', 'июн', 'Воркшоп: ночная натура', 'Онлайн · 2 ч', '2026-06-12', false],
        ['1', 'окт', 'Фестиваль «Маяк»', 'Геленджик · конкурс DOP', '2026-10-01', true],
      ],
      peopleTitle: 'Режиссёры и продюсеры',
      people: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', meta: 'Продюсер · Trace Films · Okko' },
        { initials: 'АБ', bg: '#4A3D5C', name: 'Анна Белова', meta: 'Режиссёр · «Тихий январь»' },
        { initials: 'СО', bg: '#3D5C4A', name: 'Студия Окно', meta: 'Док для KION · ищет DOP' },
      ],
      today: [
        ['Новые вакансии', '7'],
        ['Сообщения', '4'],
        ['Заявки на ставку', '3'],
        ['Просмотры reel', '24'],
      ],
      tags: ['#оператор', '#dop', '#alexa35', '#venice2', '#полныйметр', '#сериал', '#kion', '#okko'],
      tip: 'Платформы (Кинопоиск, KION, Okko) ждут showreel ≤ 90 секунд + spec-таблицу: камера, оптика, форматы, дни/локации. Если reel длиннее — продюсер бросит на 60-й секунде.',
    },

    screenwriter: {
      label: 'Сценарист',
      progressHint: '+ логлайны и заявки → 82%',
      availability: 'Открыт к коллабам',
      viewsLabel: 'просмотров сценариев',
      statusTitle: 'Ваши проекты',
      statusFooter: 'Все сценарии →',
      status: [
        { dot: 'green', strong: '1', line: 'в производстве', sub: '«Тихий январь» · 3 драфт' },
        { dot: 'blue', strong: '2', line: 'на согласовании', sub: 'Sreda, Trace Films' },
        { dot: 'gray', strong: '4', line: 'питчинг', sub: 'Заявки в работе' },
      ],
      links: [
        ['Мои сценарии', '7'],
        ['Логлайны', '14'],
        ['Питч-деки', '5'],
        ['Заявки на гранты', '2'],
        ['Мой профиль', null, '#'],
      ],
      urgentTitle: 'Открытые заявки',
      urgentFooter: 'Все →',
      urgent: [
        ['Сценарист · сериал START', 'Yellow Black White · до 10 июня'],
        ['Соавтор · полный метр для Кинопоиска', 'Sreda · 8 эпизодов'],
        ['Адаптация романа · сериал Okko', 'Trace Films · до 1 июля'],
      ],
      events: [
        ['10', 'июн', 'Мастер-класс: структура сериала для платформ', 'Высшая школа сценаристов · онлайн', '2026-06-10', false],
        ['14', 'июн', 'Питчинг ИРИ · сериалы', 'Москва · слоты сценаристов', '2026-06-14', false],
        ['30', 'июн', 'Дедлайн: Фонд кино + Минкульт', 'Заявка на разработку', '2026-06-30', true],
      ],
      peopleTitle: 'Продюсеры в поиске',
      people: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', meta: 'Trace Films · для Okko' },
        { img: IMG + 'avatar-04.png', name: 'Sreda Production', meta: 'Для Кинопоиска · полный метр' },
        { initials: 'YBW', bg: '#5C4A45', name: 'Yellow Black White', meta: 'Сериал для START' },
      ],
      today: [
        ['Запросы на сценарии', '3'],
        ['Сообщения', '6'],
        ['Дедлайны заявок', '2'],
        ['Просмотры логлайнов', '41'],
      ],
      tags: ['#сценарист', '#сериал', '#кинопоиск', '#start', '#okko', '#kion', '#ири', '#фондкино'],
      tip: 'Платформы хотят bible-документ (16–24 стр) до сценария: герои, сезон-арки, тон, референсы. Без bible Кинопоиск и Okko даже не запускают чтение пилота.',
    },

    editor: {
      label: 'Монтажёр',
      progressHint: '+ showreel и инструменты → 86%',
      availability: 'Свободен со 2 июля',
      viewsLabel: 'просмотров showreel',
      statusTitle: 'Ваши проекты',
      statusFooter: 'Все проекты →',
      status: [
        { dot: 'green', strong: '1', line: 'в монтаже', sub: '«После шторма» · 2-я сборка' },
        { dot: 'blue', strong: '2', line: 'на согласовании', sub: 'Реклама, док' },
        { dot: 'gray', strong: '1', line: 'черновик КП', sub: 'Сериал · 6 серий' },
      ],
      links: [
        ['Showreel', '8'],
        ['Калькулятор смен', null],
        ['Проекты', '12'],
        ['DaVinci пресеты', '24'],
        ['Мой профиль', null, '#'],
      ],
      urgentTitle: 'Срочные вакансии',
      urgentFooter: 'Все →',
      urgent: [
        ['Монтажёр · сериал START', 'Yellow Black White · 8 эп. · 180 ₽ тыс / серия'],
        ['Эдитор · док-сериал KION', 'Студия Окно · 6 эпизодов'],
        ['Ассистент монтажа · полный метр', 'Sreda · Кинопоиск · 4 недели'],
      ],
      events: [
        ['10', 'июн', 'DaVinci Resolve · с нуля до Pro', 'Московская школа кино · старт', '2026-06-10', false],
        ['15', 'июн', 'Премонт «После шторма»', 'Trace Films · превью для Okko', '2026-06-15', false],
        ['1', 'окт', 'Фестиваль «Маяк» · монтажёрский клуб', 'Геленджик', '2026-10-01', true],
      ],
      peopleTitle: 'Режиссёры и продюсеры',
      people: [
        { img: IMG + 'avatar-01.png', name: 'Ксения Воронина', meta: 'Trace Films · Okko' },
        { initials: 'АБ', bg: '#4A3D5C', name: 'Анна Белова', meta: 'Режиссёр · «Тихий январь»' },
        { initials: 'АС', bg: '#5C5340', name: 'Артём Сухов', meta: '«Слово пацана» · куратор' },
      ],
      today: [
        ['Новые вакансии', '5'],
        ['Сообщения', '3'],
        ['Дедлайны сборок', '2'],
        ['Просмотры showreel', '18'],
      ],
      tags: ['#монтаж', '#davinci', '#сериал', '#кинопоиск', '#okko', '#start', '#kion', '#трейлер'],
      tip: 'Платформы (Кинопоиск, Okko, START, KION) запрашивают тех. чек: 25 fps 1080p ProRes 422 HQ + DCP для проката + Atmos-микс. Без чек-листа сборку отправят на доработку.',
    },

    sound: {
      label: 'Звукорежиссёр',
      progressHint: '+ демо и оборудование → 84%',
      availability: 'Доступен с 15 июня',
      viewsLabel: 'прослушиваний демо',
      statusTitle: 'Ваши смены',
      statusFooter: 'Все смены →',
      status: [
        { dot: 'green', strong: '2', line: 'смены подтверждены', sub: 'Sreda · 8 и 12 июня' },
        { dot: 'blue', strong: '3', line: 'обсуждение', sub: 'Реклама, док, сериал' },
        { dot: 'gray', strong: '1', line: 'черновик КП', sub: 'Полный метр · Trace' },
      ],
      links: [
        ['Демо-записи', '6'],
        ['Аренда оборудования', null],
        ['Калькулятор смен', null],
        ['Постпрод', '3'],
        ['Мой профиль', null, '#'],
      ],
      urgentTitle: 'Срочные вакансии',
      urgentFooter: 'Все →',
      urgent: [
        ['Звукорежиссёр на смене · KION', 'Студия Окно · 38 ₽ тыс / смена · до 12 июня'],
        ['Микс Atmos · полный метр', 'Trace Films · Okko · 3 недели'],
        ['Sound design · сериал', 'Sreda · 8 эпизодов · до 28 мая'],
      ],
      events: [
        ['7', 'июн', 'Dolby Atmos для кино · мастер-класс', 'Mosfilm Sound · Москва', '2026-06-07', false],
        ['14', 'июн', 'Запись «Тихий январь»', 'Мурманск · экспедиция 18 дней', '2026-06-14', false],
        ['20', 'июн', 'Микс-сессия «После шторма»', 'Mosfilm Sound · превью для Okko', '2026-06-20', true],
      ],
      peopleTitle: 'Команды и студии',
      people: [
        { initials: 'MS', bg: '#2c2c2b', name: 'Mosfilm Sound', meta: 'Партнёр · Atmos · −20%' },
        { img: IMG + 'avatar-04.png', name: 'Sreda Production', meta: 'Кинопоиск · ищет звук' },
        { initials: 'СО', bg: '#3D5C4A', name: 'Студия Окно', meta: 'KION · 6 серий' },
      ],
      today: [
        ['Новые вакансии', '6'],
        ['Сообщения', '2'],
        ['Заявки на смены', '3'],
        ['Прослушиваний', '12'],
      ],
      tags: ['#звук', '#atmos', '#kion', '#okko', '#кинопоиск', '#mosfilm', '#микс', '#adr'],
      tip: 'Платформы (Okko, Кинопоиск) требуют Atmos 7.1.4 для премиум-релизов и 5.1 + стерео-down-mix для платформы. Wild-track 30 секунд тишины с площадки экономит 60–70% работы ADR.',
    },

    casting: {
      label: 'Кастинг-директор',
      progressHint: '+ база актёров и проекты → 87%',
      availability: 'Открыт к проектам',
      viewsLabel: 'просмотров базы',
      statusTitle: 'Активные кастинги',
      statusFooter: 'Все кастинги →',
      status: [
        { dot: 'green', strong: '3', line: 'кастинга в работе', sub: '142 + 38 + 19 откликов' },
        { dot: 'blue', strong: '12', line: 'самопроб на просмотре', sub: '«Тихий январь»' },
        { dot: 'gray', strong: '4', line: 'черновика брифа', sub: 'Готовлю к публикации' },
      ],
      links: [
        ['Мои кастинги', '3'],
        ['База актёров', '4 280'],
        ['Самопробы', '47'],
        ['Чек доступности', null, 'avail.html'],
        ['Мой профиль', null, 'profile-casting.html'],
      ],
      urgentTitle: 'Требует внимания',
      urgentFooter: 'Все задачи →',
      urgent: [
        ['28 самопроб без ответа', '«Тихий январь» · 2 дня'],
        ['Дедлайн отбора', 'Оператор · завтра'],
        ['Согласовать шорт-лист', 'Sreda · до пятницы'],
      ],
      events: [
        ['10', 'июн', 'Мастер-класс: самопроба для платформ', 'Онлайн · CD Кинопоиска · 90 мин', '2026-06-10', false],
        ['14', 'июн', 'Очные пробы «Тихий январь»', 'Москва · студия Sreda', '2026-06-14', false],
        ['20', 'июн', 'Союз кастинг-директоров · ежегодная встреча', 'Москва · закрытое', '2026-06-20', true],
      ],
      peopleTitle: 'Актёры на этой неделе',
      people: [
        { img: 'assets/actors/vzmetnev-avatar.jpg', name: 'Александр Взметнев', meta: 'Драма, криминал · «Мажор», «Любовь СССР»' },
        { initials: 'МК', bg: '#5C4A45', name: 'Мария Коваль', meta: '«Слово пацана 2» · START' },
        { initials: 'АП', bg: '#4A3D5C', name: 'Анна Прокопьева', meta: 'KION · «Дайте Иванова 3»' },
      ],
      today: [
        ['Новые самопробы', '23'],
        ['Сообщения', '14'],
        ['Дедлайны', '3'],
        ['Просмотры брифов', '218'],
      ],
      tags: ['#кастинг', '#самопроба', '#сериал', '#кинопоиск', '#start', '#okko', '#kion', '#availcheck'],
      tip: 'Платформы (START, Кинопоиск, Okko, KION, Wink) требуют слейт по стандарту платформы. У каждой свой шаблон. Avail check за 48 часов до проб экономит 1–2 смены.',
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
    return {
      profession,
      name: b.getAttribute('data-user-name') || 'Александр Взметнев',
      city: b.getAttribute('data-user-city') || 'Москва',
      avatar: b.getAttribute('data-user-avatar') || 'assets/actors/vzmetnev-avatar.jpg',
      complete: Number(b.getAttribute('data-profile-complete') || 78),
      views: Number(b.getAttribute('data-profile-views') || 12),
      profileHref: b.getAttribute('data-page') === 'profile' ? '#' : 'profile.html',
    };
  }

  function panelProfile(user, cfg) {
    return `<section class="rail-panel rail-panel--profile">
      <h3 class="rail-panel__title">Ваш профиль</h3>
      <a href="${user.profileHref}" class="rail-profile">
        <img src="${user.avatar}" alt="" class="rail-profile__ava" width="44" height="44" />
        <div class="rail-profile__info">
          <span class="rail-profile__name">${esc(user.name)}</span>
          <span class="rail-profile__role">${esc(cfg.label)} · ${esc(user.city)}</span>
        </div>
      </a>
      <div class="rail-progress">
        <div class="rail-progress__row"><span>Заполненность</span><strong>${user.complete}%</strong></div>
        <div class="rail-progress__bar"><span style="width:${user.complete}%"></span></div>
        <a href="${user.profileHref}" class="rail-progress__hint">${esc(cfg.progressHint)}</a>
      </div>
      <div class="rail-profile__stats">
        <div class="rail-mini-stat"><strong>${user.views}</strong><span>${esc(cfg.viewsLabel)}</span></div>
        <div class="rail-mini-stat rail-mini-stat--live">
          <span class="rail-dot rail-dot--green"></span><span>${esc(cfg.availability)}</span>
        </div>
      </div>
    </section>`;
  }

  function panelStatus(cfg) {
    const items = cfg.status
      .map(
        (s) => `<li>
          <span class="rail-dot rail-dot--${s.dot}"></span>
          <div class="rail-status-list__text">
            <strong>${esc(s.strong)}</strong> ${esc(s.line)}
            <span>${esc(s.sub)}</span>
          </div>
        </li>`
      )
      .join('');
    return `<section class="rail-panel">
      <h3 class="rail-panel__title">${esc(cfg.statusTitle)}</h3>
      <ul class="rail-status-list">${items}</ul>
      <a href="#" class="hub-block__link rail-panel__footer-link">${esc(cfg.statusFooter)}</a>
    </section>`;
  }

  function panelLinks(cfg) {
    const links = cfg.links
      .map(([label, badge, href]) => {
        const h = href || '#';
        const b = badge ? `<span class="rail-link__badge">${badge}</span>` : '';
        return `<a href="${h}" class="rail-link">${esc(label)} ${b}</a>`;
      })
      .join('');
    return `<section class="rail-panel">
      <h3 class="rail-panel__title">Быстрые ссылки</h3>
      <div class="rail-links">${links}</div>
    </section>`;
  }

  function panelUrgent(cfg) {
    const items = cfg.urgent
      .map(
        ([title, meta]) => `<a href="#" class="rail-urgent">
          <span class="rail-urgent__title">${esc(title)}</span>
          <span class="rail-urgent__meta">${esc(meta)}</span>
        </a>`
      )
      .join('');
    return `<section class="rail-panel rail-panel--flush">
      <h3 class="rail-panel__title rail-panel__title--inset">${esc(cfg.urgentTitle)}</h3>
      ${items}
      <a href="#" class="hub-block__link rail-panel__footer-link">${esc(cfg.urgentFooter)}</a>
    </section>`;
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

  function panelPeople(cfg) {
    const items = cfg.people
      .map((p) => {
        const ava = p.img
          ? `<img src="${p.img}" alt="" class="rail-person__ava" width="36" height="36" loading="lazy" />`
          : `<span class="rail-person__ava rail-person__ava--initials" style="background:${p.bg}">${esc(p.initials)}</span>`;
        return `<div class="rail-person">${ava}
          <div class="rail-person__info">
            <span class="rail-person__name">${esc(p.name)}</span>
            <span class="rail-person__meta">${esc(p.meta)}</span>
          </div>
          <button type="button" class="rail-person__btn" title="Связаться">+</button>
        </div>`;
      })
      .join('');
    return `<section class="rail-panel">
      <h3 class="rail-panel__title">${esc(cfg.peopleTitle)}</h3>
      <div class="rail-people">${items}</div>
    </section>`;
  }

  function panelToday(cfg) {
    const links = cfg.today
      .map(([label, badge]) => `<a href="#" class="rail-link">${esc(label)} <span class="rail-link__badge">${badge}</span></a>`)
      .join('');
    return `<section class="rail-panel">
      <h3 class="rail-panel__title">Сегодня</h3>
      <div class="rail-links">${links}</div>
    </section>`;
  }

  function panelTags(cfg) {
    const tags = cfg.tags.map((t) => `<a href="#" class="rail-tag">${esc(t)}</a>`).join('');
    return `<section class="rail-panel">
      <h3 class="rail-panel__title">Тренды недели</h3>
      <div class="rail-tags">${tags}</div>
    </section>`;
  }

  function panelTip(cfg) {
    return `<section class="rail-panel rail-panel--tip">
      <h3 class="rail-panel__title">Совет дня</h3>
      <p class="rail-tip">${esc(cfg.tip)}</p>
      <button type="button" class="rail-tip__more">Ещё советы</button>
    </section>`;
  }

  function panelAdSlot() {
    return '<section id="right-rail-ad" class="rail-panel rail-panel--ad widget"></section>';
  }

  function mountAdRotator() {
    const root = document.getElementById('right-rail-ad');
    if (!root) return;
    let idx = 0;
    function paint() {
      const ad = ADS[idx % ADS.length];
      root.innerHTML = `
        <h3 class="rail-panel__title">Партнёры</h3>
        <a href="#" class="rail-ad">
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

    const user = readUser();
    const cfg = BY_PROFESSION[user.profession] || BY_PROFESSION.actor;
    const isHub = document.body.getAttribute('data-layout') === 'hub';

    root.classList.toggle('app-right-rail--sheet', isHub);

    root.setAttribute('aria-label', `Панель · ${cfg.label}`);
    root.innerHTML = [
      panelProfile(user, cfg),
      panelStatus(cfg),
      panelLinks(cfg),
      panelUrgent(cfg),
      panelEvents(cfg),
      panelPeople(cfg),
      panelToday(cfg),
      panelTags(cfg),
      panelTip(cfg),
      panelAdSlot(),
    ].join('');

    mountAdRotator();
  }

  document.addEventListener('DOMContentLoaded', mount);
  window.KadrRail = { mount, BY_PROFESSION, readUser };
})();

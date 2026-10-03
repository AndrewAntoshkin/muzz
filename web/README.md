# Кадр — каталог и профили

Next.js (App Router) + Postgres (Drizzle). Каталог `/faces` и анкеты `/people/[slug]` читают из базы. Статические HTML-экраны (главная, кастинги, сообщения) остаются в корне репозитория.

## Локально

Нужны Node 20+ и Docker (или Neon).

```bash
cd web
cp .env.example .env.local
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Открыть [http://localhost:3000/faces](http://localhost:3000/faces).

Без Docker — Neon connection string в `DATABASE_URL`, либо локальный Postgres (`brew services start postgresql@16`, пользователь/база `kadr`). Дальше те же `db:migrate` / `db:seed`.

## Обогащение с akter1.ru

Пачками по 10–15 карточек тянет дату рождения, агента, Кинопоиск / Vimeo / kino-teatr и фото. Пишет только то, что есть на странице агентства.

```bash
npm run db:enrich -- --limit 12 --offset 0
npm run db:enrich -- --all
```

## Auth + роли

Два слоя, их нельзя смешивать:

- **Доступ** (`users.access`): `admin` или `user`. Админ видит `/admin` и может переключать вид интерфейса.
- **Вид** (`users.role`): `actor` | `casting` | `agent`. Это продуктовая оболочка, не права. Режиссёра / продюсера добавим сюда же позже.

Регистрация создаёт `access=user` и выбранный вид. Пароль генерируется и показывается один раз.

Админ: `andrew` / `CadrShow26` (кнопка на `/auth`). Чаты и отклики демо-админа пока в браузере (`is_demo`). Обычные аккаунты пишут друг другу через Postgres (`users` + `chat_*`).

Тестовые аккаунты после `npm run db:seed-auth`:

| Логин | Пароль | Доступ | Вид |
|---|---|---|---|
| `andrew` | `CadrShow26` | админ | актёр + переключатель |
| `demo` | `CadrShow26` | админ | то же (алиас) |
| `anna.kevorkova` | `demo` | пользователь | кастинг-директор |
| `natalya.gneusheva` | `demo` | пользователь | агент |
| `irina.soykina` | `demo` | пользователь | агент |

Нужен `AUTH_SECRET` в env. На Vercel добавьте его в Project → Environment Variables, затем `db:migrate` и `db:seed-auth` против Neon.

## База

Postgres (Neon в проде, Docker локально) — это и есть основная БД. Сейчас в ней каталог, аккаунты, чаты и метаданные файлов. Проекты, кастинги и отклики ещё в `localStorage` демо — следующий шаг перенести их в те же таблицы.

## Файлы

Бинарники **не** в Postgres. Метаданные — таблица `files`, байты — диск локально или Cloudflare R2.

- Сообщения: скрепка, шоурил до **200 МБ**. Браузер льёт файл напрямую (presigned PUT на R2, локально — `/api/files/:id/upload`).
- Локально без R2 файлы пишутся в `web/.data/uploads` (не коммитится).
- Прод: бакет R2 + `R2_*` в env. CORS: разрешить PUT с домена Кадра. Публичный доступ или custom domain → `R2_PUBLIC_BASE_URL`.

Цена R2: ~$0.015/ГБ хранение, отдача $0.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | копирует ассеты и поднимает Next |
| `npm run db:migrate` | применяет SQL из `drizzle/` |
| `npm run db:seed` | 78 человек с akter1 + Взметнев и команда |
| `npm run db:enrich` | дописывает поля с akter1.ru |

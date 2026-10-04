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

Демо-админ `andrew` (публичный пароль) работает **только локально**. В проде демо-вход выключен, пока не задан `ALLOW_DEMO_LOGIN=1`. Настоящего админа создайте так:

```bash
ADMIN_LOGIN=ivan ADMIN_PASSWORD='длинный-пароль-от-12-символов' npm run db:create-admin
```

Чаты и отклики демо-админа пока в браузере (`is_demo`). Обычные аккаунты пишут друг другу через Postgres (`users` + `chat_*`).

Тестовые аккаунты после `npm run db:seed-auth`:

| Логин | Пароль | Доступ | Вид |
|---|---|---|---|
| `andrew` | `CadrShow26` | админ | актёр + переключатель |
| `demo` | `CadrShow26` | админ | то же (алиас) |
| `anna.kevorkova` | `demo` | пользователь | кастинг-директор |
| `natalya.gneusheva` | `demo` | пользователь | агент |
| `irina.soykina` | `demo` | пользователь | агент |

`AUTH_SECRET` обязателен в проде (16+ символов): без него приложение не запустится. На Vercel добавьте его в Project → Environment Variables, затем `db:migrate`. `db:seed-auth` создаёт тестовые аккаунты с публичными паролями — в прод их не заливайте.

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

## Запуск под нагрузку (чек-лист)

Перед открытием для тысяч пользователей:

1. **Env на Vercel (Production):** `AUTH_SECRET` (обязательно), `DATABASE_URL` с **pooled**-хостом Neon (`-pooler`), `CRON_SECRET`, ключи Turnstile (`TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`), хранилище (`BLOB_READ_WRITE_TOKEN` или `R2_*`). `ALLOW_DEMO_LOGIN` не задавать.
2. **Миграции:** `npm run db:migrate` — `0005_scale` добавляет индексы, `pg_trgm` для поиска и таблицу `rate_limits`.
3. **Админ:** `npm run db:create-admin`, затем проверьте, что `POST /api/auth/demo` отвечает 404.
4. **Neon:** тариф без scale-to-zero (или `min compute` > 0), достаточный максимум compute, включённый PITR/бэкапы.
5. **Vercel:** тариф Pro (Hobby запрещает коммерческое использование и имеет жёсткие лимиты), регион функций рядом с регионом Neon.
6. **Мониторинг:** аптайм-проверка на `GET /api/health`, алерты Vercel/Neon на ошибки и соединения, Sentry (не подключён).
7. **Нагрузочный тест:** `k6 run loadtest/smoke.js` против staging (см. `loadtest/README.md`).

Аварийно закрыть регистрацию: `REGISTRATION_DISABLED=1` и redeploy.

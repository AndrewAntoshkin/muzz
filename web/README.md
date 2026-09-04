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

## Auth + сообщения

Первый заход → `/auth`: регистрация (имя, фамилия, роль) или вход. Пароль генерируется и показывается один раз.

Демо: кнопка «Войти как демо» или логин `demo` / `demo` — в сайдбаре переключатель ролей. Чаты демо остаются локальными.

Реальные аккаунты пишут друг другу через Neon (`users` + `chat_*`). Написать можно только пользователю с аккаунтом (профиль ↔ `person_slug`).

Тестовые аккаунты после `npm run db:seed-auth`:

| Логин | Пароль | Роль |
|---|---|---|
| `demo` | `demo` | демо + switch ролей |
| `anna.lebedeva` | `demo` | кастинг-директор |
| `anna.kevorkova` | `demo` | агент |

Нужен `AUTH_SECRET` в env (см. `.env.example`). На Vercel добавьте его в Project → Environment Variables, затем `db:migrate` и `db:seed-auth` против Neon.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | копирует ассеты и поднимает Next |
| `npm run db:migrate` | применяет SQL из `drizzle/` |
| `npm run db:seed` | 78 человек с akter1 + Взметнев и команда |
| `npm run db:enrich` | дописывает поля с akter1.ru |

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

## Vercel + Neon

Прод: проект **kadr** на Vercel, Root Directory = `web`, база **kadr-db** (Neon Marketplace).

`DATABASE_URL` и остальные Neon-переменные уже подключены к Production / Preview / Development через интеграцию.

Локально подтянуть env:

```bash
cd web
npx vercel env pull .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

`prebuild` копирует CSS-токены и фото из `../assets` (полный клон репозитория на Vercel это видит).

Сообщения, кастинги, отклики и лента живут в `localStorage` браузера (demo workspace) — на Vercel работают без Postgres. Каталог `/faces` и анкеты `/people/*` читают Neon.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | копирует ассеты и поднимает Next |
| `npm run db:migrate` | применяет SQL из `drizzle/` |
| `npm run db:seed` | 78 человек с akter1 + Взметнев и команда |
| `npm run db:enrich` | дописывает поля с akter1.ru |

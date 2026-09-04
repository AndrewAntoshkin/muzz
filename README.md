# Кадр (muzz)

Платформа «Кадр» — кастинги, проекты, профили.

Каталог и анкеты работают на **Next.js + Postgres** в каталоге [`web/`](web/). Остальные экраны пока статическая вёрстка в корне.

## Каталог и профили (React + Postgres)

```bash
cd web
cp .env.example .env.local
docker compose up -d          # или Neon DATABASE_URL
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Открыть [http://localhost:3000/faces](http://localhost:3000/faces).

Подробности: [`web/README.md`](web/README.md) — Neon (`kadr-db`), обогащение akter1, **Vercel проект `kadr`**, Root Directory = `web`.

Прод Next.js: после push в `main` → Vercel (`*.vercel.app`). Статический HTML по-прежнему на GitHub Pages.

## Статический прототип

```bash
python3 .devserver.py
```

Или `python3 -m http.server 8765`. После push в `main` GitHub Pages публикует HTML:

**https://andrewantoshkin.github.io/muzz/**

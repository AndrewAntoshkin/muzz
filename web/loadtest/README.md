# Нагрузочный тест

Нужен [k6](https://k6.io). Запускать **только против staging** с отдельной базой Neon (ветка).

```bash
k6 run -e BASE_URL=https://staging.example.com loadtest/smoke.js
```

Перед запуском на staging:
- отключите Turnstile (не задавайте `TURNSTILE_SECRET_KEY`);
- rate-limit по IP сработает на одном IP генератора нагрузки — скрипт подставляет разные `x-forwarded-for`,
  но Vercel их перезаписывает. Для честного теста поднимите лимиты на staging или запускайте с нескольких IP.

Что смотреть: p95 ответа < 1.5 с, ошибок < 2%, соединения и CPU в Neon, `EXPLAIN ANALYZE` каталога на 50–100 тыс. анкет.

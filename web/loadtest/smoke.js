// k6 run -e BASE_URL=https://staging.example.com loadtest/smoke.js
// Прогоняет типичный путь: регистрация → каталог → поиск → чаты. Только против staging!
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    signup_burst: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { target: 20, duration: "1m" },
        { target: 50, duration: "3m" },
        { target: 0, duration: "30s" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
  },
};

export default function () {
  const jar = http.cookieJar();
  const name = `Тест${__VU}${__ITER}`;
  // Для нагрузочного теста на staging отключите Turnstile или выдайте тестовый ключ.
  const reg = http.post(
    `${BASE}/api/auth/register`,
    JSON.stringify({ firstName: name, lastName: "Нагрузка", role: "actor" }),
    { headers: { "Content-Type": "application/json", "x-forwarded-for": `10.${__VU % 250}.${__ITER % 250}.1` } },
  );
  check(reg, { "registered": (r) => r.status === 200 });
  if (reg.status !== 200) return;

  const faces = http.get(`${BASE}/api/people?limit=96`);
  check(faces, { "catalog 200": (r) => r.status === 200 });
  const search = http.get(`${BASE}/api/people?q=${encodeURIComponent("ан")}&limit=48`);
  check(search, { "search 200": (r) => r.status === 200 });
  const chats = http.get(`${BASE}/api/chat/threads`);
  check(chats, { "chats 200": (r) => r.status === 200 });
  for (let i = 0; i < 3; i++) {
    http.get(`${BASE}/api/chat/poll`);
    sleep(1);
  }
  jar.clear(BASE);
}

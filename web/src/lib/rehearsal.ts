import type { Casting } from "./productions";
import { rehearsalCap, type PlanId } from "./plans";

export type CueWho = "you" | "them" | "note";

export type CueLine = {
  who: CueWho;
  text: string;
};

const SCRIPTS: Record<string, CueLine[]> = {
  "tihiy-yanvar-second": [
    { who: "note", text: "Кухня · парная" },
    { who: "them", text: "Ты опять не сел. Я уже накрыла." },
    { who: "you", text: "Я слышал. Просто думал — если не садиться, может, само пройдёт." },
    { who: "them", text: "Что пройдёт." },
    { who: "you", text: "Не знаю. Вечер. Этот тон. Как будто мы уже всё сказали и всё равно сидим." },
    { who: "them", text: "Сядь. Пока суп тёплый." },
    { who: "you", text: "Хорошо. Сяду." },
    { who: "note", text: "Школа · короткий конфликт" },
    { who: "them", text: "Родители ждут в коридоре. Ты идёшь?" },
    { who: "you", text: "Скажи, что я задерживаюсь. Не надо давления в последней фразе. Я сам." },
    { who: "them", text: "Они уже третий раз." },
    { who: "you", text: "Я знаю. Просто дай мне минуту без этой комнаты." },
  ],
  "tihiy-yanvar-lead": [
    { who: "note", text: "Учительница · северный город" },
    { who: "them", text: "Марина. Директор уже звонил. Ты сегодня будешь?" },
    { who: "you", text: "Буду. Только не спрашивай, как ночь. Как ночь — никак." },
    { who: "them", text: "Дети заметят." },
    { who: "you", text: "Пусть замечают уроки. Остальное — не их." },
    { who: "you", text: "Если спросят про дочь — скажи, что дома. Я сама." },
  ],
};

export function rehearsalMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function rehearsalsUsed(settings: { rehearsalsUsed?: number; rehearsalsMonth?: string }) {
  return settings.rehearsalsMonth === rehearsalMonthKey() ? settings.rehearsalsUsed ?? 0 : 0;
}

export function rehearsalLeft(plan: PlanId, used: number) {
  const cap = rehearsalCap(plan);
  if (!Number.isFinite(cap)) return Number.POSITIVE_INFINITY;
  return Math.max(0, cap - used);
}

export function rehearsalCues(casting: Casting): CueLine[] {
  const script = SCRIPTS[casting.slug];
  if (script) return script;
  const lines: CueLine[] = [{ who: "note", text: `${casting.roleLabel} · ${casting.title}` }];
  for (const scene of casting.scenes ?? []) {
    lines.push({ who: "note", text: `${scene.title} · ${scene.meta}` });
  }
  const chunks = casting.text
    .split(/[.!?…]+\s+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 12);
  if (chunks.length) {
    chunks.slice(0, 5).forEach((chunk, i) => {
      lines.push({ who: i % 2 === 0 ? "you" : "them", text: chunk });
    });
  } else {
    lines.push(
      { who: "them", text: "Когда будете готовы — начинайте." },
      { who: "you", text: "Готов. Иду от слейта." },
    );
  }
  return lines;
}

export function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.4D001E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export function tapeContainer(mime: string) {
  return /mp4|avc1|quicktime/i.test(mime) ? "mp4" : "webm";
}

export function tapeFileName(mime: string) {
  const ext = tapeContainer(mime);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
  return `kadr-rehearsal-${stamp}.${ext}`;
}

export function formatTapeTime(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

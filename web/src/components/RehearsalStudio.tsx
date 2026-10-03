"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Casting } from "@/lib/productions";
import {
  formatTapeTime,
  pickRecorderMime,
  rehearsalCues,
  tapeContainer,
  tapeFileName,
  type CueLine,
} from "@/lib/rehearsal";

type Phase = "live" | "count" | "record" | "preview";

export type RehearsalActor = {
  name: string;
  city: string;
  height: string;
  agency: string;
};

export function RehearsalStudio({
  casting,
  projectTitle,
  actor,
  left,
  cap,
  canSend,
  onClose,
  onTake,
  onSend,
}: {
  casting: Casting;
  projectTitle?: string;
  actor: RehearsalActor;
  left: number;
  cap: number;
  canSend: boolean;
  onClose: () => void;
  onTake: () => void;
  onSend: (file: File, duration: string) => void | Promise<void>;
}) {
  const cues = rehearsalCues(casting);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const cuesRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const startedAt = useRef(0);
  const [phase, setPhase] = useState<Phase>("live");
  const [count, setCount] = useState(3);
  const [slateOn, setSlateOn] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showSlate, setShowSlate] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mime, setMime] = useState("video/webm");
  const [camReady, setCamReady] = useState(false);
  const [sending, setSending] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let gone = false;
    async function openCam() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!gone) setError("В этом браузере нет камеры. Откройте Кадр в Chrome или Safari.");
        return;
      }
      try {
        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          }),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("timeout")), 10000);
          }),
        ]);
        if (gone) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setCamReady(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (!gone) setError("Нет доступа к камере или микрофону. Разрешите в браузере и откройте репетицию снова.");
      }
    }
    void openCam();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      gone = true;
      document.body.style.overflow = prev;
      recorderRef.current?.state === "recording" && recorderRef.current.stop();
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    if (phase !== "count") return;
    if (count <= 0) {
      startRecording();
      return;
    }
    const t = window.setTimeout(() => setCount((n) => n - 1), 800);
    return () => window.clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "record") return;
    const tick = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 200);
    return () => window.clearInterval(tick);
  }, [phase]);

  useEffect(() => {
    if (phase !== "record" || !slateOn) return;
    setShowSlate(true);
    const t = window.setTimeout(() => setShowSlate(false), 5000);
    return () => window.clearTimeout(t);
  }, [phase, slateOn]);

  useEffect(() => {
    if (phase !== "record" || !autoScroll) return;
    const node = cuesRef.current;
    if (!node) return;
    const id = window.setInterval(() => {
      node.scrollTop += 0.7;
    }, 30);
    return () => window.clearInterval(id);
  }, [phase, autoScroll]);

  function startCountdown() {
    if (!streamRef.current) return;
    setError(null);
    setCount(3);
    setPhase("count");
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream || recorderRef.current?.state === "recording") return;
    const type = pickRecorderMime();
    chunksRef.current = [];
    try {
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      setMime(rec.mimeType || type || "video/webm");
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || type || "video/webm" });
        blobRef.current = blob;
        if (blob.size < 800) {
          setError("Запись пустая. Проверьте камеру и микрофон, затем нажмите Начать.");
          setPhase("live");
          return;
        }
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        onTake();
        setPhase("preview");
      };
      recorderRef.current = rec;
      startedAt.current = Date.now();
      setElapsed(0);
      try {
        rec.start(200);
      } catch {
        rec.start();
      }
      setPhase("record");
    } catch {
      setError("Этот браузер не умеет писать видео. Попробуйте Chrome или Safari.");
      setPhase("live");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function retake() {
    blobRef.current = null;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setShowSlate(false);
    setPhase("live");
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }

  function fileFromBlob() {
    const blob = blobRef.current;
    if (!blob || blob.size < 800) return null;
    const type = blob.type || mime;
    const ext = tapeContainer(type);
    const fileType = ext === "mp4" ? "video/mp4" : /webm/i.test(type) ? "video/webm" : type || "video/webm";
    return new File([blob], tapeFileName(type), { type: fileType });
  }

  async function send() {
    const file = fileFromBlob();
    if (!file || sending) return;
    setSending(true);
    try {
      await onSend(file, formatTapeTime(elapsed));
    } finally {
      setSending(false);
    }
  }

  function saveLocal() {
    const file = fileFromBlob();
    if (!file) return;
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 2000);
  }

  const recording = phase === "record";
  const finite = Number.isFinite(cap) && Number.isFinite(left);

  return createPortal(
    <div className="rehearsal" role="dialog" aria-modal="true" aria-label="Репетиция">
      <div className="rehearsal__bar">
        <div>
          <strong>Репетиция</strong>
          <span>
            {casting.title}
            {projectTitle ? ` · ${projectTitle}` : ""}
          </span>
        </div>
        <span className="rehearsal__quota">
          {finite ? `ещё ${left} из ${cap} в этом месяце` : "безлимит"}
        </span>
        <button type="button" className="rehearsal__close" onClick={onClose} aria-label="Закрыть" disabled={recording}>
          ×
        </button>
      </div>

      <div className="rehearsal__stage">
        <div className="rehearsal__cam">
          {phase === "preview" && blobUrl ? (
            <video ref={previewRef} src={blobUrl} controls playsInline />
          ) : (
            <video ref={videoRef} muted playsInline autoPlay />
          )}
          {phase === "count" ? <div className="rehearsal__count">{count || "запись"}</div> : null}
          {showSlate && recording ? (
            <div className="rehearsal__slate">
              <em>Слейт вслух</em>
              <strong>{actor.name}</strong>
              <span>
                {actor.height} · {actor.city}
              </span>
              <span>{actor.agency}</span>
              <span>
                {projectTitle || casting.title} · {casting.roleLabel}
              </span>
            </div>
          ) : null}
          {recording ? (
            <div className="rehearsal__rec" aria-live="polite">
              <i /> {formatTapeTime(elapsed)}
            </div>
          ) : null}
        </div>

        <div className="rehearsal__cues" ref={cuesRef}>
          {cues.map((line, i) => (
            <Cue key={`${line.who}-${i}`} line={line} />
          ))}
        </div>
      </div>

      {error ? <p className="rehearsal__error">{error}</p> : null}

      <div className="rehearsal__dock">
        {phase !== "preview" ? (
          <>
            <label className="rehearsal__check">
              <input type="checkbox" checked={slateOn} disabled={recording} onChange={(e) => setSlateOn(e.target.checked)} />
              Слейт 5 сек
            </label>
            <label className="rehearsal__check">
              <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
              Автоскролл
            </label>
            {recording ? (
              <button type="button" className="btn-primary" onClick={stopRecording}>
                Стоп
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={startCountdown} disabled={phase === "count" || !camReady}>
                {phase === "count" ? "…" : camReady ? "Начать" : "Камера…"}
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={retake} disabled={sending}>
              Ещё дубль
            </button>
            <button type="button" className="btn-secondary" onClick={saveLocal} disabled={sending}>
              Сохранить {tapeContainer(blobRef.current?.type || mime).toUpperCase()}
            </button>
            {canSend ? (
              <button type="button" className="btn-primary" onClick={() => void send()} disabled={sending}>
                {sending ? "Сохраняю…" : "Отправить в кастинг"}
              </button>
            ) : (
              <span className="rehearsal__quota">Отклик уже ушёл — можно сохранить дубль себе</span>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Cue({ line }: { line: CueLine }) {
  const label = line.who === "you" ? "Вы" : line.who === "them" ? "Партнёр" : "";
  return (
    <p className={`rehearsal__line is-${line.who}`}>
      {label ? <span>{label}</span> : null}
      {line.text}
    </p>
  );
}

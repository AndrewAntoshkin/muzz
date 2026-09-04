"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AVAILABILITY_LABEL,
  type Availability,
} from "@/lib/workspace";
import { useDemoRole } from "./useDemoRole";
import { useWorkspace } from "./useWorkspace";

const OPTIONS: Availability[] = ["open", "busy", "hold"];

export function StatusModal({ onClose }: { onClose: () => void }) {
  const { cfg } = useDemoRole();
  const { publishStatus, pulses } = useWorkspace();
  const mine = pulses.find((p) => p.personSlug === cfg.profile.replace(/^\/people\//, ""));
  const [text, setText] = useState(mine?.text ?? "");
  const [availability, setAvailability] = useState<Availability>(mine?.availability ?? "open");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="proj-settings-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="proj-settings-dialog proj-settings-dialog--sm" onClick={(e) => e.stopPropagation()}>
        <header className="proj-settings-header">
          <div>
            <h2 id="status-modal-title">Статус в выдаче</h2>
            <p>Агенты и кастинг-директора видят это на главной</p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className="proj-settings-content" style={{ padding: "16px 20px" }}>
          <div className="kadr-form">
            <label className="kadr-field">
              <span>Занятость</span>
              <div className="status-avail-chips">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`search-chip${availability === opt ? " is-on" : ""}`}
                    onClick={() => setAvailability(opt)}
                  >
                    {AVAILABILITY_LABEL[opt]}
                  </button>
                ))}
              </div>
            </label>
            <label className="kadr-field">
              <span>Короткий статус</span>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Например: открыт с июля · драма / криминал · экспедиции ok"
                maxLength={280}
              />
            </label>
          </div>
        </div>
        <footer className="proj-settings-footer">
          <p className="proj-settings-hint">Появится в ленте статусов у CD и агентов</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!text.trim()}
              onClick={() => {
                publishStatus(text.trim(), availability);
                onClose();
              }}
            >
              Опубликовать
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

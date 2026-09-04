"use client";

import Link from "next/link";
import { withRole } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";

export default function SettingsPage() {
  const { role, cfg, settings, setSettings, resetDemo } = useWorkspace();

  return (
    <div className="app-main__body">
      <main className="page-area">
        <div className="page-scroll detail-page settings-page">
          <section className="detail-block kadr-form-card">
            <h2 className="detail-block__title">Профиль демо</h2>
            <dl className="detail-kv">
              <dt>Имя</dt>
              <dd>{cfg.name}</dd>
              <dt>Роль</dt>
              <dd>{cfg.label}</dd>
              <dt>Город</dt>
              <dd>{cfg.city}</dd>
            </dl>
            <p className="settings-page__link">
              <Link href={withRole(cfg.profile, role)}>Открыть профиль →</Link>
            </p>
          </section>

          <section className="detail-block kadr-form-card">
            <h2 className="detail-block__title">Уведомления</h2>
            <label className="kadr-check">
              <input
                type="checkbox"
                checked={settings.notifyEmail}
                onChange={(e) => setSettings({ notifyEmail: e.target.checked })}
              />
              Письма об откликах и приглашениях
            </label>
            <label className="kadr-check">
              <input
                type="checkbox"
                checked={settings.notifyPush}
                onChange={(e) => setSettings({ notifyPush: e.target.checked })}
              />
              Пуш в браузере (демо)
            </label>
          </section>

          <section className="detail-block kadr-form-card">
            <h2 className="detail-block__title">Демо-данные</h2>
            <p className="settings-page__hint">Сбросит отклики, сообщения и созданные проекты в этом браузере.</p>
            <button type="button" className="btn-secondary" onClick={resetDemo}>
              Сбросить демо
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { accessLabel, isAdmin } from "@/lib/access";
import { PLAN_META, openPlanModal, parsePlan } from "@/lib/plans";
import { withRole } from "@/lib/roles";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/useWorkspace";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SettingsPage() {
  const { role, cfg, user, logout } = useAuth();
  const { settings, setSettings, resetDemo } = useWorkspace();

  return (
    <div className="app-main__body">
      <main className="page-area">
        <div className="page-scroll detail-page settings-page">
          <section className="detail-block kadr-form-card">
            <h2 className="detail-block__title">{user?.isDemo ? "Профиль демо" : "Аккаунт"}</h2>
            <dl className="detail-kv">
              <dt>Имя</dt>
              <dd>{cfg.name}</dd>
              {user?.login ? (
                <>
                  <dt>Логин</dt>
                  <dd>
                    <code>{user.login}</code>
                  </dd>
                </>
              ) : null}
              <dt>Доступ</dt>
              <dd>{user ? accessLabel(user.access) : "—"}</dd>
              <dt>Вид</dt>
              <dd>{cfg.label}</dd>
              <dt>Город</dt>
              <dd>{cfg.city}</dd>
            </dl>
            <p className="settings-page__link">
              <Link href={withRole(cfg.profile, role)}>Открыть профиль →</Link>
            </p>
            {isAdmin(user) ? (
              <p className="settings-page__link">
                <Link href="/admin">Пользователи →</Link>
              </p>
            ) : null}
            <button type="button" className="btn-secondary" style={{ marginTop: 12 }} onClick={() => void logout()}>
              {user?.isDemo ? "Выйти из демо" : "Выйти"}
            </button>
          </section>

          <section className="detail-block kadr-form-card">
            <h2 className="detail-block__title">Подписка</h2>
            <dl className="detail-kv">
              <dt>План</dt>
              <dd>{PLAN_META[parsePlan(settings.plan)].name}</dd>
              <dt>Статус</dt>
              <dd>{parsePlan(settings.plan) === "standard" ? "Бесплатно" : "до 4 октября"}</dd>
            </dl>
            <p className="settings-page__hint">
              Репетиции, ассистент и письма зависят от тарифа. Смена в демо — сразу, без оплаты.
            </p>
            <button type="button" className="btn-primary" onClick={() => openPlanModal()}>
              Все тарифы
            </button>
          </section>

          <section className="detail-block kadr-form-card">
            <h2 className="detail-block__title">Оформление</h2>
            <ThemeToggle />
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

          {user?.isDemo ? (
            <section className="detail-block kadr-form-card">
              <h2 className="detail-block__title">Демо-данные</h2>
              <p className="settings-page__hint">Сбросит отклики, сообщения и созданные проекты в этом браузере.</p>
              <button type="button" className="btn-secondary" onClick={resetDemo}>
                Сбросить демо
              </button>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

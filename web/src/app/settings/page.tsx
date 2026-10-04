"use client";

import Link from "next/link";
import { useState } from "react";
import { accessLabel, isAdmin } from "@/lib/access";
import { PLAN_META, openPlanModal, parsePlan } from "@/lib/plans";
import { withRole } from "@/lib/roles";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/useWorkspace";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SettingsPage() {
  const { role, cfg, user, logout } = useAuth();
  const { settings, setSettings, resetDemo } = useWorkspace();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

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

          {isAdmin(user) ? (
            <section className="detail-block kadr-form-card">
              <h2 className="detail-block__title">Демо-данные</h2>
              <p className="settings-page__hint">
                Вернёт общий демо-контент (проекты, кастинги, отклики, доску) к исходному для всех демо-аккаунтов. Данные
                настоящих пользователей не затрагиваются.
              </p>
              <button type="button" className="btn-secondary" onClick={() => setConfirmReset(true)}>
                Сбросить демо
              </button>
              {confirmReset ? (
                <ConfirmDialog
                  title="Сбросить демо-данные?"
                  confirmLabel="Сбросить"
                  danger
                  busy={resetting}
                  onCancel={() => setConfirmReset(false)}
                  onConfirm={async () => {
                    setResetting(true);
                    await resetDemo();
                    setResetting(false);
                    setConfirmReset(false);
                  }}
                >
                  Все правки, сделанные в демо-аккаунтах, будут потеряны.
                </ConfirmDialog>
              ) : null}
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

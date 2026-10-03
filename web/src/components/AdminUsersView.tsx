"use client";

import { useCallback, useEffect, useState } from "react";
import { ACCESS_SWITCH, type AccessId } from "@/lib/access";
import { ROLE_SWITCH, type RoleId } from "@/lib/roles";

type AdminUser = {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: RoleId;
  access: AccessId;
  isDemo: boolean;
  personSlug: string | null;
  createdAt: string;
};

export function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/users", { credentials: "include" });
    const data = (await res.json()) as { users?: AdminUser[]; error?: string };
    if (!res.ok) {
      setError(data.error || "Не удалось загрузить");
      return;
    }
    setUsers(data.users || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: { access?: AccessId; role?: RoleId }) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Ошибка");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="app-main__body">
      <main className="page-area">
        <div className="page-scroll detail-page settings-page">
          <section className="detail-block kadr-form-card">
            <h2 className="detail-block__title">Пользователи</h2>
            <p className="settings-page__hint">
              Доступ — кто админ. Вид — актёр, кастинг-директор или агент. Остальные профессии добавим позже.
            </p>
            {error ? <p className="auth-error">{error}</p> : null}
          </section>

          {users.map((row) => (
            <section key={row.id} className="detail-block kadr-form-card">
              <h2 className="detail-block__title">
                {row.firstName} {row.lastName}
              </h2>
              <dl className="detail-kv">
                <dt>Логин</dt>
                <dd>
                  <code>{row.login}</code>
                </dd>
                {row.personSlug ? (
                  <>
                    <dt>Профиль</dt>
                    <dd>
                      <a href={`/people/${row.personSlug}`}>{row.personSlug}</a>
                    </dd>
                  </>
                ) : null}
              </dl>

              <p className="settings-page__hint" style={{ marginTop: 12 }}>
                Доступ
              </p>
              <div className="search-filter__chips">
                {ACCESS_SWITCH.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={row.access === key ? "search-chip is-on" : "search-chip"}
                    aria-pressed={row.access === key}
                    disabled={busyId === row.id}
                    onClick={() => void patch(row.id, { access: key })}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="settings-page__hint" style={{ marginTop: 12 }}>
                Вид
              </p>
              <div className="search-filter__chips">
                {ROLE_SWITCH.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={row.role === key ? "search-chip is-on" : "search-chip"}
                    aria-pressed={row.role === key}
                    disabled={busyId === row.id}
                    onClick={() => void patch(row.id, { role: key })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ROLE_SWITCH, type RoleId } from "@/lib/roles";

type Creds = { login: string; password: string };

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => string;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function useTurnstile(siteKey: string | null, active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState("");
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !active) return;
    let cancelled = false;
    function mount() {
      if (cancelled || !ref.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(ref.current, {
        sitekey: siteKey!,
        callback: (t) => setToken(t),
        "expired-callback": () => setToken(""),
      });
    }
    if (window.turnstile) {
      mount();
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.turnstile = "1";
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      widget.current = null;
    };
  }, [siteKey, active]);

  const reset = () => {
    setToken("");
    if (window.turnstile) window.turnstile.reset(widget.current ?? undefined);
  };
  return { ref, token, reset };
}

export function AuthView({
  demoEnabled = false,
  captchaSiteKey = null,
}: {
  demoEnabled?: boolean;
  captchaSiteKey?: string | null;
}) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [mode, setMode] = useState<"register" | "login">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<RoleId>("actor");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<Creds | null>(null);
  const [website, setWebsite] = useState("");
  const [copied, setCopied] = useState(false);
  const { ref: captchaRef, token: captchaToken, reset: resetCaptcha } = useTurnstile(
    captchaSiteKey,
    mode === "register" && !creds,
  );

  useEffect(() => {
    document.body.setAttribute("data-page", "auth");
  }, []);

  async function enter(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json()) as {
        error?: string;
        login?: string;
        password?: string;
      };
      if (!res.ok) {
        if (captchaSiteKey) resetCaptcha();
        throw new Error(data.error || "Ошибка");
      }
      if (data.login && data.password) {
        setCreds({ login: data.login, password: data.password });
        return;
      }
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <img src="/assets/logo.svg" alt="kadr" width={92} height={44} />
          <p className="auth-card__lead">Кастинги, анкеты и сообщения</p>
        </div>

        {creds ? (
          <div className="auth-creds">
            <h1>Аккаунт создан</h1>
            <p>Сохраните логин и пароль — пароль больше не покажем.</p>
            <dl className="detail-kv">
              <dt>Логин</dt>
              <dd>
                <code>{creds.login}</code>
              </dd>
              <dt>Пароль</dt>
              <dd>
                <code>{creds.password}</code>
              </dd>
            </dl>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(`Логин: ${creds.login}\nПароль: ${creds.password}`)
                  .then(() => setCopied(true));
              }}
            >
              {copied ? "Скопировано" : "Скопировать логин и пароль"}
            </button>
            <button type="button" className="btn-primary" onClick={() => window.location.assign(next)}>
              Войти в Кадр
            </button>
          </div>
        ) : (
          <>
            <div className="search-tabs auth-card__tabs">
              <button
                type="button"
                className={mode === "register" ? "search-tab is-on" : "search-tab"}
                onClick={() => setMode("register")}
              >
                Регистрация
              </button>
              <button
                type="button"
                className={mode === "login" ? "search-tab is-on" : "search-tab"}
                onClick={() => setMode("login")}
              >
                Вход
              </button>
            </div>

            {mode === "register" ? (
              <form
                className="auth-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (captchaSiteKey && !captchaToken) {
                    setError("Подтвердите, что вы не робот");
                    return;
                  }
                  void enter("/api/auth/register", { firstName, lastName, role, captcha: captchaToken, website });
                }}
              >
                <label>
                  Имя
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </label>
                <label>
                  Фамилия
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </label>
                <fieldset className="auth-roles">
                  <legend>Кто вы</legend>
                  <div className="search-filter__chips">
                    {ROLE_SWITCH.map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={role === key ? "search-chip is-on" : "search-chip"}
                        onClick={() => setRole(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                />
                {captchaSiteKey ? <div ref={captchaRef} /> : null}
                <p className="auth-hint">Пароль придумаем сами и покажем один раз после регистрации.</p>
                {error ? <p className="auth-error">{error}</p> : null}
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Создаём…" : "Зарегистрироваться"}
                </button>
              </form>
            ) : (
              <form
                className="auth-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void enter("/api/auth/login", { login, password });
                }}
              >
                <label>
                  Логин
                  <input value={login} onChange={(e) => setLogin(e.target.value)} required autoComplete="username" />
                </label>
                <label>
                  Пароль
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
                {error ? <p className="auth-error">{error}</p> : null}
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Входим…" : "Войти"}
                </button>
              </form>
            )}

            {demoEnabled ? (
              <button
                type="button"
                className="btn-secondary auth-demo"
                disabled={busy}
                onClick={() => void enter("/api/auth/demo")}
              >
                Войти демо-аккаунтом
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { profileSlug, withRole } from "@/lib/roles";
import { useAuth } from "./AuthProvider";

export function HideIfOwn({
  personSlug,
  children,
}: {
  personSlug: string;
  children: ReactNode;
}) {
  const { cfg } = useAuth();
  if (personSlug === profileSlug(cfg)) return null;
  return children;
}

function WriteButton({ personSlug, label, primary }: { personSlug: string; label: string; primary?: boolean }) {
  const { user, role } = useAuth();
  const router = useRouter();

  async function openChat() {
    if (!user || user.isDemo) {
      router.push(withRole("/messages", role));
      return;
    }
    const res = await fetch("/api/chat/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personSlug }),
    });
    const data = (await res.json()) as { threadId?: string; error?: string };
    if (!res.ok || !data.threadId) {
      window.alert(data.error || "Не удалось открыть чат");
      return;
    }
    router.push(withRole(`/messages?thread=${data.threadId}`, role));
  }

  return (
    <button type="button" className={primary ? "btn-primary" : "btn-secondary"} onClick={() => void openChat()}>
      {label}
    </button>
  );
}

export function ProfileViewerActions({
  personSlug,
  profession,
}: {
  personSlug: string;
  profession?: string;
}) {
  const { role, cfg } = useAuth();
  const isTalent = profession === "actor" || profession === "actress";
  const isCasting = profession === "casting";
  const isAgent = profession === "agent";
  const isOwn = personSlug === profileSlug(cfg);

  if (isOwn) {
    const second =
      role === "agent"
        ? { href: "/search?mine=1", label: "Мои актёры" }
        : role === "casting"
          ? { href: "/castings", label: "Мои кастинги" }
          : { href: "/responses", label: "Мои отклики" };
    return (
      <div className="detail-hero__actions">
        <Link href={withRole("/settings", role)} className="btn-primary">
          Редактировать
        </Link>
        <Link href={withRole(second.href, role)} className="btn-secondary">
          {second.label}
        </Link>
      </div>
    );
  }

  if (role === "casting" && isTalent) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} label="Написать в чат" primary />
        <Link href={withRole("/search", role)} className="btn-secondary">
          Пригласить на кастинг
        </Link>
      </div>
    );
  }

  if (role === "agent" && isTalent) {
    return (
      <div className="detail-hero__actions">
        <Link href={withRole("/compose?type=propose", role)} className="btn-primary">
          Предложить на кастинг
        </Link>
        <WriteButton personSlug={personSlug} label="Написать актёру" />
      </div>
    );
  }

  if (role === "actor" && isCasting) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} label="Написать кастинг-директору" primary />
        <Link href={withRole("/castings", role)} className="btn-secondary">
          Смотреть кастинги
        </Link>
      </div>
    );
  }

  if (role === "agent" && isCasting) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} label="Ответить в чат" primary />
        <Link href={withRole("/castings", role)} className="btn-secondary">
          Предложить ростер
        </Link>
      </div>
    );
  }

  if (role === "casting" && isAgent) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} label="Написать агенту" primary />
        <Link href={withRole("/search", role)} className="btn-secondary">
          База актёров
        </Link>
      </div>
    );
  }

  return (
    <div className="detail-hero__actions">
      <WriteButton personSlug={personSlug} label="Написать" primary />
      <Link href={withRole(`/people/${personSlug}`, role)} className="btn-secondary">
        Профиль
      </Link>
    </div>
  );
}

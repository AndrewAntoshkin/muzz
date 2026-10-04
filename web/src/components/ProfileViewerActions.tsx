"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { canMessageCasting, canMessageCompany, openPlanModal, parsePlan } from "@/lib/plans";
import { profileSlug, withRole } from "@/lib/roles";
import { useAuth } from "./AuthProvider";
import { InviteToCastingDialog, NoAccountDialog } from "./ContactDialogs";
import { useWorkspace } from "./useWorkspace";

function isCompanyTarget(slug: string, profession?: string) {
  if (profession === "producer") return true;
  return /studio|kino/i.test(slug);
}

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

export function WriteButton({
  personSlug,
  label,
  primary,
  className,
  profession,
  personName,
}: {
  personSlug: string;
  /** Имя адресата — для подписи в диалоге «нет аккаунта». */
  personName?: string;
  label: string;
  primary?: boolean;
  className?: string;
  profession?: string;
}) {
  const { user, role } = useAuth();
  const { threads, settings } = useWorkspace();
  const router = useRouter();
  const plan = parsePlan(settings.plan);
  const [noAccount, setNoAccount] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function openChat() {
    if (role === "actor") {
      if (isCompanyTarget(personSlug, profession) && !canMessageCompany(plan)) {
        openPlanModal();
        return;
      }
      if (profession === "casting" && !canMessageCasting(plan)) {
        openPlanModal();
        return;
      }
    }
    if (!user || user.isDemo) {
      const href = `/people/${personSlug}`;
      const thread = threads.find((t) => t.views[role]?.profileHref === href) ?? threads.find((t) => t.id.includes(personSlug));
      const to = thread ? `/messages?thread=${encodeURIComponent(thread.id)}` : "/messages";
      router.push(withRole(to, role));
      return;
    }
    setFailure(null);
    let res: Response;
    try {
      res = await fetch("/api/chat/open", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personSlug }),
      });
    } catch {
      setFailure("Нет соединения. Проверьте интернет и повторите.");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { threadId?: string; error?: string; code?: string };
    if (data.code === "no_account") {
      setNoAccount(true);
      return;
    }
    if (!res.ok || !data.threadId) {
      setFailure(data.error || "Не удалось открыть чат");
      return;
    }
    router.push(withRole(`/messages?thread=${data.threadId}`, role));
  }

  return (
    <>
      <button
        type="button"
        className={`${primary ? "btn-primary" : "btn-secondary"}${className ? ` ${className}` : ""}`}
        onClick={() => void openChat()}
      >
        {label}
      </button>
      {failure ? (
        <span role="alert" className="settings-page__hint" style={{ color: "var(--danger, #e5484d)" }}>
          {failure}
        </span>
      ) : null}
      {noAccount ? <NoAccountDialog personName={personName} onClose={() => setNoAccount(false)} /> : null}
    </>
  );
}

export function ProfileViewerActions({
  personSlug,
  personName,
  profession,
  agencyId,
  onEditProfile,
  onEditStatus,
}: {
  personSlug: string;
  personName?: string;
  profession?: string;
  agencyId?: string | null;
  onEditProfile?: () => void;
  onEditStatus?: () => void;
}) {
  const { role, cfg } = useAuth();
  const isTalent = profession === "actor" || profession === "actress";
  const isCasting = profession === "casting";
  const isAgent = profession === "agent";
  const isOwn = personSlug === profileSlug(cfg);
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isOwn) {
    const second =
      role === "agent"
        ? { href: "/search?mine=1", label: "Мои актёры" }
        : role === "casting"
          ? { href: "/castings", label: "Мои кастинги" }
          : { href: "/responses", label: "Мои отклики" };
    return (
      <div className="detail-hero__actions">
        {onEditProfile ? (
          <button type="button" className="btn-primary" onClick={onEditProfile}>
            Редактировать профиль
          </button>
        ) : (
          <Link href={withRole("/settings", role)} className="btn-primary">
            Редактировать
          </Link>
        )}
        {onEditStatus ? (
          <button type="button" className="btn-secondary" onClick={onEditStatus}>
            Обновить статус
          </button>
        ) : (
          <Link href={withRole(second.href, role)} className="btn-secondary">
            {second.label}
          </Link>
        )}
      </div>
    );
  }

  if (role === "casting" && isTalent) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} personName={personName} profession={profession} label="Написать в чат" primary />
        <button type="button" className="btn-secondary" onClick={() => setInviteOpen(true)}>
          Пригласить на кастинг
        </button>
        {inviteOpen ? (
          <InviteToCastingDialog personSlug={personSlug} personName={personName} onClose={() => setInviteOpen(false)} />
        ) : null}
      </div>
    );
  }

  if (role === "agent" && isTalent) {
    return (
      <div className="detail-hero__actions">
        <Link href={withRole("/compose?type=propose", role)} className="btn-primary">
          Предложить на кастинг
        </Link>
        <WriteButton personSlug={personSlug} personName={personName} profession={profession} label="Написать актёру" />
      </div>
    );
  }

  if (role === "actor" && isCasting) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} personName={personName} profession={profession} label="Написать кастинг-директору" primary />
        <Link href={withRole("/castings", role)} className="btn-secondary">
          Смотреть кастинги
        </Link>
      </div>
    );
  }

  if (role === "agent" && isCasting) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} personName={personName} profession={profession} label="Ответить в чат" primary />
        <Link href={withRole("/castings", role)} className="btn-secondary">
          Предложить ростер
        </Link>
      </div>
    );
  }

  const agencyHref = `/agencies/${agencyId || "akter1"}`;

  if (role === "casting" && isAgent) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} personName={personName} profession={profession} label="Написать агенту" primary />
        <Link href={withRole(agencyHref, role)} className="btn-secondary">
          Ростер агентства
        </Link>
      </div>
    );
  }

  if (isAgent) {
    return (
      <div className="detail-hero__actions">
        <WriteButton personSlug={personSlug} personName={personName} profession={profession} label="Написать" primary />
        <Link href={withRole(agencyHref, role)} className="btn-secondary">
          Агентство
        </Link>
      </div>
    );
  }

  return (
    <div className="detail-hero__actions">
      <WriteButton personSlug={personSlug} personName={personName} profession={profession} label="Написать" primary />
    </div>
  );
}

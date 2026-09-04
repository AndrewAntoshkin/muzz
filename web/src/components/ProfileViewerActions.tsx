"use client";

import Link from "next/link";
import { withRole } from "@/lib/roles";
import { useDemoRole } from "./useDemoRole";

export function ProfileViewerActions({
  personSlug,
  profession,
}: {
  personSlug: string;
  profession?: string;
}) {
  const { role } = useDemoRole();
  const isTalent = profession === "actor" || profession === "actress";
  const isCasting = profession === "casting";
  const isAgent = profession === "agent";

  if (role === "casting" && isTalent) {
    return (
      <div className="detail-hero__actions">
        <Link href={withRole("/messages", role)} className="btn-primary">
          Написать в чат
        </Link>
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
        <Link href={withRole("/messages", role)} className="btn-secondary">
          Написать актёру
        </Link>
      </div>
    );
  }

  if (role === "actor" && isCasting) {
    return (
      <div className="detail-hero__actions">
        <Link href={withRole("/messages", role)} className="btn-primary">
          Написать кастинг-директору
        </Link>
        <Link href={withRole("/castings", role)} className="btn-secondary">
          Смотреть кастинги
        </Link>
      </div>
    );
  }

  if (role === "agent" && isCasting) {
    return (
      <div className="detail-hero__actions">
        <Link href={withRole("/messages", role)} className="btn-primary">
          Ответить в чат
        </Link>
        <Link href={withRole("/castings", role)} className="btn-secondary">
          Предложить ростер
        </Link>
      </div>
    );
  }

  if (role === "casting" && isAgent) {
    return (
      <div className="detail-hero__actions">
        <Link href={withRole("/messages", role)} className="btn-primary">
          Написать агенту
        </Link>
        <Link href={withRole("/search", role)} className="btn-secondary">
          База актёров
        </Link>
      </div>
    );
  }

  return (
    <div className="detail-hero__actions">
      <Link href={withRole("/messages", role)} className="btn-primary">
        Написать
      </Link>
      <Link href={withRole(`/people/${personSlug}`, role)} className="btn-secondary">
        Профиль
      </Link>
    </div>
  );
}

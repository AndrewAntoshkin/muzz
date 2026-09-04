"use client";

import Link from "next/link";
import type { FaceCard } from "@/lib/people";
import { assetSrc, initialsOf } from "@/lib/labels";
import { withRole } from "@/lib/roles";
import { useDemoRole } from "./useDemoRole";
import { IconVerified } from "./icons";

export function PersonCard({
  person,
  variant,
}: {
  person: FaceCard;
  variant?: "strip";
}) {
  const { role } = useDemoRole();
  const href = withRole(`/people/${person.slug}`, role);
  const src = assetSrc(person.imageUrl);
  const initials = person.initials || initialsOf(person.name);
  const cardClass = variant === "strip" ? "person-card person-card--strip" : "person-card";
  const meta = [person.role, person.city].filter(Boolean).join(" · ");

  return (
    <div className="person-card-wrap">
      <Link
        href={href}
        className={cardClass}
        data-profession={person.profession}
        data-city={person.city}
        data-verified={person.verified ? "1" : "0"}
      >
        <span className="person-card__media">
          {src ? (
            <img src={src} alt="" loading="lazy" />
          ) : (
            <span className="person-card__ava" style={{ background: person.bg || "#5C4A45" }}>
              {initials}
            </span>
          )}
        </span>
        <span className="person-card__body">
          <span className="person-card__name">
            {person.name}
            {person.verified ? (
              <span className="person-card__badge" title="Проверен">
                <IconVerified size={14} />
              </span>
            ) : null}
          </span>
          {meta ? <span className="person-card__role">{meta}</span> : null}
        </span>
      </Link>
    </div>
  );
}

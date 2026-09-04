"use client";

import Link from "next/link";
import type { FaceCard } from "@/lib/people";
import { assetSrc, initialsOf, personIsPro } from "@/lib/labels";
import { withRole } from "@/lib/roles";
import { useDemoRole } from "./useDemoRole";

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
  const pro = personIsPro(person);

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
          {pro ? <span className="person-card__pro">PRO</span> : null}
        </span>
        <span className="person-card__body">
          <span className="person-card__name">{person.name}</span>
          {meta ? <span className="person-card__role">{meta}</span> : null}
        </span>
      </Link>
    </div>
  );
}

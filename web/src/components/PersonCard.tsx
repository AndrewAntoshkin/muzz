"use client";

import Link from "next/link";
import type { FaceCard } from "@/lib/people";
import { assetSrc, initialsOf } from "@/lib/labels";
import { PLAN_META, parsePlan, personIsStudent, visiblePlan } from "@/lib/plans";
import { profileSlug, withRole } from "@/lib/roles";
import { useDemoRole } from "./useDemoRole";
import { useWorkspace } from "./useWorkspace";

export function PersonCard({
  person,
  variant,
  status,
  statusKind,
}: {
  person: FaceCard;
  variant?: "strip";
  status?: string;
  statusKind?: "open" | "busy" | "hold";
}) {
  const { role, cfg } = useDemoRole();
  const { settings } = useWorkspace();
  const href = withRole(`/people/${person.slug}`, role);
  const src = assetSrc(person.imageUrl);
  const initials = person.initials || initialsOf(person.name);
  const cardClass = variant === "strip" ? "person-card person-card--strip" : "person-card";
  const meta = status || [person.role, person.city].filter(Boolean).join(" · ");
  const metaClass = statusKind
    ? `person-card__role person-card__status person-card__status--${statusKind}`
    : "person-card__role";
  const plan = visiblePlan(person.slug, person.profession, profileSlug(cfg), parsePlan(settings.plan));
  const isActor = person.profession === "actor" || person.profession === "actress";
  const student = isActor && personIsStudent(person.slug);
  const planBadge = plan === "standard" ? null : PLAN_META[plan].badge;

  return (
    <div className="person-card-wrap">
      <Link
        href={href}
        className={cardClass}
        data-profession={person.profession}
        data-city={person.city}
        data-verified={person.verified ? "1" : "0"}
        data-plan={plan}
      >
        <span className={`person-card__media plan-ring plan-ring--${plan}`}>
          {src ? (
            <img src={src} alt="" loading="lazy" />
          ) : (
            <span className="person-card__ava" style={{ background: person.bg || "#5C4A45" }}>
              {initials}
            </span>
          )}
          {planBadge ? <span className={`person-card__plan person-card__plan--${plan}`}>{planBadge}</span> : null}
        </span>
        <span className="person-card__body">
          <span className="person-card__name">{person.name}</span>
          {isActor ? (
            <span className={`person-card__kind${student ? " is-student" : ""}`}>
              {student ? "Студент" : "Проф."}
            </span>
          ) : null}
          {meta ? <span className={metaClass}>{meta}</span> : null}
        </span>
      </Link>
    </div>
  );
}

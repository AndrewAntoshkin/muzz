"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { mobileTabsFor, withRole, type DemoRole, type RoleId } from "@/lib/roles";
import {
  IconCasting,
  IconFaces,
  IconHome,
  IconProject,
  IconResponses,
} from "./icons";

const TAB_ICONS: Record<string, (filled: boolean) => ReactNode> = {
  home: (filled) => <IconHome filled={filled} />,
  projects: (filled) => <IconProject filled={filled} />,
  castings: (filled) => <IconCasting filled={filled} />,
  responses: (filled) => <IconResponses filled={filled} />,
  roster: (filled) => <IconFaces filled={filled} />,
};

export function MobileTabBar({
  cfg,
  role,
  activeId,
  hidden,
  inert,
}: {
  cfg: DemoRole;
  role: RoleId;
  activeId: string;
  hidden?: boolean;
  inert?: boolean;
}) {
  const tabs = mobileTabsFor(cfg);

  return (
    <nav className={`mobile-tabbar${hidden ? " is-hidden" : ""}`} aria-label="Разделы" hidden={hidden} inert={inert || undefined}>
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <Link
            key={tab.id}
            href={withRole(tab.href, role)}
            className={`mobile-tabbar__item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-tabbar__icon" aria-hidden>
              {TAB_ICONS[tab.id]?.(active)}
            </span>
            <span className="mobile-tabbar__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

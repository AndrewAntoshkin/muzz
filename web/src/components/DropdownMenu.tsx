"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export function DropdownMenu({
  open,
  anchorRef,
  onClose,
  children,
  align = "left",
  className,
  role = "listbox",
  matchWidth = false,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  className: string;
  role?: "listbox" | "menu";
  matchWidth?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const menuH = menuRef.current?.offsetHeight || 160;
      const spaceBelow = window.innerHeight - r.bottom - gap;
      const spaceAbove = r.top - gap;
      const placeTop = spaceBelow < menuH && spaceAbove > spaceBelow;
      const next: CSSProperties = {
        position: "fixed",
        zIndex: 400,
        display: "block",
      };
      if (placeTop) {
        next.top = "auto";
        next.bottom = window.innerHeight - r.top + gap;
      } else {
        next.top = r.bottom + gap;
        next.bottom = "auto";
      }
      if (matchWidth) {
        next.boxSizing = "border-box";
        next.width = r.width;
        next.minWidth = r.width;
        next.left = r.left;
        next.right = "auto";
      } else if (align === "right") {
        next.right = Math.max(8, window.innerWidth - r.right);
        next.left = "auto";
      } else {
        next.left = Math.max(8, r.left);
      }
      setPos(next);
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, align, matchWidth]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, onClose, anchorRef]);

  if (!mounted || !open) return null;

  return createPortal(
    <div ref={menuRef} className={`${className} is-portal`} role={role} data-kadr-dropdown style={pos}>
      {children}
    </div>,
    document.body,
  );
}

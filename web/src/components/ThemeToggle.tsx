"use client";

import { useEffect, useState } from "react";
import { applyTheme, readTheme, type ThemeId } from "@/lib/theme";

const OPTIONS: [ThemeId, string][] = [
  ["dark", "Тёмная"],
  ["light", "Светлая"],
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeId>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function pick(next: ThemeId) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="theme-switch" role="group" aria-label="Тема">
      {OPTIONS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={theme === id ? "is-on" : ""}
          aria-pressed={theme === id}
          onClick={() => pick(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

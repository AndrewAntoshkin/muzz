export const THEME_STORE = "kadr-theme";
export type ThemeId = "dark" | "light";

export function readTheme(): ThemeId {
  try {
    const t = localStorage.getItem(THEME_STORE);
    if (t === "light" || t === "dark") return t;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function applyTheme(theme: ThemeId) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  const color = theme === "light" ? "#ffffff" : "#121212";
  document.querySelectorAll('meta[name="theme-color"]').forEach((node) => {
    node.setAttribute("content", color);
  });
  try {
    localStorage.setItem(THEME_STORE, theme);
  } catch {
    /* ignore */
  }
}

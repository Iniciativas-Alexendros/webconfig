export type ThemeMode = "light" | "dark" | "auto";

const KEY = "ds-theme";

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo privado: el tema no persiste.
  }
}

export function readTheme(): ThemeMode {
  const saved = storageGet(KEY);
  return saved === "dark" || saved === "light" ? saved : "auto";
}

/** Aplica data-theme (tokens DTCG) y la clase dark (shadcn). */
export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  if (theme === "auto") {
    root.removeAttribute("data-theme");
    root.classList.remove("dark");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) root.classList.add("dark");
  } else if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark");
  } else {
    root.setAttribute("data-theme", "light");
    root.classList.remove("dark");
  }
  storageSet(KEY, theme);
}

export function cycleTheme(current: ThemeMode): ThemeMode {
  if (current === "light") return "dark";
  if (current === "dark") return "auto";
  return "light";
}

export function themeLabel(theme: ThemeMode): string {
  if (theme === "light") return "claro";
  if (theme === "dark") return "oscuro";
  return "sistema";
}

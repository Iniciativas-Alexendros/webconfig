import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { applyTheme, cycleTheme, readTheme, themeLabel, type ThemeMode } from "@/lib/theme";

interface ThemeToggleProps {
  id?: string;
  /** Etiquetas en español (landing) o inglés corto (showcase e2e). */
  locale?: "es" | "en";
}

export function ThemeToggle({ id = "theme-toggle", locale = "es" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("auto");

  useEffect(() => {
    const initial = readTheme();
    setTheme(initial);
    applyTheme(initial);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readTheme() === "auto") applyTheme("auto");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const set = (next: ThemeMode) => {
    setTheme(next);
    applyTheme(next);
  };

  const cycle = () => set(cycleTheme(theme));

  const label = locale === "es" ? `Tema: ${themeLabel(theme)}` : `Tema: ${theme === "auto" ? "auto" : theme}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-live="polite"
          aria-label={locale === "es" ? `Cambiar tema. Ahora: ${themeLabel(theme)}` : `Theme: ${theme}`}
          onClick={(e) => {
            // Clic directo también cicla (compatibilidad Playwright).
            if ((e.target as HTMLElement).closest("[data-radix-collection-item]")) return;
          }}
        >
          <span id="theme-label">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => set("light")}>Claro</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => set("dark")}>Oscuro</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => set("auto")}>Sistema</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => cycle()}>Siguiente</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Botón simple que cicla light → dark → auto (e2e y a11y). */
export function ThemeCycleButton({ id = "theme-toggle", locale = "en" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("auto");

  useEffect(() => {
    const initial = readTheme();
    setTheme(initial);
    applyTheme(initial);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readTheme() === "auto") applyTheme("auto");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const label = locale === "es" ? `Tema: ${themeLabel(theme)}` : `Tema: ${theme === "auto" ? "auto" : theme}`;

  return (
    <Button
      id={id}
      type="button"
      variant="outline"
      aria-live="polite"
      aria-label={locale === "es" ? `Cambiar tema. Ahora: ${themeLabel(theme)}` : `Theme: ${theme}`}
      onClick={() => {
        const next = cycleTheme(theme);
        setTheme(next);
        applyTheme(next);
      }}
    >
      <span id="theme-label">{label}</span>
    </Button>
  );
}

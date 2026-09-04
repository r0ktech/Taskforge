"use client";
import * as React from "react";

export function useTheme() {
  const [theme, setThemeState] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const setTheme = React.useCallback((next: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("tf-theme", next);
    } catch {
      // ignore
    }
    setThemeState(next);
  }, []);

  const toggle = React.useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return { theme, setTheme, toggle };
}

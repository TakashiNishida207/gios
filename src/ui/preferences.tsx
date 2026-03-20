// src/ui/preferences.tsx
// Global UI preferences — theme (dark/light) and language (en/ja)
// Persisted in localStorage; applied via data-theme attribute on <html>

"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type Lang  = "en"   | "ja";

type PreferencesCtx = {
  theme:       Theme;
  lang:        Lang;
  toggleTheme: () => void;
  toggleLang:  () => void;
};

const Ctx = createContext<PreferencesCtx>({
  theme: "dark", lang: "ja",
  toggleTheme: () => {}, toggleLang: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang,  setLang]  = useState<Lang>("ja");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const t = localStorage.getItem("gios-theme") as Theme | null;
    const l = localStorage.getItem("gios-lang")  as Lang  | null;
    if (t === "dark" || t === "light") setTheme(t);
    if (l === "en"   || l === "ja")    setLang(l);
  }, []);

  // Apply theme attribute + persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gios-theme", theme);
  }, [theme]);

  // Persist lang
  useEffect(() => {
    localStorage.setItem("gios-lang", lang);
  }, [lang]);

  const toggleTheme = () => {
    // Briefly enable CSS transitions for a smooth crossfade
    const root = document.documentElement;
    root.classList.add("theme-switching");
    setTimeout(() => root.classList.remove("theme-switching"), 350);
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "ja" : "en"));

  return (
    <Ctx.Provider value={{ theme, lang, toggleTheme, toggleLang }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePreferences = () => useContext(Ctx);

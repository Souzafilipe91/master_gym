import { useState, useEffect, useCallback } from "react";

export type ThemePreset = "dark-red" | "light-blue" | "eva-unit1" | "custom";

export interface ThemeColors {
  primary: string;       // oklch
  primaryFg: string;     // oklch
  background: string;    // oklch
  foreground: string;    // oklch
  card: string;          // oklch
  sidebar: string;       // oklch
  accent: string;        // oklch
  ring: string;          // oklch
}

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: "dark-red",
    name: "Preto e Vermelho",
    description: "Tema atual — escuro com destaque em vermelho",
    colors: {
      primary: "oklch(0.55 0.22 25)",
      primaryFg: "oklch(0.98 0.005 285)",
      background: "oklch(0.12 0.005 285)",
      foreground: "oklch(0.98 0.005 285)",
      card: "oklch(0.15 0.005 285)",
      sidebar: "oklch(0.12 0.005 285)",
      accent: "oklch(0.55 0.22 25)",
      ring: "oklch(0.55 0.22 25)",
    },
  },
  {
    id: "light-blue",
    name: "Branco e Azul Claro",
    description: "Tema claro com destaque em azul",
    colors: {
      primary: "oklch(0.55 0.2 240)",
      primaryFg: "oklch(0.98 0 0)",
      background: "oklch(0.98 0.002 240)",
      foreground: "oklch(0.15 0.005 240)",
      card: "oklch(0.95 0.003 240)",
      sidebar: "oklch(0.93 0.005 240)",
      accent: "oklch(0.55 0.2 240)",
      ring: "oklch(0.55 0.2 240)",
    },
  },
  {
    id: "eva-unit1",
    name: "EVA Unit-01",
    description: "Roxo e verde — inspirado no Evangelion",
    colors: {
      primary: "oklch(0.65 0.28 145)",
      primaryFg: "oklch(0.1 0.02 145)",
      background: "oklch(0.1 0.015 290)",
      foreground: "oklch(0.95 0.005 290)",
      card: "oklch(0.14 0.02 290)",
      sidebar: "oklch(0.1 0.015 290)",
      accent: "oklch(0.65 0.28 145)",
      ring: "oklch(0.65 0.28 145)",
    },
  },
];

const THEME_STORAGE_KEY = "gym-theme-config";

function applyThemeColors(colors: ThemeColors, isDark: boolean) {
  const root = document.documentElement;

  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", colors.primaryFg);
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--card-foreground", colors.foreground);
  root.style.setProperty("--popover", colors.card);
  root.style.setProperty("--popover-foreground", colors.foreground);
  root.style.setProperty("--sidebar", colors.sidebar);
  root.style.setProperty("--sidebar-foreground", colors.foreground);
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--sidebar-primary-foreground", colors.primaryFg);
  root.style.setProperty("--sidebar-accent", isDark
    ? `oklch(from ${colors.sidebar} calc(l + 0.06) c h)`
    : `oklch(from ${colors.sidebar} calc(l - 0.04) c h)`
  );
  root.style.setProperty("--sidebar-accent-foreground", colors.foreground);
  root.style.setProperty("--sidebar-border", isDark
    ? `oklch(from ${colors.background} calc(l + 0.1) c h)`
    : `oklch(from ${colors.background} calc(l - 0.08) c h)`
  );
  root.style.setProperty("--sidebar-ring", colors.ring);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", colors.primaryFg);
  root.style.setProperty("--ring", colors.ring);
  root.style.setProperty("--secondary", isDark
    ? `oklch(from ${colors.background} calc(l + 0.06) c h)`
    : `oklch(from ${colors.background} calc(l - 0.04) c h)`
  );
  root.style.setProperty("--secondary-foreground", colors.foreground);
  root.style.setProperty("--muted", isDark
    ? `oklch(from ${colors.background} calc(l + 0.06) c h)`
    : `oklch(from ${colors.background} calc(l - 0.04) c h)`
  );
  root.style.setProperty("--muted-foreground", isDark
    ? `oklch(from ${colors.foreground} calc(l - 0.35) c h)`
    : `oklch(from ${colors.foreground} calc(l + 0.35) c h)`
  );
  root.style.setProperty("--border", isDark
    ? `oklch(from ${colors.background} calc(l + 0.1) c h)`
    : `oklch(from ${colors.background} calc(l - 0.08) c h)`
  );
  root.style.setProperty("--input", isDark
    ? `oklch(from ${colors.background} calc(l + 0.1) c h)`
    : `oklch(from ${colors.background} calc(l - 0.08) c h)`
  );

  // Atualizar classe dark/light no html
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function isLightBackground(background: string): boolean {
  // Verifica se o L (lightness) em oklch é > 0.5
  const match = background.match(/oklch\(([\d.]+)/);
  if (match) {
    return parseFloat(match[1]) > 0.5;
  }
  return false;
}

export function useTheme() {
  const [activePreset, setActivePreset] = useState<ThemePreset>("dark-red");
  const [customColors, setCustomColors] = useState<ThemeColors | null>(null);

  // Carregar tema salvo ao montar
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setActivePreset(config.preset || "dark-red");
        if (config.customColors) {
          setCustomColors(config.customColors);
        }
        // Aplicar imediatamente
        const colors = config.preset === "custom" && config.customColors
          ? config.customColors
          : THEME_PRESETS.find(t => t.id === config.preset)?.colors || THEME_PRESETS[0].colors;
        const isDark = !isLightBackground(colors.background);
        applyThemeColors(colors, isDark);
      } catch (e) {
        console.error("Erro ao carregar tema:", e);
      }
    }
  }, []);

  const applyPreset = useCallback((presetId: ThemePreset) => {
    const preset = THEME_PRESETS.find(t => t.id === presetId);
    if (!preset) return;
    const isDark = !isLightBackground(preset.colors.background);
    applyThemeColors(preset.colors, isDark);
    setActivePreset(presetId);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ preset: presetId }));
  }, []);

  const applyCustom = useCallback((colors: ThemeColors) => {
    const isDark = !isLightBackground(colors.background);
    applyThemeColors(colors, isDark);
    setActivePreset("custom");
    setCustomColors(colors);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ preset: "custom", customColors: colors }));
  }, []);

  const getCurrentColors = useCallback((): ThemeColors => {
    if (activePreset === "custom" && customColors) return customColors;
    return THEME_PRESETS.find(t => t.id === activePreset)?.colors || THEME_PRESETS[0].colors;
  }, [activePreset, customColors]);

  return { activePreset, customColors, applyPreset, applyCustom, getCurrentColors };
}

import { useState, useEffect, useCallback } from "react";

export type ThemePreset = "dark-red" | "light-blue" | "eva-unit1" | "custom";

export interface ThemeColors {
  primary: string;
  primaryFg: string;
  background: string;
  foreground: string;
  card: string;
  sidebar: string;
  accent: string;
  ring: string;
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

// Derivar cores secundárias com valores absolutos (sem relative color syntax)
function deriveSecondaryColors(colors: ThemeColors, isDark: boolean): Record<string, string> {
  // Extrair L do background para calcular variações
  const bgMatch = colors.background.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  const bgL = bgMatch ? parseFloat(bgMatch[1]) : (isDark ? 0.12 : 0.98);
  const bgC = bgMatch ? parseFloat(bgMatch[2]) : 0.005;
  const bgH = bgMatch ? parseFloat(bgMatch[3]) : 285;

  const step = isDark ? 0.06 : -0.04;
  const borderStep = isDark ? 0.10 : -0.08;
  const mutedFgStep = isDark ? 0.35 : -0.35;

  const fgMatch = colors.foreground.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  const fgL = fgMatch ? parseFloat(fgMatch[1]) : (isDark ? 0.98 : 0.15);
  const fgC = fgMatch ? parseFloat(fgMatch[2]) : 0.005;
  const fgH = fgMatch ? parseFloat(fgMatch[3]) : 285;

  const clamp = (v: number, min = 0.02, max = 0.97) => Math.max(min, Math.min(max, v));

  const secondary = `oklch(${clamp(bgL + step).toFixed(3)} ${bgC.toFixed(3)} ${bgH})`;
  const border = `oklch(${clamp(bgL + borderStep).toFixed(3)} ${bgC.toFixed(3)} ${bgH})`;
  const mutedFg = `oklch(${clamp(fgL - mutedFgStep).toFixed(3)} ${fgC.toFixed(3)} ${fgH})`;

  const sidebarMatch = colors.sidebar.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  const sbL = sidebarMatch ? parseFloat(sidebarMatch[1]) : bgL;
  const sbC = sidebarMatch ? parseFloat(sidebarMatch[2]) : bgC;
  const sbH = sidebarMatch ? parseFloat(sidebarMatch[3]) : bgH;
  const sidebarAccent = `oklch(${clamp(sbL + step).toFixed(3)} ${sbC.toFixed(3)} ${sbH})`;

  return {
    "--secondary": secondary,
    "--secondary-foreground": colors.foreground,
    "--muted": secondary,
    "--muted-foreground": mutedFg,
    "--border": border,
    "--input": border,
    "--card-foreground": colors.foreground,
    "--popover": colors.card,
    "--popover-foreground": colors.foreground,
    "--sidebar-foreground": colors.foreground,
    "--sidebar-primary": colors.primary,
    "--sidebar-primary-foreground": colors.primaryFg,
    "--sidebar-accent": sidebarAccent,
    "--sidebar-accent-foreground": colors.foreground,
    "--sidebar-border": border,
    "--sidebar-ring": colors.ring,
    "--accent-foreground": colors.primaryFg,
    "--destructive": isDark ? "oklch(0.65 0.25 25)" : "oklch(0.55 0.22 25)",
    "--destructive-foreground": "oklch(0.98 0.005 285)",
  };
}

export function applyThemeColors(colors: ThemeColors) {
  const root = document.documentElement;

  // Detectar se é tema escuro
  const bgMatch = colors.background.match(/oklch\(([\d.]+)/);
  const isDark = bgMatch ? parseFloat(bgMatch[1]) <= 0.5 : true;

  // Aplicar cores principais
  const primary: Record<string, string> = {
    "--primary": colors.primary,
    "--primary-foreground": colors.primaryFg,
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--card": colors.card,
    "--sidebar": colors.sidebar,
    "--accent": colors.accent,
    "--ring": colors.ring,
  };

  for (const [key, val] of Object.entries(primary)) {
    root.style.setProperty(key, val);
  }

  // Aplicar cores derivadas (valores absolutos, sem relative color syntax)
  const derived = deriveSecondaryColors(colors, isDark);
  for (const [key, val] of Object.entries(derived)) {
    root.style.setProperty(key, val);
  }

  // Gerenciar classe dark/light
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function isLightBackground(background: string): boolean {
  const match = background.match(/oklch\(([\d.]+)/);
  if (match) return parseFloat(match[1]) > 0.5;
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
        const colors = config.preset === "custom" && config.customColors
          ? config.customColors
          : THEME_PRESETS.find((t) => t.id === config.preset)?.colors || THEME_PRESETS[0].colors;
        applyThemeColors(colors);
      } catch (e) {
        console.error("Erro ao carregar tema:", e);
      }
    }
  }, []);

  const applyPreset = useCallback((presetId: ThemePreset) => {
    const preset = THEME_PRESETS.find((t) => t.id === presetId);
    if (!preset) return;
    applyThemeColors(preset.colors);
    setActivePreset(presetId);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ preset: presetId }));
  }, []);

  const applyCustom = useCallback((colors: ThemeColors) => {
    applyThemeColors(colors);
    setActivePreset("custom");
    setCustomColors(colors);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ preset: "custom", customColors: colors }));
  }, []);

  const getCurrentColors = useCallback((): ThemeColors => {
    if (activePreset === "custom" && customColors) return customColors;
    return THEME_PRESETS.find((t) => t.id === activePreset)?.colors || THEME_PRESETS[0].colors;
  }, [activePreset, customColors]);

  return { activePreset, customColors, applyPreset, applyCustom, getCurrentColors };
}

export { isLightBackground };

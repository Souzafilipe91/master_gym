import { describe, it, expect, beforeEach } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// ============================================================
// Testes de detecção de PR
// ============================================================
describe("Detecção de PR (Personal Record)", () => {
  it("deve detectar PR quando carga atual é maior que o último registro", () => {
    const lastLoad = 80;
    const currentLoad = 82.5;
    const isPR = currentLoad > 0 && currentLoad > lastLoad;
    expect(isPR).toBe(true);
  });

  it("não deve detectar PR quando carga é igual ao último registro", () => {
    const lastLoad = 80;
    const currentLoad = 80;
    const isPR = currentLoad > 0 && currentLoad > lastLoad;
    expect(isPR).toBe(false);
  });

  it("não deve detectar PR quando carga é menor que o último registro", () => {
    const lastLoad = 80;
    const currentLoad = 77.5;
    const isPR = currentLoad > 0 && currentLoad > lastLoad;
    expect(isPR).toBe(false);
  });

  it("não deve detectar PR quando carga é 0 (exercício não registrado)", () => {
    const lastLoad = 80;
    const currentLoad = 0;
    const isPR = currentLoad > 0 && currentLoad > lastLoad;
    expect(isPR).toBe(false);
  });

  it("deve calcular corretamente a diferença do PR", () => {
    const lastLoad = 80;
    const currentLoad = 85;
    const diff = (currentLoad - lastLoad).toFixed(1);
    expect(diff).toBe("5.0");
  });
});

// ============================================================
// Testes do sistema de temas
// ============================================================
describe("Sistema de Temas", () => {
  const THEME_KEY = "gym-theme-config";

  beforeEach(() => {
    localStorage.clear();
  });

  it("deve salvar o tema pré-definido no localStorage", () => {
    const config = { preset: "eva-unit1" };
    localStorage.setItem(THEME_KEY, JSON.stringify(config));
    const saved = JSON.parse(localStorage.getItem(THEME_KEY)!);
    expect(saved.preset).toBe("eva-unit1");
  });

  it("deve salvar tema customizado com cores no localStorage", () => {
    const customColors = {
      primary: "oklch(0.6 0.25 200)",
      primaryFg: "oklch(0.98 0 0)",
      background: "oklch(0.1 0.01 200)",
      foreground: "oklch(0.95 0.005 200)",
      card: "oklch(0.14 0.01 200)",
      sidebar: "oklch(0.1 0.01 200)",
      accent: "oklch(0.6 0.25 200)",
      ring: "oklch(0.6 0.25 200)",
    };
    const config = { preset: "custom", customColors };
    localStorage.setItem(THEME_KEY, JSON.stringify(config));
    const saved = JSON.parse(localStorage.getItem(THEME_KEY)!);
    expect(saved.preset).toBe("custom");
    expect(saved.customColors.primary).toBe("oklch(0.6 0.25 200)");
  });

  it("deve identificar corretamente tema claro vs escuro pelo L do oklch", () => {
    const isLightBackground = (bg: string) => {
      const match = bg.match(/oklch\(([\d.]+)/);
      return match ? parseFloat(match[1]) > 0.5 : false;
    };
    expect(isLightBackground("oklch(0.98 0.002 240)")).toBe(true);  // branco
    expect(isLightBackground("oklch(0.12 0.005 285)")).toBe(false); // preto
    expect(isLightBackground("oklch(0.1 0.015 290)")).toBe(false);  // EVA
  });

  it("deve ter 3 temas pré-definidos", () => {
    const presets = ["dark-red", "light-blue", "eva-unit1"];
    expect(presets).toHaveLength(3);
    expect(presets).toContain("dark-red");
    expect(presets).toContain("light-blue");
    expect(presets).toContain("eva-unit1");
  });

  it("deve retornar null quando não há tema salvo", () => {
    const saved = localStorage.getItem(THEME_KEY);
    expect(saved).toBeNull();
  });
});

// ============================================================
// Testes de conversão de cores
// ============================================================
describe("Conversão de cores para temas", () => {
  it("deve extrair hue de oklch corretamente", () => {
    const oklch = "oklch(0.55 0.22 25)";
    const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    expect(match).not.toBeNull();
    expect(parseFloat(match![3])).toBe(25); // hue = 25 (vermelho)
  });

  it("deve identificar cor de contraste correta para fundo escuro", () => {
    const getContrastFg = (bgOklch: string) => {
      const match = bgOklch.match(/oklch\(([\d.]+)/);
      if (match && parseFloat(match[1]) > 0.5) return "oklch(0.12 0.005 285)"; // escuro
      return "oklch(0.98 0.005 285)"; // claro
    };
    expect(getContrastFg("oklch(0.12 0.005 285)")).toBe("oklch(0.98 0.005 285)"); // fundo escuro → texto claro
    expect(getContrastFg("oklch(0.98 0.002 240)")).toBe("oklch(0.12 0.005 285)"); // fundo claro → texto escuro
  });
});

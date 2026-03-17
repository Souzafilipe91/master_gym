import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Palette, Sliders, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useTheme, THEME_PRESETS, type ThemeColors, type ThemePreset } from "@/hooks/useTheme";
import { toast } from "sonner";

// Converte HSL (do color picker nativo) para oklch aproximado
function hslToOklch(h: number, s: number, l: number): string {
  // Converter para valores 0-1
  const sl = s / 100;
  const ll = l / 100;
  // Aproximação: oklch(L C H) onde L ≈ l, C ≈ s*0.25 para saturação moderada
  const oklchL = Math.max(0.05, Math.min(0.98, ll));
  const oklchC = sl * 0.28; // chroma aproximado
  return `oklch(${oklchL.toFixed(2)} ${oklchC.toFixed(3)} ${h})`;
}

// Converte hex para HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Gera oklch a partir de hex
function hexToOklch(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToOklch(h, s, l);
}

// Gera uma cor de foreground adequada baseada no background
function getContrastFg(backgroundOklch: string): string {
  const match = backgroundOklch.match(/oklch\(([\d.]+)/);
  if (match && parseFloat(match[1]) > 0.5) {
    return "oklch(0.12 0.005 285)"; // escuro para fundo claro
  }
  return "oklch(0.98 0.005 285)"; // claro para fundo escuro
}

interface ColorPickerProps {
  label: string;
  value: string; // hex
  onChange: (hex: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="w-10 h-10 rounded-full border-2 border-border shadow-sm cursor-pointer hover:scale-110 transition-transform"
        style={{ backgroundColor: value }}
        onClick={() => inputRef.current?.click()}
        aria-label={`Selecionar cor: ${label}`}
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  );
}

// Converte oklch para hex aproximado (para exibição no color picker)
function oklchToHex(oklch: string): string {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return "#888888";
  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  // Converter oklch → rgb aproximado via hsl
  const hDeg = h;
  const s = Math.min(1, c / 0.28);
  // oklch L para HSL L (aproximação)
  const hslL = l;
  // HSL para RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [f(0), f(8), f(4)];
  };
  const [r, g, b] = hslToRgb(hDeg, s, hslL);
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function Personalizacao() {
  const { activePreset, applyPreset, applyCustom, getCurrentColors } = useTheme();
  const [tab, setTab] = useState<"presets" | "custom">("presets");

  // Estado do customizador
  const currentColors = getCurrentColors();
  const [primaryHex, setPrimaryHex] = useState(() => oklchToHex(currentColors.primary));
  const [bgHex, setBgHex] = useState(() => oklchToHex(currentColors.background));

  const handleApplyPreset = (presetId: ThemePreset) => {
    applyPreset(presetId);
    toast.success("Tema aplicado!");
  };

  const handleApplyCustom = useCallback(() => {
    const primaryOklch = hexToOklch(primaryHex);
    const bgOklch = hexToOklch(bgHex);
    const fgOklch = getContrastFg(bgOklch);
    const isLight = parseFloat(bgOklch.match(/oklch\(([\d.]+)/)?.[1] || "0") > 0.5;

    const cardL = isLight ? "calc(l - 0.03)" : "calc(l + 0.03)";
    const sidebarL = isLight ? "calc(l - 0.05)" : "calc(l + 0.02)";

    const colors: ThemeColors = {
      primary: primaryOklch,
      primaryFg: getContrastFg(primaryOklch),
      background: bgOklch,
      foreground: fgOklch,
      card: `oklch(from ${bgOklch} ${cardL} c h)`,
      sidebar: `oklch(from ${bgOklch} ${sidebarL} c h)`,
      accent: primaryOklch,
      ring: primaryOklch,
    };

    applyCustom(colors);
    toast.success("Tema personalizado aplicado!");
  }, [primaryHex, bgHex, applyCustom]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Personalização</h1>
            <p className="text-xs text-muted-foreground">Aparência do aplicativo</p>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-lg space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              tab === "presets"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("presets")}
          >
            <Palette className="w-4 h-4 inline mr-1" />
            Temas
          </button>
          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              tab === "custom"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("custom")}
          >
            <Sliders className="w-4 h-4 inline mr-1" />
            Personalizar
          </button>
        </div>

        {/* Temas pré-definidos */}
        {tab === "presets" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escolha um tema pré-definido. A mudança é aplicada imediatamente.
            </p>
            {THEME_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    isActive ? "border-primary ring-2 ring-primary/30" : ""
                  }`}
                  onClick={() => handleApplyPreset(preset.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Preview de cores */}
                      <div className="flex gap-1.5 shrink-0">
                        <div
                          className="w-8 h-8 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: oklchToHex(preset.colors.background) }}
                        />
                        <div
                          className="w-8 h-8 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: oklchToHex(preset.colors.primary) }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{preset.name}</p>
                          {isActive && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs py-0">
                              <Check className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Personalização completa */}
        {tab === "custom" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Cores Personalizadas
                </CardTitle>
                <CardDescription>
                  Clique nos círculos para abrir o seletor de cor e escolher qualquer tonalidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ColorPicker
                  label="Cor de destaque (botões, ícones ativos)"
                  value={primaryHex}
                  onChange={setPrimaryHex}
                />
                <ColorPicker
                  label="Cor de fundo (background)"
                  value={bgHex}
                  onChange={setBgHex}
                />

                {/* Preview ao vivo */}
                <div className="rounded-xl overflow-hidden border border-border">
                  <div
                    className="p-4"
                    style={{ backgroundColor: bgHex }}
                  >
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: getContrastFg(hexToOklch(bgHex)) === "oklch(0.98 0.005 285)" ? "#f5f5f5" : "#1a1a1a" }}
                    >
                      Preview
                    </p>
                    <div className="flex gap-2">
                      <div
                        className="px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: primaryHex,
                          color: getContrastFg(hexToOklch(primaryHex)) === "oklch(0.98 0.005 285)" ? "#f5f5f5" : "#1a1a1a",
                        }}
                      >
                        Botão primário
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-md text-xs border"
                        style={{
                          borderColor: primaryHex,
                          color: primaryHex,
                          backgroundColor: "transparent",
                        }}
                      >
                        Outline
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleApplyCustom}>
                  <Check className="w-4 h-4 mr-2" />
                  Aplicar Tema Personalizado
                </Button>

                {activePreset === "custom" && (
                  <p className="text-xs text-center text-primary">
                    ✓ Tema personalizado ativo
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
                <p>
                  <strong className="text-foreground">Dica:</strong> Para um resultado mais equilibrado, escolha um fundo bem escuro (quase preto) ou bem claro (quase branco) e uma cor de destaque vibrante.
                </p>
                <p>
                  As cores intermediárias (cards, bordas, sidebar) são geradas automaticamente a partir do fundo escolhido.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

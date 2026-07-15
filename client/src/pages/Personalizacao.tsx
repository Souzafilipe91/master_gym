import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Palette, Sliders, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useTheme, THEME_PRESETS, type ThemeColors, type ThemePreset } from "@/hooks/useTheme";
import { toast } from "sonner";

// ─── Conversão de cores ──────────────────────────────────────────────────────

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

function hexToOklch(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  const sl = s / 100;
  const ll = l / 100;
  const oklchL = Math.max(0.05, Math.min(0.98, ll));
  const oklchC = sl * 0.28;
  return `oklch(${oklchL.toFixed(2)} ${oklchC.toFixed(3)} ${h})`;
}

function getContrastFg(backgroundOklch: string): string {
  const match = backgroundOklch.match(/oklch\(([\d.]+)/);
  if (match && parseFloat(match[1]) > 0.5) {
    return "oklch(0.12 0.005 285)";
  }
  return "oklch(0.98 0.005 285)";
}

function oklchToHex(oklch: string): string {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return "#888888";
  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);

  // OKLCH → OKLab
  const hRad = H * Math.PI / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → LMS (cube roots)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  // Cube to get linear LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → Linear sRGB
  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Linear sRGB → sRGB gamma
  const toSrgb = (v: number) => {
    v = Math.max(0, Math.min(1, v));
    return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };

  const toHex = (v: number) => Math.round(toSrgb(v) * 255).toString(16).padStart(2, "0");
  return `#${toHex(rLin)}${toHex(gLin)}${toHex(bLin)}`;
}

// ─── ColorPicker: input visível estilizado como círculo ──────────────────────
// Usar label wrapping o input é o método mais compatível com mobile
// O input type="color" fica com opacity-0 mas posicionado sobre o círculo visual

interface ColorPickerProps {
  label: string;
  value: string; // hex
  onChange: (hex: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Label envolve o input — clique no círculo abre o picker nativamente */}
      <label className="relative w-12 h-12 rounded-full cursor-pointer shrink-0 block" style={{ touchAction: "manipulation" }}>
        {/* Círculo visual */}
        <span
          className="absolute inset-0 rounded-full border-2 border-white/20 shadow-md block"
          style={{ backgroundColor: value }}
        />
        {/* Input real — cobre o círculo inteiro, opacity 0 mas clicável */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
          style={{ padding: 0, border: "none" }}
        />
      </label>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{value}</p>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function Personalizacao() {
  const { activePreset, applyPreset, applyCustom, getCurrentColors } = useTheme();
  const [tab, setTab] = useState<"presets" | "custom">("presets");

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

    const colors: ThemeColors = {
      primary: primaryOklch,
      primaryFg: getContrastFg(primaryOklch),
      background: bgOklch,
      foreground: fgOklch,
      card: isLight
        ? `oklch(from ${bgOklch} calc(l - 0.03) c h)`
        : `oklch(from ${bgOklch} calc(l + 0.03) c h)`,
      sidebar: isLight
        ? `oklch(from ${bgOklch} calc(l - 0.05) c h)`
        : `oklch(from ${bgOklch} calc(l + 0.02) c h)`,
      accent: primaryOklch,
      ring: primaryOklch,
    };

    applyCustom(colors);
    toast.success("Tema personalizado aplicado!");
  }, [primaryHex, bgHex, applyCustom]);

  const fgColor = getContrastFg(hexToOklch(bgHex)) === "oklch(0.98 0.005 285)" ? "#f0f0f0" : "#1a1a1a";
  const primaryFgColor = getContrastFg(hexToOklch(primaryHex)) === "oklch(0.98 0.005 285)" ? "#f0f0f0" : "#1a1a1a";

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
                      <div className="flex gap-1.5 shrink-0">
                        <div
                          className="w-8 h-8 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: preset.colors.background }}
                        />
                        <div
                          className="w-8 h-8 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: preset.colors.primary }}
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
                  Toque nos círculos coloridos para abrir o seletor de cor.
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
                  <div className="p-4" style={{ backgroundColor: bgHex }}>
                    <p className="text-sm font-semibold mb-3" style={{ color: fgColor }}>
                      Preview ao vivo
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <div
                        className="px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{ backgroundColor: primaryHex, color: primaryFgColor }}
                      >
                        Botão primário
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-md text-xs border"
                        style={{ borderColor: primaryHex, color: primaryHex, backgroundColor: "transparent" }}
                      >
                        Outline
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-md text-xs"
                        style={{
                          backgroundColor: `${primaryHex}22`,
                          color: primaryHex,
                        }}
                      >
                        Badge
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleApplyCustom}>
                  <Check className="w-4 h-4 mr-2" />
                  Aplicar Tema Personalizado
                </Button>

                {activePreset === "custom" && (
                  <p className="text-xs text-center text-primary font-medium">
                    ✓ Tema personalizado ativo
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
                <p>
                  <strong className="text-foreground">Dica:</strong> Para melhor resultado, escolha um fundo bem escuro (quase preto) ou bem claro (quase branco) e uma cor de destaque vibrante.
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Clock, Save, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const REST_TIME_KEY = "gym-rest-time-seconds";
const DEFAULT_REST_TIME = 90;

export function getRestTimeFromSettings(): number {
  try {
    const saved = localStorage.getItem(REST_TIME_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_REST_TIME;
  } catch {
    return DEFAULT_REST_TIME;
  }
}

export default function Configuracoes() {
  const [restTime, setRestTime] = useState<number>(DEFAULT_REST_TIME);
  const [inputValue, setInputValue] = useState<string>(String(DEFAULT_REST_TIME));

  useEffect(() => {
    const saved = getRestTimeFromSettings();
    setRestTime(saved);
    setInputValue(String(saved));
  }, []);

  const handleSave = () => {
    const value = parseInt(inputValue, 10);
    if (isNaN(value) || value < 10 || value > 600) {
      toast.error("Tempo inválido. Use entre 10 e 600 segundos.");
      return;
    }
    localStorage.setItem(REST_TIME_KEY, String(value));
    setRestTime(value);
    toast.success("Configurações salvas!");
  };

  const handleReset = () => {
    // Remover a sobreposição para que os tempos originais do programa sejam usados
    localStorage.removeItem(REST_TIME_KEY);
    setRestTime(DEFAULT_REST_TIME);
    setInputValue(String(DEFAULT_REST_TIME));
    toast.success("Sobreposição removida. Os tempos originais do programa serão usados.");
  };

  const handleSliderChange = (value: number[]) => {
    setRestTime(value[0]);
    setInputValue(String(value[0]));
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
  };

  const presets = [
    { label: "30s", value: 30 },
    { label: "60s", value: 60 },
    { label: "90s", value: 90 },
    { label: "2min", value: 120 },
    { label: "3min", value: 180 },
    { label: "5min", value: 300 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Configurações</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl">
        {/* Tempo de Descanso */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Tempo de Descanso Padrão
            </CardTitle>
            <CardDescription>
              Define o tempo de descanso entre séries para todos os treinos.
              Quando configurado, este valor <strong>substitui</strong> o tempo definido no programa para cada exercício.
              Para usar os tempos originais do programa, clique em "Padrão (90s)" e salve.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Valor atual em destaque */}
            <div className="text-center py-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-4xl font-bold text-primary">{formatTime(restTime)}</p>
              <p className="text-sm text-muted-foreground mt-1">Tempo de descanso atual</p>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <Label>Ajustar com o controle deslizante</Label>
              <Slider
                value={[restTime]}
                onValueChange={handleSliderChange}
                min={10}
                max={300}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10s</span>
                <span>1min</span>
                <span>2min</span>
                <span>3min</span>
                <span>5min</span>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <Label>Valores rápidos</Label>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={restTime === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setRestTime(preset.value);
                      setInputValue(String(preset.value));
                    }}
                    className="w-full"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input manual */}
            <div className="space-y-2">
              <Label htmlFor="rest-time-input">Ou digite o valor em segundos</Label>
              <div className="flex gap-2">
                <Input
                  id="rest-time-input"
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  min={10}
                  max={600}
                  placeholder="Ex: 90"
                  className="flex-1"
                />
                <span className="flex items-center text-sm text-muted-foreground px-2">segundos</span>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo: 10s | Máximo: 600s (10min)</p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Usar tempos do programa
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              O tempo configurado aqui <strong className="text-foreground">substitui</strong> o tempo de descanso de todos os exercícios durante o treino, independente do que está definido no programa.
            </p>
            <p>
              Para voltar a usar os tempos originais de cada exercício (definidos no programa), clique em <strong className="text-foreground">"Padrão (90s)"</strong> e salve — isso remove a sobreposição.
            </p>
            <p>
              A configuração é salva localmente no dispositivo e persiste entre sessões.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

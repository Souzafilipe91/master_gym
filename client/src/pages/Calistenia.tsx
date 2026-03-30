import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Dumbbell, Home, Zap, Clock, Target, RefreshCw, Copy, Check, BookmarkPlus, Bookmark, Play } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import ExecutarCalistenia from "./ExecutarCalistenia";

const FOCUS_OPTIONS = [
  { value: "full body", label: "Full Body", emoji: "💪" },
  { value: "peito e tríceps", label: "Peito & Tríceps", emoji: "🏋️" },
  { value: "costas e bíceps", label: "Costas & Bíceps", emoji: "🔙" },
  { value: "pernas e glúteos", label: "Pernas & Glúteos", emoji: "🦵" },
  { value: "ombros e core", label: "Ombros & Core", emoji: "⚡" },
  { value: "core e abdômen", label: "Core & Abdômen", emoji: "🎯" },
];

const DURATION_OPTIONS = [
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

const DIFFICULTY_OPTIONS = [
  { value: "iniciante" as const, label: "Iniciante", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "intermediario" as const, label: "Intermediário", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "avancado" as const, label: "Avançado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

export default function Calistenia() {
  const [focus, setFocus] = useState("full body");
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState<"iniciante" | "intermediario" | "avancado">("intermediario");
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [executing, setExecuting] = useState(false);

  const { data: anamnese } = trpc.anamnese.getMy.useQuery();

  const saveMutation = trpc.savedWorkouts.save.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Treino salvo no seu perfil!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    if (!result) return;
    const focusLabel = FOCUS_OPTIONS.find(f => f.value === focus)?.label || focus;
    saveMutation.mutate({
      type: "calistenia",
      title: `Calistenia ${focusLabel} — ${duration}min (${difficulty})`,
      content: result,
      focus,
      duration,
      difficulty,
    });
  };

  const generateMutation = trpc.calistenia.generate.useMutation({
    onSuccess: (data) => {
      setResult(typeof data.workoutPlan === "string" ? data.workoutPlan : String(data.workoutPlan));
      toast.success("Treino de calistenia gerado!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleGenerate = () => {
    setSaved(false);
    setExecuting(false);
    generateMutation.mutate({ focus, duration, difficulty });
  };

  if (executing && result) {
    const focusLabel = FOCUS_OPTIONS.find(f => f.value === focus)?.label || focus;
    return (
      <ExecutarCalistenia
        workoutContent={result}
        workoutTitle={`Calistenia ${focusLabel}`}
        onFinish={() => setExecuting(false)}
      />
    );
  }

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Treino copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Calistenia em Casa</h1>
              <p className="text-xs text-muted-foreground">Treinos sem equipamento, gerados por IA</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl space-y-6">
        {/* Aviso se não tem anamnese */}
        {!anamnese && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-400">Anamnese não preenchida</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Para gerar treinos personalizados, preencha sua anamnese primeiro.
                </p>
                <Link href="/anamnese/preencher">
                  <Button size="sm" variant="outline" className="mt-2 border-yellow-500/30 text-yellow-400">
                    Preencher Anamnese
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configurações do treino */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Configure seu treino
            </CardTitle>
            <CardDescription>
              Escolha o foco, duração e dificuldade. A IA vai criar um treino personalizado baseado na sua anamnese.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Foco muscular */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-primary" />
                Foco muscular
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FOCUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFocus(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                      focus === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duração */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Duração disponível
              </p>
              <div className="flex gap-2 flex-wrap">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      duration === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dificuldade */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                Nível de dificuldade
              </p>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      difficulty === opt.value
                        ? `${opt.color} border-current`
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !anamnese}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando treino...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Treino de Calistenia
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {generateMutation.isPending && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                </div>
                <p className="font-medium">Criando seu treino personalizado...</p>
                <p className="text-sm text-muted-foreground">
                  A IA está analisando sua anamnese e montando o treino ideal para você
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && !generateMutation.isPending && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  Seu Treino de Calistenia
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    {FOCUS_OPTIONS.find(f => f.value === focus)?.emoji} {focus}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown>{result}</Streamdown>
              </div>
                <div className="mt-6 pt-4 border-t border-border space-y-2">
                  <Button
                    className="w-full h-12 text-base"
                    onClick={() => setExecuting(true)}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar Treino
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Gerar outro
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleSave}
                      disabled={saveMutation.isPending || saved}
                    >
                      {saved ? (
                        <><Bookmark className="w-4 h-4 mr-2 fill-current" />Salvo!</>
                      ) : (
                        <><BookmarkPlus className="w-4 h-4 mr-2" />Salvar</>
                      )}
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>
        )}

        {/* Info card quando não há resultado */}
        {!result && !generateMutation.isPending && (
          <Card className="border-dashed border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Home className="w-10 h-10 opacity-30" />
                <p className="text-sm">
                  Configure o treino acima e clique em <strong className="text-foreground">Gerar Treino</strong> para receber um programa de calistenia personalizado.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <Badge variant="outline" className="text-xs">Sem equipamentos</Badge>
                  <Badge variant="outline" className="text-xs">Baseado na sua anamnese</Badge>
                  <Badge variant="outline" className="text-xs">Com progressão</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Play, Pause, SkipForward, CheckCircle2,
  Timer, Dumbbell, ChevronRight, Trophy, RotateCcw, Home,
  Info, ChevronDown, ChevronUp
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { requestNotificationPermission, notifyRestEnd } from "@/lib/notifications";
import { getExerciseDescriptionByName } from "@/components/ExerciseCard";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CalisthenicsExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number; // segundos
  notes?: string;
}

interface ParsedWorkout {
  title: string;
  exercises: CalisthenicsExercise[];
}

// ─── Parser de markdown para exercícios ──────────────────────────────────────

function parseWorkoutMarkdown(markdown: string): ParsedWorkout {
  const lines = markdown.split("\n").map(l => l.trim()).filter(Boolean);
  const exercises: CalisthenicsExercise[] = [];
  let title = "Treino de Calistenia";

  for (const line of lines) {
    // Título
    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "");
      continue;
    }

    // Exercício: detecta padrões como "- **Flexão de Braço**: 3x12" ou "**Agachamento**: 4x15"
    const exerciseMatch = line.match(/[-*]?\s*\*{1,2}([^*:]+)\*{0,2}[:\s]+(\d+)x([^\s,.(]+)/i);
    if (exerciseMatch) {
      const name = exerciseMatch[1].trim();
      const sets = parseInt(exerciseMatch[2]) || 3;
      const reps = exerciseMatch[3].trim();

      // Detectar descanso na mesma linha
      const restMatch = line.match(/descanso[:\s]+(\d+)\s*(s|seg|min|minuto)/i);
      let rest = 60;
      if (restMatch) {
        rest = restMatch[2].toLowerCase().startsWith("min")
          ? parseInt(restMatch[1]) * 60
          : parseInt(restMatch[1]);
      }

      exercises.push({ name, sets, reps, rest });
    }
  }

  // Fallback: se não parseou nada, cria exercícios genéricos baseados no texto
  if (exercises.length === 0) {
    const genericNames = [
      "Aquecimento", "Exercício Principal 1", "Exercício Principal 2",
      "Exercício Principal 3", "Exercício Complementar", "Alongamento Final"
    ];
    genericNames.forEach((name, i) => {
      exercises.push({ name, sets: i === 0 || i === genericNames.length - 1 ? 1 : 3, reps: "10-12", rest: 60 });
    });
  }

  return { title, exercises };
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface ExecutarCalisteniaProps {
  workoutContent: string;
  workoutTitle: string;
  onFinish?: () => void;
}

export default function ExecutarCalistenia({ workoutContent, workoutTitle, onFinish }: ExecutarCalisteniaProps) {
  const [, navigate] = useLocation();

  // Carregar configuração de descanso do usuário
  const getUserRestTime = () => {
    const saved = localStorage.getItem("gym-rest-time");
    return saved ? parseInt(saved) : null;
  };

  const parsed = parseWorkoutMarkdown(workoutContent);
  const exercises = parsed.exercises;

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [showExerciseDesc, setShowExerciseDesc] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resetar descrição ao mudar de exercício
  useEffect(() => { setShowExerciseDesc(false); }, [currentExIdx]);

  const currentExercise = exercises[currentExIdx];
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const progress = (totalCompleted / totalSets) * 100;

  // Solicitar permissão de notificação ao montar
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Timer de descanso
  useEffect(() => {
    if (restTimerRunning && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setRestTimerRunning(false);
            setIsResting(false);
            notifyRestEnd();
            toast.success("Descanso terminado! Próxima série.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restTimerRunning]);

  const startRest = useCallback((seconds: number) => {
    const userRest = getUserRestTime();
    const restDuration = userRest || seconds;
    setRestTimeLeft(restDuration);
    setIsResting(true);
    setRestTimerRunning(true);
  }, []);

  const skipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimerRunning(false);
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const handleCompleteSet = () => {
    const key = `${currentExIdx}-${currentSet}`;
    setCompletedSets(prev => ({ ...prev, [key]: true }));
    setTotalCompleted(prev => prev + 1);

    const isLastSet = currentSet >= currentExercise.sets;
    const isLastExercise = currentExIdx >= exercises.length - 1;

    if (isLastSet && isLastExercise) {
      // Treino finalizado
      setFinished(true);
      toast.success("🎉 Treino de calistenia concluído!");
      return;
    }

    if (isLastSet) {
      // Próximo exercício
      setCurrentExIdx(prev => prev + 1);
      setCurrentSet(1);
    } else {
      // Próxima série
      setCurrentSet(prev => prev + 1);
    }

    // Iniciar descanso
    startRest(currentExercise.rest);
  };

  const handleSkipExercise = () => {
    skipRest();
    if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx(prev => prev + 1);
      setCurrentSet(1);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const userRestTime = getUserRestTime();
  const restSource = userRestTime ? "configuração pessoal" : "programa";

  // ─── Tela de conclusão ────────────────────────────────────────────────────

  if (finished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Treino Concluído!</h2>
              <p className="text-muted-foreground mt-1">
                Você completou {totalCompleted} séries de calistenia
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-2xl font-bold text-primary">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Séries feitas</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-2xl font-bold text-primary">{exercises.length}</p>
                <p className="text-xs text-muted-foreground">Exercícios</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={onFinish || (() => navigate("/calistenia"))} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Voltar à Calistenia
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Ir para o Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Tela de execução ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onFinish || (() => navigate("/calistenia"))}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-sm font-bold truncate max-w-[180px]">{workoutTitle}</h1>
              <p className="text-xs text-muted-foreground">
                Exercício {currentExIdx + 1}/{exercises.length}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalCompleted}/{totalSets} séries
          </Badge>
        </div>
        {/* Barra de progresso */}
        <Progress value={progress} className="mt-2 h-1.5" />
      </header>

      <main className="container py-6 max-w-lg space-y-4">
        {/* Exercício atual */}
        <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                Exercício {currentExIdx + 1} de {exercises.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={handleSkipExercise}
              >
                Pular <SkipForward className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <CardTitle className="text-xl mt-2">{currentExercise.name}</CardTitle>
            {/* Botão Como Fazer */}
            {(() => {
              const fallback = getExerciseDescriptionByName(currentExercise.name);
              const desc = currentExercise.notes || fallback?.description;
              const tip = fallback?.notes;
              return (
                <>
                  <button
                    onClick={() => setShowExerciseDesc(p => !p)}
                    className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Como fazer este exercício
                    {showExerciseDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {showExerciseDesc && (
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      {desc ? (
                        <p className="text-sm text-foreground leading-relaxed">{desc}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Descrição não disponível. Consulte um profissional.</p>
                      )}
                      {tip && (
                        <p className="text-xs text-primary mt-2 pt-2 border-t border-primary/20">
                          <strong>Dica:</strong> {tip}
                        </p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
            {/* Nota: o IIFE acima não usa hooks, apenas variáveis do escopo do componente */}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info da série */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background/60 rounded-xl p-3 text-center border border-border">
                <p className="text-2xl font-bold text-primary">{currentSet}</p>
                <p className="text-xs text-muted-foreground">Série atual</p>
              </div>
              <div className="bg-background/60 rounded-xl p-3 text-center border border-border">
                <p className="text-2xl font-bold">{currentExercise.sets}</p>
                <p className="text-xs text-muted-foreground">Total séries</p>
              </div>
              <div className="bg-background/60 rounded-xl p-3 text-center border border-border">
                <p className="text-2xl font-bold">{currentExercise.reps}</p>
                <p className="text-xs text-muted-foreground">Repetições</p>
              </div>
            </div>

            {/* Botão de completar série */}
            {!isResting && (
              <Button
                className="w-full h-14 text-base"
                onClick={handleCompleteSet}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Completar Série {currentSet}/{currentExercise.sets}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Timer de descanso */}
        {isResting && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <Timer className="w-5 h-5" />
                <span className="text-sm font-medium">Descanso</span>
                <span className="text-xs text-muted-foreground">({restSource})</span>
              </div>

              <div className="text-6xl font-bold font-mono text-blue-400">
                {formatTime(restTimeLeft)}
              </div>

              <Progress
                value={(1 - restTimeLeft / (getUserRestTime() || currentExercise.rest)) * 100}
                className="h-2"
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-blue-500/30 text-blue-400"
                  onClick={() => setRestTimerRunning(prev => !prev)}
                >
                  {restTimerRunning ? (
                    <><Pause className="w-4 h-4 mr-2" />Pausar</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" />Retomar</>
                  )}
                </Button>
                <Button
                  className="flex-1"
                  onClick={skipRest}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Pular descanso
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de exercícios */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Todos os exercícios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            {exercises.map((ex, idx) => {
              const allSetsCompleted = Array.from({ length: ex.sets }, (_, s) =>
                completedSets[`${idx}-${s + 1}`]
              ).every(Boolean);
              const isCurrent = idx === currentExIdx;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : allSetsCompleted
                      ? "opacity-50"
                      : "opacity-70"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    allSetsCompleted
                      ? "bg-green-500/20 text-green-400"
                      : isCurrent
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {allSetsCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <Dumbbell className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrent ? "text-primary" : ""}`}>
                      {ex.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ex.sets}x{ex.reps}
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs shrink-0">
                      Agora
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Botão de reiniciar */}
        <Button
          variant="ghost"
          className="w-full text-muted-foreground text-xs"
          onClick={() => {
            setCurrentExIdx(0);
            setCurrentSet(1);
            setCompletedSets({});
            setTotalCompleted(0);
            skipRest();
          }}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reiniciar treino
        </Button>
      </main>
    </div>
  );
}

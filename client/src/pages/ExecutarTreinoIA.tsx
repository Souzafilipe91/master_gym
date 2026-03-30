import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Check, Clock, Dumbbell, SkipForward,
  Trophy, TrendingUp, Settings, List, ChevronRight, Play
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { requestNotificationPermission, notifyRestEnd } from "@/lib/notifications";
import { useHaptic } from "@/hooks/useHaptic";

// ─── Parser de markdown para exercícios ──────────────────────────────────────

interface AIExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number; // segundos
  notes?: string;
}

interface ParsedWorkout {
  title: string;
  exercises: AIExercise[];
}

function parseWorkoutMarkdown(markdown: string): ParsedWorkout {
  const lines = markdown.split("\n").map(l => l.trim()).filter(Boolean);
  const exercises: AIExercise[] = [];
  let title = "Treino";

  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "");
      continue;
    }
    // Detecta padrões como "- **Flexão**: 3x12" ou "**Agachamento**: 4x15"
    const exerciseMatch = line.match(/[-*]?\s*\*{1,2}([^*:]+)\*{0,2}[:\s]+(\d+)\s*[xX×]\s*([^\s,.(]+)/i);
    if (exerciseMatch) {
      const name = exerciseMatch[1].trim();
      const sets = parseInt(exerciseMatch[2]) || 3;
      const reps = exerciseMatch[3].trim();
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

  // Fallback se não parseou nada
  if (exercises.length === 0) {
    const genericNames = [
      "Aquecimento", "Exercício 1", "Exercício 2",
      "Exercício 3", "Exercício 4", "Alongamento"
    ];
    genericNames.forEach((name, i) => {
      exercises.push({ name, sets: i === 0 || i === genericNames.length - 1 ? 1 : 3, reps: "10-12", rest: 60 });
    });
  }

  return { title, exercises };
}

function getRestTimeFromSettings(defaultSeconds: number): number {
  const saved = localStorage.getItem("gym-rest-time-seconds");
  if (saved !== null) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= 10) return parsed;
  }
  return defaultSeconds;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ExecutarTreinoIA() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const haptic = useHaptic();
  const workoutId = parseInt(params.id || "0");

  // Buscar treino salvo por id
  const { data: workout } = trpc.savedWorkouts.getById.useQuery(
    { id: workoutId },
    { enabled: workoutId > 0 }
  );

  // Estado do treino
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setData, setSetData] = useState<Record<string, { reps: number; load: number }>>({});
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Solicitar permissão de notificação ao montar
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Timer de descanso
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsResting(false);
            notifyRestEnd();
            haptic.restEnd();
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
  }, [isResting, restTimeLeft]);

  const startRest = useCallback((seconds: number) => {
    const duration = getRestTimeFromSettings(seconds);
    setRestTimeLeft(duration);
    setIsResting(true);
    haptic.restStart();
  }, []);

  const skipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const getSetKey = (exIdx: number, setNum: number) => `${exIdx}-${setNum}`;

  const getSetValues = (exIdx: number, setNum: number) => {
    const key = getSetKey(exIdx, setNum);
    return setData[key] || { reps: 10, load: 0 };
  };

  const updateSetValues = (exIdx: number, setNum: number, field: 'reps' | 'load', value: number) => {
    const key = getSetKey(exIdx, setNum);
    setSetData(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { reps: 10, load: 0 }), [field]: value }
    }));
  };

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  const parsed = parseWorkoutMarkdown(workout.content);
  const exercises = parsed.exercises;
  const currentExercise = exercises[currentExIdx];
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedCount = completedSets.size;
  const progress = totalSets > 0 ? (completedCount / totalSets) * 100 : 0;

  const handleCompleteSet = () => {
    const key = getSetKey(currentExIdx, currentSet);
    const newCompleted = new Set(completedSets);
    newCompleted.add(key);
    setCompletedSets(newCompleted);
    haptic.setComplete();

    const isLastSet = currentSet >= currentExercise.sets;
    const isLastExercise = currentExIdx >= exercises.length - 1;

    if (isLastSet && isLastExercise) {
      haptic.workoutComplete();
      setFinished(true);
      toast.success("🎉 Treino concluído! Excelente trabalho!");
      return;
    }

    if (isLastSet) {
      setCurrentExIdx(prev => prev + 1);
      setCurrentSet(1);
      haptic.success();
    } else {
      setCurrentSet(prev => prev + 1);
    }

    startRest(currentExercise.rest);
  };

  const handleSkipExercise = () => {
    skipRest();
    haptic.medium();
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

  const userRestTime = localStorage.getItem("gym-rest-time-seconds");
  const isUserConfig = userRestTime !== null && !isNaN(parseInt(userRestTime, 10));
  const currentSetValues = getSetValues(currentExIdx, currentSet);

  // ─── Tela de conclusão ────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Treino Concluído!</h1>
          <p className="text-muted-foreground mb-2">{workout.title}</p>
          <p className="text-sm text-muted-foreground mb-8">
            {exercises.length} exercícios · {totalSets} séries completadas
          </p>
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate("/meus-treinos")}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Meus Treinos
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setCurrentExIdx(0);
              setCurrentSet(1);
              setCompletedSets(new Set());
              setSetData({});
              setFinished(false);
            }}>
              <Play className="w-5 h-5 mr-2" />
              Repetir Treino
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tela de execução ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/meus-treinos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <div className="text-center">
              <h1 className="text-base font-bold truncate max-w-[180px]">{workout.title}</h1>
              <p className="text-xs text-muted-foreground">
                Exercício {currentExIdx + 1} de {exercises.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExerciseList(!showExerciseList)}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          {/* Barra de progresso */}
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Lista de exercícios (dropdown) */}
      {showExerciseList && (
        <div className="container py-3 border-b border-border bg-card/80">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Exercícios</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {exercises.map((ex, i) => {
              const done = Array.from({ length: ex.sets }, (_, s) =>
                completedSets.has(getSetKey(i, s + 1))
              ).every(Boolean);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentExIdx(i);
                    setCurrentSet(1);
                    skipRest();
                    setShowExerciseList(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                    i === currentExIdx
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="flex-1 truncate">{ex.name}</span>
                  <span className="text-xs text-muted-foreground">{ex.sets}×{ex.reps}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="container py-6 max-w-2xl">
        {/* Timer de Descanso */}
        {isResting && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="py-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-primary animate-pulse" />
              <h2 className="text-5xl font-bold mb-2 tabular-nums">{formatTime(restTimeLeft)}</h2>
              <p className="text-muted-foreground mb-2">Tempo de descanso</p>
              {isUserConfig ? (
                <p className="text-xs text-primary/70 mb-4 flex items-center justify-center gap-1">
                  <Settings className="w-3 h-3" />
                  Configuração pessoal ({userRestTime}s)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Tempo do programa</p>
              )}
              <Button onClick={skipRest} variant="outline">
                <SkipForward className="w-4 h-4 mr-2" />
                Pular Descanso
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exercício Atual */}
        {!isResting && (
          <>
            {/* Card do exercício */}
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{currentExIdx + 1}</span>
                      </div>
                      <CardTitle className="text-xl">{currentExercise.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 ml-10">
                      <Badge variant="secondary" className="text-xs">
                        {currentExercise.sets} séries × {currentExercise.reps}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Série {currentSet} de {currentExercise.sets}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Indicador visual de séries */}
                <div className="flex gap-2 mt-3 ml-10">
                  {Array.from({ length: currentExercise.sets }, (_, i) => {
                    const setNum = i + 1;
                    const isDone = completedSets.has(getSetKey(currentExIdx, setNum));
                    const isCurrent = setNum === currentSet;
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                          isDone
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : setNum}
                      </div>
                    );
                  })}
                </div>
              </CardHeader>
            </Card>

            {/* Inputs de Repetições e Carga */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Registrar Série {currentSet}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Repetições</label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={currentSetValues.reps}
                      onChange={(e) => updateSetValues(currentExIdx, currentSet, 'reps', parseInt(e.target.value) || 0)}
                      className="text-lg font-semibold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Carga (kg)</label>
                    <div className="flex gap-1 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-xs"
                        onClick={() => updateSetValues(currentExIdx, currentSet, 'load', Math.max(0, currentSetValues.load - 2.5))}
                      >
                        -2.5
                      </Button>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={currentSetValues.load}
                        onChange={(e) => updateSetValues(currentExIdx, currentSet, 'load', parseFloat(e.target.value) || 0)}
                        className="text-lg font-semibold text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-xs"
                        onClick={() => updateSetValues(currentExIdx, currentSet, 'load', currentSetValues.load + 2.5)}
                      >
                        +2.5
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Sugestão:</strong> {currentExercise.reps} repetições
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Descanso:{" "}
                    {isUserConfig ? (
                      <span className="text-primary font-medium">{userRestTime}s (pessoal)</span>
                    ) : (
                      <span>{currentExercise.rest}s (programa)</span>
                    )}
                  </p>
                </div>

                {currentExercise.notes && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400">{currentExercise.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full h-14 text-base"
                onClick={handleCompleteSet}
              >
                <Check className="w-5 h-5 mr-2" />
                Completar Série {currentSet}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkipExercise}
                  disabled={currentExIdx >= exercises.length - 1}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Pular Exercício
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Encerrar o treino agora?")) {
                      setFinished(true);
                    }
                  }}
                >
                  Encerrar Treino
                </Button>
              </div>
            </div>

            {/* Próximo exercício */}
            {currentExIdx < exercises.length - 1 && (
              <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg flex items-center gap-3">
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Próximo exercício</p>
                  <p className="text-sm font-medium">{exercises[currentExIdx + 1].name}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

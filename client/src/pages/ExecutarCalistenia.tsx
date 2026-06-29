import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Check, Clock, SkipForward, List,
  ChevronRight, Trophy, X, Settings, Maximize, Minimize, TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { requestNotificationPermission, notifyRestEnd } from "@/lib/notifications";
import ExerciseCard from "@/components/ExerciseCard";
import { useHaptic } from "@/hooks/useHaptic";
import { useFullscreen } from "@/hooks/useFullscreen";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CalisthenicsExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
  description?: string;
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
  let currentExercise: Partial<CalisthenicsExercise> | null = null;
  let descriptionLines: string[] = [];

  const flushExercise = () => {
    if (currentExercise?.name) {
      exercises.push({
        name: currentExercise.name,
        sets: currentExercise.sets ?? 3,
        reps: currentExercise.reps ?? "10",
        rest: currentExercise.rest ?? 60,
        notes: currentExercise.notes,
        description: descriptionLines.length > 0 ? descriptionLines.join(" ") : undefined,
      });
    }
    currentExercise = null;
    descriptionLines = [];
  };

  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "");
      continue;
    }

    if (line.startsWith("### ")) {
      flushExercise();
      currentExercise = { name: line.replace(/^###\s+/, "").replace(/\*+/g, "").trim() };
      continue;
    }

    const exerciseMatch = line.match(/[-*]?\s*\*{1,2}([^*:]+)\*{0,2}[:\s]+(\d+)x([^\s,.(]+)/i);
    if (exerciseMatch) {
      flushExercise();
      const restMatch = line.match(/descanso[:\s]+(\d+)\s*(s|seg|min|minuto)/i);
      let rest = 60;
      if (restMatch) {
        rest = restMatch[2].toLowerCase().startsWith("min")
          ? parseInt(restMatch[1]) * 60
          : parseInt(restMatch[1]);
      }
      currentExercise = {
        name: exerciseMatch[1].trim(),
        sets: parseInt(exerciseMatch[2]) || 3,
        reps: exerciseMatch[3].trim(),
        rest,
      };
      continue;
    }

    if (currentExercise) {
      const restLine = line.match(/descanso[:\s]+(\d+)\s*(s|seg|min|minuto)/i);
      if (restLine) {
        currentExercise.rest = restLine[2].toLowerCase().startsWith("min")
          ? parseInt(restLine[1]) * 60
          : parseInt(restLine[1]);
        continue;
      }
      const setsLine = line.match(/(\d+)\s*[sx×]\s*(\S+)/i);
      if (setsLine && !currentExercise.sets) {
        currentExercise.sets = parseInt(setsLine[1]);
        currentExercise.reps = setsLine[2];
        continue;
      }
      const execLine = line.match(/execu[çc][aã]o[:\s]+(.+)/i);
      if (execLine) {
        descriptionLines.push(execLine[1].trim());
        continue;
      }
      const notesLine = line.match(/dica[s]?[:\s]+(.+)/i);
      if (notesLine) {
        currentExercise.notes = notesLine[1].trim();
        continue;
      }
    }
  }
  flushExercise();

  if (exercises.length === 0) {
    ["Agachamento", "Flexão de Braço", "Prancha", "Burpee", "Mountain Climber", "Afundo"].forEach((name, i) => {
      exercises.push({ name, sets: i === 2 || i === 4 ? 3 : 3, reps: i === 2 ? "30s" : "10-12", rest: 60 });
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
  const haptic = useHaptic();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const parsed = parseWorkoutMarkdown(workoutContent);
  const exercises = parsed.exercises;

  // Chave única de localStorage para este treino
  const storageKey = `calistenia-progress-${workoutTitle.replace(/\s+/g, "-").toLowerCase()}`;

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [repsData, setRepsData] = useState<Record<number, number[]>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [prExercise, setPrExercise] = useState<string | null>(null);
  const [workoutStartTime] = useState(new Date());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Restaurar estado salvo ───────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setCurrentExIdx(p.currentExIdx ?? 0);
        setCurrentSet(p.currentSet ?? 1);
        setCompletedSets(p.completedSets ?? {});
        setRepsData(p.repsData ?? {});
        setTotalCompleted(p.totalCompleted ?? 0);
      } catch { /* ignora estado corrompido */ }
    }
  }, [storageKey]);

  // ─── Salvar estado automaticamente ───────────────────────────────────────

  useEffect(() => {
    if (finished) return;
    localStorage.setItem(storageKey, JSON.stringify({
      currentExIdx, currentSet, completedSets, repsData, totalCompleted,
      timestamp: new Date().toISOString(),
    }));
  }, [currentExIdx, currentSet, completedSets, repsData, totalCompleted, finished, storageKey]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // ─── Timer de descanso ────────────────────────────────────────────────────

  useEffect(() => {
    if (restTimerRunning && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setRestTimerRunning(false);
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [restTimerRunning]);

  const getUserRestTime = () => {
    const saved = localStorage.getItem("gym-rest-time-seconds");
    return saved && !isNaN(parseInt(saved)) ? parseInt(saved) : null;
  };

  const startRest = useCallback((defaultSeconds: number) => {
    const duration = getUserRestTime() ?? defaultSeconds;
    setRestTimeLeft(duration);
    setIsResting(true);
    setRestTimerRunning(true);
    haptic.restStart();
  }, []);

  const skipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimerRunning(false);
    setIsResting(false);
    setRestTimeLeft(0);
  };

  // ─── Progresso geral ──────────────────────────────────────────────────────

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const progress = totalSets > 0 ? (totalCompleted / totalSets) * 100 : 0;
  const currentExercise = exercises[currentExIdx];

  const getCurrentReps = () => {
    const d = repsData[currentExIdx];
    return d?.[currentSet - 1] ?? 0;
  };

  const setCurrentReps = (value: number) => {
    setRepsData(prev => {
      const arr = [...(prev[currentExIdx] ?? [])];
      arr[currentSet - 1] = value;
      return { ...prev, [currentExIdx]: arr };
    });
  };

  // Melhor resultado de reps anterior (PR por exercício, salvo em localStorage)
  const getPrKey = (name: string) => `calistenia-pr-${name.toLowerCase()}`;
  const getPreviousPR = (name: string) => {
    const v = localStorage.getItem(getPrKey(name));
    return v ? parseInt(v) : 0;
  };
  const savePR = (name: string, reps: number) => {
    localStorage.setItem(getPrKey(name), reps.toString());
  };

  // ─── Completar série ──────────────────────────────────────────────────────

  const handleCompleteSet = () => {
    const key = `${currentExIdx}-${currentSet}`;
    setCompletedSets(prev => ({ ...prev, [key]: true }));
    setTotalCompleted(prev => prev + 1);
    haptic.setComplete();

    // Verificar PR (máximo de reps)
    const reps = getCurrentReps();
    if (reps > 0) {
      const prevPR = getPreviousPR(currentExercise.name);
      if (reps > prevPR) {
        savePR(currentExercise.name, reps);
        setPrExercise(currentExercise.name);
        haptic.success();
        toast.success(`🏆 Novo PR! ${reps} reps em ${currentExercise.name}!`, {
          description: prevPR > 0 ? `Anterior: ${prevPR} reps. Superado por ${reps - prevPR}!` : "Primeiro registro!",
          duration: 5000,
        });
      }
    }

    const isLastSet = currentSet >= currentExercise.sets;
    const isLastExercise = currentExIdx >= exercises.length - 1;

    if (isLastSet && isLastExercise) {
      setFinished(true);
      localStorage.removeItem(storageKey);
      haptic.workoutComplete();
      toast.success("🎉 Treino de calistenia concluído!");
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
    haptic.medium();
    skipRest();
    if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx(prev => prev + 1);
      setCurrentSet(1);
    }
  };

  const handleJumpToExercise = (idx: number) => {
    haptic.light();
    skipRest();
    setCurrentExIdx(idx);
    setCurrentSet(1);
    setShowExerciseList(false);
  };

  const handleEndEarly = () => {
    setShowEndDialog(false);
    localStorage.removeItem(storageKey);
    toast.success("Treino encerrado e salvo!");
    if (onFinish) onFinish();
    else navigate("/calistenia");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const userRestTime = getUserRestTime();

  // ─── Tela de conclusão ────────────────────────────────────────────────────

  if (finished) {
    const duration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000);
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
                {workoutTitle}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-2xl font-bold text-primary">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Séries</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-2xl font-bold text-primary">{exercises.length}</p>
                <p className="text-xs text-muted-foreground">Exercícios</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-2xl font-bold text-primary">{duration}m</p>
                <p className="text-xs text-muted-foreground">Duração</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={onFinish ?? (() => navigate("/calistenia"))} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
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
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onFinish ?? (() => navigate("/calistenia"))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>

            <div className="text-center">
              <h1 className="text-base font-bold truncate max-w-[160px]">{workoutTitle}</h1>
              <p className="text-xs text-muted-foreground">
                Exercício {currentExIdx + 1} de {exercises.length}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowExerciseList(true); haptic.light(); }}
                title="Lista de exercícios"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { toggleFullscreen(); haptic.light(); }}
                title="Tela cheia"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container py-6">

        {/* Timer de descanso */}
        {isResting && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="py-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-primary animate-pulse" />
              <h2 className="text-4xl font-bold mb-2">{formatTime(restTimeLeft)}</h2>
              <p className="text-muted-foreground mb-2">Tempo de descanso</p>
              {userRestTime !== null ? (
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

        {/* Exercício atual */}
        {!isResting && currentExercise && (
          <>
            <ExerciseCard
              index={currentExIdx + 1}
              name={currentExercise.name}
              sets={currentExercise.sets}
              reps={currentExercise.reps}
              currentSet={currentSet}
              completedSetKeys={new Set(Object.keys(completedSets).filter(k => completedSets[k]))}
              getSetKey={(exIdx, setNum) => `${exIdx - 1}-${setNum}`}
              description={currentExercise.description}
              notes={currentExercise.notes}
            />

            {/* Registro de repetições */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Registrar Série {currentSet}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs mx-auto">
                  <label className="text-sm text-muted-foreground mb-2 block text-center">
                    Repetições realizadas
                  </label>
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentReps(Math.max(0, getCurrentReps() - 1))}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={getCurrentReps() || ""}
                      placeholder={currentExercise.reps}
                      onChange={e => setCurrentReps(parseInt(e.target.value) || 0)}
                      className="text-xl font-bold text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentReps(getCurrentReps() + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Sugestão e descanso */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Meta:</strong> {currentExercise.reps} repetições
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Descanso:{" "}
                    {userRestTime !== null ? (
                      <span className="text-primary font-medium">{userRestTime}s (pessoal)</span>
                    ) : (
                      <span>{currentExercise.rest}s (programa)</span>
                    )}
                  </p>
                </div>

                {/* PR anterior */}
                {(() => {
                  const pr = getPreviousPR(currentExercise.name);
                  if (!pr) return null;
                  return (
                    <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                      <p className="text-sm font-medium text-primary flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Melhor: {pr} reps
                      </p>
                      {prExercise === currentExercise.name && (
                        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                          <Trophy className="w-3 h-3 mr-1" />
                          Novo PR!
                        </Badge>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={handleCompleteSet}>
                <Check className="w-5 h-5 mr-2" />
                {currentSet >= currentExercise.sets && currentExIdx >= exercises.length - 1
                  ? "Finalizar Treino"
                  : currentSet >= currentExercise.sets
                  ? "Próximo Exercício"
                  : "Completar Série"}
              </Button>

              <Button size="lg" variant="outline" className="w-full" onClick={handleSkipExercise}>
                <SkipForward className="w-5 h-5 mr-2" />
                Pular Exercício
              </Button>

              <Button
                size="lg"
                variant="destructive"
                className="w-full"
                onClick={() => { setShowEndDialog(true); haptic.light(); }}
              >
                <X className="w-5 h-5 mr-2" />
                Encerrar Treino
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Modal — Lista de exercícios */}
      <Dialog open={showExerciseList} onOpenChange={setShowExerciseList}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exercícios do Treino</DialogTitle>
            <DialogDescription>Selecione para ir diretamente a qualquer exercício</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {exercises.map((ex, idx) => {
              const isCurrent = idx === currentExIdx;
              const isDone = idx < currentExIdx;
              return (
                <button
                  key={idx}
                  onClick={() => handleJumpToExercise(idx)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 hover:bg-accent/50 ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : isDone
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-muted-foreground">{idx + 1}</span>
                        <h3 className="font-semibold">{ex.name}</h3>
                        {isCurrent && <Badge variant="default" className="ml-2">Atual</Badge>}
                        {isDone && (
                          <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
                            <Check className="w-3 h-3 mr-1" />
                            Completo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{ex.sets} séries</span>
                        <span>•</span>
                        <span>{ex.reps} reps</span>
                        <span>•</span>
                        <span>{ex.rest}s descanso</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog — Encerrar antecipado */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar Treino Antecipadamente?</DialogTitle>
            <DialogDescription>
              Você completou {currentExIdx} de {exercises.length} exercícios.
              <br /><br />
              O progresso será descartado, mas você pode recomeçar quando quiser.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button size="lg" variant="destructive" className="w-full" onClick={handleEndEarly}>
              <X className="w-5 h-5 mr-2" />
              Sim, Encerrar
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => { setShowEndDialog(false); haptic.light(); }}
            >
              Continuar Treinando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

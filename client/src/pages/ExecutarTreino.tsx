import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Clock, Dumbbell, Play, Pause, SkipForward, Maximize, Minimize, List, ChevronRight, X, Calculator, Trophy, TrendingUp, Settings } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";

import { useHaptic } from "@/hooks/useHaptic";
import { useFullscreen } from "@/hooks/useFullscreen";
import { notifyRestEnd, requestNotificationPermission } from "@/lib/notifications";
import { getRestTimeFromSettings } from "./Configuracoes";
import ExerciseCard from "@/components/ExerciseCard";

export default function ExecutarTreino() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const workoutCode = params.code?.toUpperCase();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [exerciseData, setExerciseData] = useState<Record<number, { sets: Array<{ reps: number; load: number }> }>>({});

  const [workoutStartTime] = useState(new Date());
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showEndWorkoutDialog, setShowEndWorkoutDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [prExerciseId, setPrExerciseId] = useState<number | null>(null);
  const haptic = useHaptic();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const { data: workoutType } = trpc.workoutTypes.getByCode.useQuery(
    { code: workoutCode || "" },
    { enabled: !!workoutCode }
  );

  const { data: cycles } = trpc.cycles.getAll.useQuery();
  const savedCycleId = localStorage.getItem("gym-selected-cycle-id");
  const currentCycle = savedCycleId
    ? (cycles?.find((c) => c.id === parseInt(savedCycleId)) ?? cycles?.[0])
    : cycles?.[0];

  const { data: workoutExercises } = trpc.workoutExercises.getByCycleAndType.useQuery(
    { cycleId: currentCycle?.id || 0, workoutTypeId: workoutType?.id || 0 },
    { enabled: !!currentCycle && !!workoutType }
  );

  const { data: allExercises } = trpc.exercises.getAll.useQuery();

  const createWorkoutLog = trpc.workoutLogs.create.useMutation();
  const createExerciseLog = trpc.exerciseLogs.create.useMutation();

  const exercisesWithDetails = workoutExercises?.map((we) => {
    const exercise = allExercises?.find((e) => e.id === we.exerciseId);
    return {
      ...we,
      exerciseName: exercise?.name || "Exercício",
    };
  });

  const currentExercise = exercisesWithDetails?.[currentExerciseIndex];
  
  // Buscar último log do exercício atual
  const { data: lastLog } = trpc.exerciseLogs.getLastLog.useQuery(
    { exerciseId: currentExercise?.exerciseId || 0 },
    { enabled: !!currentExercise?.exerciseId }
  );

  // Buscar últimos 3 logs para histórico inline
  const { data: recentLogs } = trpc.exerciseLogs.getRecentLogs.useQuery(
    { exerciseId: currentExercise?.exerciseId || 0, limit: 3 },
    { enabled: !!currentExercise?.exerciseId }
  );

  // Chave do localStorage para este treino
  const storageKey = `workout-progress-${workoutCode}`;

  // Restaurar estado salvo ao montar componente
  useEffect(() => {
    if (!workoutCode) return;
    
    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setCurrentExerciseIndex(parsed.currentExerciseIndex || 0);
        setCurrentSet(parsed.currentSet || 1);
        setExerciseData(parsed.exerciseData || {});
      } catch (error) {
        console.error('Erro ao restaurar estado do treino:', error);
      }
    }
  }, [workoutCode]);

  // Salvar estado automaticamente quando mudar
  useEffect(() => {
    if (!workoutCode) return;
    
    const state = {
      currentExerciseIndex,
      currentSet,
      exerciseData,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [currentExerciseIndex, currentSet, exerciseData, workoutCode, storageKey]);

  // Solicitar permissão de notificação ao iniciar o treino
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Timer de descanso
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      const timer = setTimeout(() => {
        setRestTimeLeft(restTimeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (restTimeLeft === 0 && isResting) {
      setIsResting(false);
      haptic.restEnd(); // Vibração ao fim do descanso
      // Enviar notificação push (funciona com tela bloqueada)
      notifyRestEnd();
    }
  }, [isResting, restTimeLeft]);

  const parseRestTime = (restTime: string | null): number => {
    // A configuração global do usuário sempre tem prioridade.
    // O valor do banco (restTime do exercício) é o padrão do programa,
    // mas se o usuário alterou nas Configurações, esse valor prevalece.
    const REST_TIME_KEY = "gym-rest-time-seconds";
    const DEFAULT_REST_TIME = 90;
    const userSavedTime = localStorage.getItem(REST_TIME_KEY);
    
    // Se o usuário salvou uma configuração explícita, usar ela
    if (userSavedTime !== null) {
      const parsed = parseInt(userSavedTime, 10);
      if (!isNaN(parsed) && parsed >= 10) return parsed;
    }
    
    // Caso contrário, usar o valor definido no programa para o exercício
    if (!restTime) return DEFAULT_REST_TIME;
    const match = restTime.match(/(\d+)/);
    return match ? parseInt(match[1]) : DEFAULT_REST_TIME;
  };

  const handleCompleteSet = () => {
    const exerciseId = currentExercise?.exerciseId;
    if (!exerciseId) return;

    const data = exerciseData[exerciseId] || { sets: [] };
    const currentSetData = data.sets[currentSet - 1] || { reps: 10, load: 0 };
    
    // Salvar dados da série
    const newData = { ...exerciseData };
    if (!newData[exerciseId]) {
      newData[exerciseId] = { sets: [] };
    }
    newData[exerciseId].sets[currentSet - 1] = currentSetData;
    setExerciseData(newData);

    // Vibração ao completar série
    haptic.setComplete();

    // Verificar PR (Personal Record) — carga maior que o último registro
    const currentLoad = currentSetData.load;
    if (currentLoad > 0 && lastLog && currentLoad > Number(lastLog.load)) {
      setPrExerciseId(currentExercise?.exerciseId || null);
      haptic.success();
      toast.success(`🏆 Novo PR! ${currentLoad}kg no ${currentExercise?.exerciseName}!`, {
        description: `Anterior: ${lastLog.load}kg. Superado por ${(currentLoad - Number(lastLog.load)).toFixed(1)}kg!`,
        duration: 5000,
      });
    }

    // Verificar se completou todas as séries do exercício
    if (currentSet >= (currentExercise?.sets || 0)) {
      // Próximo exercício
      if (currentExerciseIndex < (exercisesWithDetails?.length || 0) - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        haptic.success();
      } else {
        // Treino completo!
        haptic.workoutComplete();
        setShowFinishDialog(true);
      }
    } else {
      // Próxima série
      setCurrentSet(currentSet + 1);
      const restSeconds = parseRestTime(currentExercise?.restTime || null);
      setRestTimeLeft(restSeconds);
      setIsResting(true);
      haptic.restStart();
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const handleSkipExercise = () => {
    haptic.medium();
    
    // Cancelar descanso se estiver ativo
    setIsResting(false);
    setRestTimeLeft(0);
    
    // Ir para próximo exercício
    if (currentExerciseIndex < (exercisesWithDetails?.length || 0) - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
    } else {
      // Se for o último, finalizar treino
      handleFinishWorkout();
    }
  };

  const handleJumpToExercise = (index: number) => {
    haptic.light();
    
    // Cancelar descanso se estiver ativo
    setIsResting(false);
    setRestTimeLeft(0);
    
    // Navegar para o exercício selecionado
    setCurrentExerciseIndex(index);
    setCurrentSet(1);
    
    // Fechar modal
    setShowExerciseList(false);
  };

  const handleEndWorkoutEarly = async () => {
    setShowEndWorkoutDialog(false);
    await handleFinishWorkout();
  };

  const handleFinishWorkout = async (userNotes?: string) => {
    if (!currentCycle || !workoutType) return;

    const durationMin = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000);
    const autoNote = `Treino realizado em ${durationMin} minutos`;
    const finalNotes = userNotes
      ? `${autoNote}. ${userNotes}`
      : autoNote;

    try {
      const workoutLog = await createWorkoutLog.mutateAsync({
        workoutTypeId: workoutType.id,
        cycleId: currentCycle.id,
        workoutDate: (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })(),
        notes: finalNotes,
      });

      // Atualizar para marcar como completo
      if (workoutLog && typeof workoutLog === 'object' && 'id' in workoutLog) {
        const logId = (workoutLog as any).id;

        // Criar logs dos exercícios
        for (const [exerciseId, data] of Object.entries(exerciseData)) {
          for (let setNum = 0; setNum < data.sets.length; setNum++) {
            const setData = data.sets[setNum];
            await createExerciseLog.mutateAsync({
              workoutLogId: logId,
              exerciseId: parseInt(exerciseId),
              setNumber: setNum + 1,
              reps: setData.reps,
              load: setData.load.toString(),
            });
          }
        }
      }

      // Limpar estado salvo do localStorage
      localStorage.removeItem(storageKey);
      
      // Redirecionar para histórico
      setLocation("/historico");
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
    }
  };

  const updateCurrentSetData = (field: 'reps' | 'load', value: number) => {
    const exerciseId = currentExercise?.exerciseId;
    if (!exerciseId) return;

    const data = exerciseData[exerciseId] || { sets: [] };
    const currentSetData = data.sets[currentSet - 1] || { 
      reps: 10, 
      load: 0 
    };
    
    currentSetData[field] = value;
    
    const newData = { ...exerciseData };
    if (!newData[exerciseId]) {
      newData[exerciseId] = { sets: [] };
    }
    newData[exerciseId].sets[currentSet - 1] = currentSetData;
    setExerciseData(newData);
  };

  const getCurrentSetData = () => {
    const exerciseId = currentExercise?.exerciseId;
    if (!exerciseId) return { reps: 10, load: 0 };

    const data = exerciseData[exerciseId];
    if (!data || !data.sets[currentSet - 1]) {
      // Pré-popular com carga do último treino registrado
      const lastLoad = lastLog ? Number(lastLog.load) : 0;
      const lastReps = lastLog ? Number(lastLog.reps) : 10;
      return { reps: lastReps, load: lastLoad };
    }
    return data.sets[currentSet - 1];
  };

  if (!currentExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  const currentSetData = getCurrentSetData();
  const progress = ((currentExerciseIndex * 100) + ((currentSet / (currentExercise.sets || 1)) * 100)) / (exercisesWithDetails?.length || 1);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/treino/${workoutCode}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Link>
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-bold">Treino {workoutCode}</h1>
              <p className="text-xs text-muted-foreground">
                Exercício {currentExerciseIndex + 1} de {exercisesWithDetails?.length}
              </p>
            </div>            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowExerciseList(true);
                  haptic.light();
                }}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                asChild
              >
                <Link href="/calculadora-1rm" target="_blank">
                  <Calculator className="w-4 h-4" />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  toggleFullscreen();
                  haptic.light();
                }}
                title="Tela cheia"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
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

      {/* Main Content */}
      <main className="container py-6">
        {/* Timer de Descanso */}
        {isResting && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="py-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-primary animate-pulse" />
              <h2 className="text-3xl font-bold mb-2">{restTimeLeft}s</h2>
              <p className="text-muted-foreground mb-2">Tempo de descanso</p>
              {/* Indicar qual configuração está ativa */}
              {(() => {
                const userTime = localStorage.getItem("gym-rest-time-seconds");
                const isUserConfig = userTime !== null && !isNaN(parseInt(userTime, 10));
                return isUserConfig ? (
                  <p className="text-xs text-primary/70 mb-4 flex items-center justify-center gap-1">
                    <Settings className="w-3 h-3" />
                    Configuração pessoal ({userTime}s)
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mb-4">
                    Tempo do programa
                  </p>
                );
              })()}
              <Button onClick={handleSkipRest} variant="outline">
                <SkipForward className="w-4 h-4 mr-2" />
                Pular Descanso
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exercício Atual */}
        {!isResting && (
          <>
            <ExerciseCard
              index={currentExerciseIndex + 1}
              name={currentExercise.exerciseName}
              sets={currentExercise.sets}
              reps={currentExercise.reps || "10-12"}
              currentSet={currentSet}
              completedSetKeys={new Set(
                Object.entries(exerciseData)
                  .flatMap(([exId, d]) =>
                    d.sets.map((_, si) => `${exId}-${si + 1}`)
                  )
              )}
              getSetKey={(exIdx, setNum) => `${currentExercise.exerciseId}-${setNum}`}
              technique={currentExercise.technique ?? undefined}
            />

            {/* Inputs de Repetições e Carga */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Registrar Série {currentSet}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Repetições</label>
                    <Input
                      type="number"
                      value={currentSetData.reps}
                      onChange={(e) => updateCurrentSetData('reps', parseInt(e.target.value) || 0)}
                      className="text-lg font-semibold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Carga (kg)</label>
                    <div className="flex gap-2 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateCurrentSetData('load', Math.max(0, currentSetData.load - 2.5))}
                        className="shrink-0"
                      >
                        -2.5
                      </Button>
                      <Input
                        type="number"
                        step="0.5"
                        value={currentSetData.load}
                        onChange={(e) => updateCurrentSetData('load', parseFloat(e.target.value) || 0)}
                        className="text-lg font-semibold text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateCurrentSetData('load', currentSetData.load + 2.5)}
                        className="shrink-0"
                      >
                        +2.5
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Sugestão:</strong> {currentExercise.reps} repetições com {currentExercise.initialLoad}kg
                  </p>
                  {(() => {
                    const userTime = localStorage.getItem("gym-rest-time-seconds");
                    const isUserConfig = userTime !== null && !isNaN(parseInt(userTime, 10));
                    return (
                      <p className="text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Descanso: {isUserConfig ? (
                          <span className="text-primary font-medium">{userTime}s (pessoal)</span>
                        ) : (
                          <span>{currentExercise.restTime || '90s'} (programa)</span>
                        )}
                      </p>
                    );
                  })()}
                </div>

                {/* Histórico inline dos últimos 3 treinos */}
                {recentLogs && recentLogs.length > 0 && (
                  <div className="mt-3 p-3 bg-muted/50 border border-border rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Últimos treinos
                    </p>
                    <div className="space-y-1">
                      {recentLogs.map((log, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            {new Date(log.workoutDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                          <span className="font-medium">
                            {log.reps} reps × {log.load}kg
                            {i === 0 && prExerciseId === currentExercise?.exerciseId && (
                              <span className="ml-1 text-yellow-500">🏆 PR</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {lastLog && (
                  <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary">
                        Última vez: {lastLog.reps} reps com {lastLog.load}kg
                      </p>
                      {prExerciseId === currentExercise?.exerciseId && (
                        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                          <Trophy className="w-3 h-3 mr-1" />
                          PR!
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(lastLog.workoutDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleCompleteSet}
              >
                <Check className="w-5 h-5 mr-2" />
                {currentSet >= currentExercise.sets && currentExerciseIndex >= (exercisesWithDetails?.length || 0) - 1
                  ? "Finalizar Treino"
                  : currentSet >= currentExercise.sets
                  ? "Próximo Exercício"
                  : "Completar Série"}
              </Button>
              
              {/* Botão de Pular Exercício */}
              <Button 
                size="lg" 
                variant="outline"
                className="w-full"
                onClick={handleSkipExercise}
              >
                <SkipForward className="w-5 h-5 mr-2" />
                Pular Exercício
              </Button>
              
              {/* Botão de Encerrar Treino Antecipadamente */}
              <Button 
                size="lg" 
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setShowEndWorkoutDialog(true);
                  haptic.light();
                }}
              >
                <X className="w-5 h-5 mr-2" />
                Encerrar Treino
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Modal de GIF */}


      {/* Modal de Lista de Exercícios */}
      <Dialog open={showExerciseList} onOpenChange={setShowExerciseList}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exercícios do Treino {workoutCode}</DialogTitle>
            <DialogDescription>
              Selecione um exercício para ir diretamente para ele
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 mt-4">
            {exercisesWithDetails?.map((exercise, index) => {
              const isCurrentExercise = index === currentExerciseIndex;
              const exerciseCompleted = index < currentExerciseIndex;
              
              return (
                <button
                  key={exercise.exerciseId}
                  onClick={() => handleJumpToExercise(index)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    hover:border-primary/50 hover:bg-accent/50
                    ${
                      isCurrentExercise
                        ? 'border-primary bg-primary/10'
                        : exerciseCompleted
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold">{exercise.exerciseName}</h3>
                        {isCurrentExercise && (
                          <Badge variant="default" className="ml-2">Atual</Badge>
                        )}
                        {exerciseCompleted && (
                          <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
                            <Check className="w-3 h-3 mr-1" />
                            Completo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{exercise.sets} séries</span>
                        <span>•</span>
                        <span>{exercise.reps} repetições</span>
                        <span>•</span>
                        <span>{exercise.restTime || '90s'}</span>
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

      {/* Dialog de Finalização com Notas */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Treino Concluído!</DialogTitle>
            <DialogDescription>
              Parabéns! Todos os exercícios foram completados. Adicione uma observação se quiser.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Textarea
              placeholder="Ex: Senti bem no agachamento, aumentar carga na próxima..."
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              rows={3}
            />
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setShowFinishDialog(false);
                handleFinishWorkout(workoutNotes || undefined);
              }}
            >
              <Check className="w-5 h-5 mr-2" />
              Salvar Treino
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Encerramento Antecipado */}
      <Dialog open={showEndWorkoutDialog} onOpenChange={setShowEndWorkoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar Treino Antecipadamente?</DialogTitle>
            <DialogDescription>
              Você completou apenas {currentExerciseIndex} de {exercisesWithDetails?.length} exercícios.
              O treino será salvo como <strong>completo</strong> e contará como um dia de treino realizado.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Textarea
              placeholder="Observações (opcional)..."
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              rows={2}
            />
            <Button
              size="lg"
              variant="destructive"
              onClick={handleEndWorkoutEarly}
              className="w-full"
            >
              <Check className="w-5 h-5 mr-2" />
              Sim, Encerrar e Salvar
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setShowEndWorkoutDialog(false);
                haptic.light();
              }}
              className="w-full"
            >
              Continuar Treinando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

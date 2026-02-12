import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Clock, Dumbbell, Play, Pause, SkipForward, Maximize, Minimize, List, ChevronRight } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ExerciseGifModal } from "@/components/ExerciseGifModal";
import { useHaptic } from "@/hooks/useHaptic";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function ExecutarTreino() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const workoutCode = params.code?.toUpperCase();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [exerciseData, setExerciseData] = useState<Record<number, { sets: Array<{ reps: number; load: number }> }>>({});
  const [selectedGif, setSelectedGif] = useState<{ name: string; url: string } | null>(null);
  const [workoutStartTime] = useState(new Date());
  const [showExerciseList, setShowExerciseList] = useState(false);
  const haptic = useHaptic();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const { data: workoutType } = trpc.workoutTypes.getByCode.useQuery(
    { code: workoutCode || "" },
    { enabled: !!workoutCode }
  );

  const { data: cycles } = trpc.cycles.getAll.useQuery();
  const currentCycle = cycles?.[0];

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
      gifUrl: exercise?.gifUrl,
    };
  });

  const currentExercise = exercisesWithDetails?.[currentExerciseIndex];

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
    }
  }, [isResting, restTimeLeft]);

  const parseRestTime = (restTime: string | null): number => {
    if (!restTime) return 90;
    const match = restTime.match(/(\d+)/);
    return match ? parseInt(match[1]) : 90;
  };

  const handleCompleteSet = () => {
    const exerciseId = currentExercise?.exerciseId;
    if (!exerciseId) return;

    const data = exerciseData[exerciseId] || { sets: [] };
    const currentSetData = data.sets[currentSet - 1] || { reps: 10, load: Number(currentExercise?.initialLoad) || 0 };
    
    // Salvar dados da série
    const newData = { ...exerciseData };
    if (!newData[exerciseId]) {
      newData[exerciseId] = { sets: [] };
    }
    newData[exerciseId].sets[currentSet - 1] = currentSetData;
    setExerciseData(newData);

    // Vibração ao completar série
    haptic.setComplete();

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
        handleFinishWorkout();
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

  const handleFinishWorkout = async () => {
    if (!currentCycle || !workoutType) return;

    try {
      // Criar log do treino
      const workoutLog = await createWorkoutLog.mutateAsync({
        workoutTypeId: workoutType.id,
        cycleId: currentCycle.id,
        workoutDate: new Date().toISOString().split('T')[0],
        notes: `Treino realizado em ${Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000)} minutos`,
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
      load: Number(currentExercise?.initialLoad) || 0 
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
    if (!exerciseId) return { reps: 10, load: Number(currentExercise?.initialLoad) || 0 };
    
    const data = exerciseData[exerciseId];
    if (!data || !data.sets[currentSet - 1]) {
      return { 
        reps: 10, 
        load: Number(currentExercise?.initialLoad) || 0 
      };
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
    <div className="min-h-screen bg-background pb-20">
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
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowExerciseList(true);
                  haptic.light();
                }}
                title="Ver todos os exercícios"
              >
                <List className="w-4 h-4" />
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
              <p className="text-muted-foreground mb-4">Tempo de descanso</p>
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
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {currentExercise.gifUrl && (
                    <div 
                      className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setSelectedGif({ name: currentExercise.exerciseName, url: currentExercise.gifUrl! })}
                    >
                      <img
                        src={currentExercise.gifUrl}
                        alt={`Demo: ${currentExercise.exerciseName}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{currentExercise.exerciseName}</CardTitle>
                    <CardDescription>
                      {currentExercise.technique && (
                        <Badge variant="secondary" className="mr-2">
                          {currentExercise.technique}
                        </Badge>
                      )}
                      <span className="text-sm">Série {currentSet} de {currentExercise.sets}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

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
                    <Input
                      type="number"
                      step="0.5"
                      value={currentSetData.load}
                      onChange={(e) => updateCurrentSetData('load', parseFloat(e.target.value) || 0)}
                      className="text-lg font-semibold text-center"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Sugestão:</strong> {currentExercise.reps} repetições com {currentExercise.initialLoad}kg
                  </p>
                  {currentExercise.restTime && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Descanso: {currentExercise.restTime}
                    </p>
                  )}
                </div>
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
            </div>
          </>
        )}
      </main>

      {/* Modal de GIF */}
      {selectedGif && (
        <ExerciseGifModal
          open={!!selectedGif}
          onOpenChange={(open) => !open && setSelectedGif(null)}
          exerciseName={selectedGif.name}
          gifUrl={selectedGif.url}
        />
      )}

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
    </div>
  );
}

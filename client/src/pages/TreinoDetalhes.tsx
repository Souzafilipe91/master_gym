import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Dumbbell, Clock, TrendingUp, Info } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { EditLoadDialog } from "@/components/EditLoadDialog";


export default function TreinoDetalhes() {
  const params = useParams<{ code: string }>();
  const workoutCode = params.code?.toUpperCase();
  const [customLoads, setCustomLoads] = useState<Record<number, number>>({});


  const { data: workoutType } = trpc.workoutTypes.getByCode.useQuery(
    { code: workoutCode || "" },
    { enabled: !!workoutCode }
  );

  const { data: cycles } = trpc.cycles.getAll.useQuery();
  const currentCycle = cycles?.[0]; // Por enquanto, sempre usa o primeiro ciclo

  const { data: workoutExercises } = trpc.workoutExercises.getByCycleAndType.useQuery(
    { cycleId: currentCycle?.id || 0, workoutTypeId: workoutType?.id || 0 },
    { enabled: !!currentCycle && !!workoutType }
  );

  const { data: allExercises } = trpc.exercises.getAll.useQuery();

  // Mapear exercícios com seus detalhes
  const exercisesWithDetails = workoutExercises?.map((we) => {
    const exercise = allExercises?.find((e) => e.id === we.exerciseId);
    return {
      ...we,
      exerciseName: exercise?.name || "Exercício",
    };
  });

  if (!workoutType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{workoutCode}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Treino {workoutCode}</h1>
                <p className="text-sm text-muted-foreground">{workoutType.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Informações do Treino */}
        <div className="mb-8">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Informações do Treino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duração</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {workoutType.duration} minutos
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Exercícios</p>
                  <p className="font-medium flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    {exercisesWithDetails?.length || 0} exercícios
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ciclo Atual</p>
                  <p className="font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {currentCycle?.name.split(":")[0]}
                  </p>
                </div>
              </div>
              {workoutType.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">{workoutType.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Exercícios */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Exercícios</h2>
          <div className="space-y-4">
            {exercisesWithDetails?.map((exercise, index) => (
              <Card key={exercise.id} className="hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 cursor-pointer hover:ring-2 hover:ring-primary transition-all flex items-center justify-center"
                      onClick={() => {/* Placeholder - sem GIF */}}
                    >
                      {false ? (
                        <>
                          <img
                            src=""
                            alt={`Demo: ${exercise.exerciseName}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // Se o GIF falhar ao carregar, mostrar ícone
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                          <Dumbbell className="w-10 h-10 text-primary/40" style={{ display: 'none' }} />
                        </>
                      ) : (
                        <Dumbbell className="w-10 h-10 text-primary/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <span>{exercise.exerciseName}</span>
                      </CardTitle>
                      <CardDescription className="mt-2 ml-11">
                        {exercise.technique && (
                          <Badge variant="secondary" className="mr-2">
                            {exercise.technique}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 ml-11">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Séries</p>
                      <p className="font-semibold text-primary">{exercise.sets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Repetições</p>
                      <p className="font-semibold">{exercise.reps}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Carga Inicial</p>
                        <EditLoadDialog
                          exerciseName={exercise.exerciseName}
                          currentLoad={(customLoads[exercise.id] ?? exercise.initialLoad).toString()}
                          onSave={(newLoad) => setCustomLoads(prev => ({ ...prev, [exercise.id]: newLoad }))}
                        />
                      </div>
                      <p className="font-semibold">
                        {customLoads[exercise.id] ?? exercise.initialLoad}kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Progressão</p>
                      <p className="font-semibold text-green-500">+{exercise.loadProgression}kg</p>
                    </div>
                  </div>
                  {exercise.restTime && (
                    <div className="mt-4 ml-11 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Descanso: {exercise.restTime}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Botão de Iniciar Treino */}
        <div className="mt-8">
          <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="py-8 text-center">
              <Button size="lg" className="w-full md:w-auto" asChild>
                <Link href={`/treino/${workoutCode}/registrar`}>
                  <Dumbbell className="w-5 h-5 mr-2" />
                  Iniciar Treino
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de GIF */}

    </div>
  );
}

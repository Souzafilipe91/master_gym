import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Biblioteca() {
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  
  const { data: muscleGroups } = trpc.muscleGroups.getAll.useQuery();
  const { data: allExercises } = trpc.exercises.getAll.useQuery();
  const { data: filteredExercises } = trpc.exercises.getByMuscleGroup.useQuery(
    { muscleGroupId: parseInt(selectedMuscleGroup) },
    { enabled: selectedMuscleGroup !== "all" }
  );

  const exercises = selectedMuscleGroup === "all" ? allExercises : filteredExercises;

  // Agrupar exercícios por grupo muscular para exibição
  const exercisesByGroup = exercises?.reduce((acc, exercise) => {
    const group = muscleGroups?.find(g => g.id === exercise.muscleGroupId);
    const groupName = group?.name || "Outros";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(exercise);
    return acc;
  }, {} as Record<string, typeof exercises>);

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
              <div className="p-2 bg-primary/10 rounded-lg">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Biblioteca de Exercícios</h1>
                <p className="text-sm text-muted-foreground">
                  {exercises?.length || 0} exercícios disponíveis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filtros */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Grupo Muscular</CardTitle>
              <CardDescription>Selecione um grupo para ver exercícios específicos</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecione um grupo muscular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Exercícios</SelectItem>
                  {muscleGroups?.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Exercícios */}
        {exercisesByGroup && Object.keys(exercisesByGroup).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(exercisesByGroup).map(([groupName, groupExercises]) => (
              <div key={groupName}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  {groupName}
                  <span className="text-sm text-muted-foreground font-normal">
                    ({groupExercises.length} exercícios)
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupExercises.map((exercise) => (
                    <Card key={exercise.id} className="hover:border-primary/50 transition-all">
                      <CardHeader>
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        {exercise.description && (
                          <CardDescription>{exercise.description}</CardDescription>
                        )}
                      </CardHeader>
                      {(exercise.videoUrl || exercise.imageUrl) && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Demonstração disponível
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum exercício encontrado</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

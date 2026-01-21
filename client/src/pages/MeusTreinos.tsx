import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Dumbbell, Activity, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function MeusTreinos() {
  const { data: workoutTypes, isLoading } = trpc.workoutTypes.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando treinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meus Treinos</h1>
            <p className="text-sm text-muted-foreground">
              Programa de 4 treinos semanais
            </p>
          </div>
        </div>

        {/* Grid de Treinos */}
        <div className="grid gap-6 md:grid-cols-2">
          {workoutTypes?.map((workout) => {
            const colors = {
              A: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500", letter: "text-red-500" },
              B: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", letter: "text-blue-500" },
              C: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", letter: "text-orange-500" },
              D: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500", letter: "text-purple-500" },
            }[workout.code] || { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", letter: "text-primary" };

            return (
              <Link key={workout.id} href={`/treino/${workout.code}`}>
                <Card className={`cursor-pointer transition-all hover:scale-[1.02] ${colors.border} ${colors.bg}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <span className={`text-2xl font-bold ${colors.letter}`}>{workout.code}</span>
                        </div>
                        <div>
                          <CardTitle className="text-xl">{workout.name}</CardTitle>
                          <CardDescription>Treino {workout.code}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        <span>{workout.duration} minutos</span>
                      </div>
                    </div>
                    {workout.description && (
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                        {workout.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Programa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Frequência Recomendada</h4>
                <p className="text-sm text-muted-foreground">
                  4 treinos por semana, alternando entre os treinos A, B, C e D. 
                  Exemplo: Segunda (A), Terça (B), Quinta (C), Sexta (D).
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Progressão de Carga</h4>
                <p className="text-sm text-muted-foreground">
                  Aumente a carga em 2-5% a cada 2-3 semanas quando conseguir completar 
                  todas as séries e repetições com boa execução.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Descanso</h4>
                <p className="text-sm text-muted-foreground">
                  Respeite os tempos de descanso indicados em cada exercício. 
                  Exercícios compostos geralmente requerem 2-3 minutos, isolados 1-2 minutos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

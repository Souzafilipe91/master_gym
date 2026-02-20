import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Dumbbell } from "lucide-react";

export default function EvolucaoCarga() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

  // Buscar todos os exercícios
  const { data: exercises } = trpc.exercises.getAll.useQuery();

  // Buscar histórico de logs do exercício selecionado
  const { data: exerciseLogs, isLoading } = trpc.exerciseLogs.getByExercise.useQuery(
    { exerciseId: selectedExerciseId! },
    { enabled: !!selectedExerciseId }
  );

  // Processar dados para o gráfico
  const chartData = exerciseLogs?.map((log) => ({
    date: new Date(log.workoutDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    carga: log.weight,
    reps: log.reps,
  })) || [];

  // Calcular estatísticas
  const stats = chartData.length > 0 ? {
    maxCarga: Math.max(...chartData.map((d: any) => d.carga)),
    minCarga: Math.min(...chartData.map((d: any) => d.carga)),
    avgCarga: (chartData.reduce((sum: number, d: any) => sum + d.carga, 0) / chartData.length).toFixed(1),
    totalSessoes: chartData.length,
  } : null;

  const selectedExercise = exercises?.find((e: any) => e.id === selectedExerciseId);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Evolução de Carga</h1>
          <p className="text-muted-foreground">Acompanhe sua progressão em cada exercício</p>
        </div>
      </div>

      {/* Seletor de Exercício */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecione um Exercício</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedExerciseId?.toString() || ""}
            onValueChange={(value) => setSelectedExerciseId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha um exercício para ver a evolução" />
            </SelectTrigger>
            <SelectContent>
              {exercises?.map((exercise: any) => (
                <SelectItem key={exercise.id} value={exercise.id.toString()}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && selectedExercise && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.maxCarga}kg</div>
              <p className="text-xs text-muted-foreground">Carga Máxima</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.avgCarga}kg</div>
              <p className="text-xs text-muted-foreground">Carga Média</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.minCarga}kg</div>
              <p className="text-xs text-muted-foreground">Carga Mínima</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalSessoes}</div>
              <p className="text-xs text-muted-foreground">Total de Sessões</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico */}
      {selectedExerciseId && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedExercise?.name} - Histórico de Carga</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum registro encontrado para este exercício</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Gráfico de barras simples usando CSS */}
                <div className="relative h-64 flex items-end gap-1">
                  {chartData.map((data: any, index: number) => {
                    const heightPercent = (data.carga / (stats?.maxCarga || 1)) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-xs font-semibold text-primary">{data.carga}kg</div>
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                          style={{ height: `${heightPercent}%` }}
                          title={`${data.date}: ${data.carga}kg x ${data.reps} reps`}
                        />
                        <div className="text-xs text-muted-foreground">{data.date}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Tabela de detalhes */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Data</th>
                        <th className="text-center py-2">Carga</th>
                        <th className="text-center py-2">Repetições</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exerciseLogs?.map((log: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">
                            {new Date(log.workoutDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="text-center py-2 font-semibold">{log.weight}kg</td>
                          <td className="text-center py-2">{log.reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedExerciseId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Selecione um exercício acima para ver a evolução</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

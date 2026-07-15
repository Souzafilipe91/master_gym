import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, Weight, Activity, Calendar, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Progresso() {
  const [volumeDays, setVolumeDays] = useState(30);

  const { data: weightLogs, isLoading: loadingWeight } = trpc.weightLogs.getMyLogs.useQuery({ limit: 30 });
  const { data: workoutLogs, isLoading: loadingWorkouts } = trpc.workoutLogs.getMyLogs.useQuery({ limit: 30 });
  const { data: cardioLogs, isLoading: loadingCardio } = trpc.cardio.getMyLogs.useQuery({ limit: 30 });
  const { data: volumeData } = trpc.workoutLogs.getVolumeData.useQuery({ days: volumeDays });

  // Preparar dados para o gráfico de volume
  const volumeChartData = volumeData?.map((d) => ({
    date: format(new Date(d.date), "dd/MM", { locale: ptBR }),
    volume: Math.round(Number(d.volume)),
  })) || [];

  // Preparar dados para o gráfico de peso
  const weightChartData = weightLogs
    ?.slice()
    .reverse()
    .map((log) => ({
      date: format(new Date(log.logDate), "dd/MM", { locale: ptBR }),
      peso: parseFloat(log.weight),
    })) || [];

  // Calcular estatísticas
  const totalWorkouts = workoutLogs?.filter((log) => log.completed).length || 0;
  const totalCardio = cardioLogs?.length || 0;
  const currentWeight = weightLogs?.[0]?.weight || "83.00";
  const initialWeight = weightLogs?.[weightLogs.length - 1]?.weight || currentWeight;
  const weightChange = (parseFloat(currentWeight) - parseFloat(initialWeight)).toFixed(2);

  // Treinos por semana (últimas 4 semanas)
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recentWorkouts = workoutLogs?.filter(
    (log) => log.completed && new Date(log.workoutDate) >= fourWeeksAgo
  ).length || 0;
  const workoutsPerWeek = (recentWorkouts / 4).toFixed(1);

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
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Progresso</h1>
                <p className="text-sm text-muted-foreground">Acompanhe sua evolução</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardDescription>Peso Atual</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Weight className="w-6 h-6 text-primary" />
                {currentWeight}kg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {parseFloat(weightChange) >= 0 ? "+" : ""}
                {weightChange}kg desde o início
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Treinos Completos</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                {totalWorkouts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total de treinos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sessões de Cardio</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                {totalCardio}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total de sessões</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Frequência Semanal</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                {workoutsPerWeek}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Treinos por semana (últimas 4 semanas)</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Peso Corporal */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Evolução de Peso Corporal
            </CardTitle>
            <CardDescription>Últimas 30 medições</CardDescription>
          </CardHeader>
          <CardContent>
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(20, 20, 20, 0.95)', 
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="rgb(220, 38, 38)" 
                    strokeWidth={2}
                    dot={{ fill: 'rgb(220, 38, 38)', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Peso (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center">
                <Weight className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum registro de peso ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece a registrar seu peso para acompanhar sua evolução
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Volume Total */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Volume Total de Treino
                </CardTitle>
                <CardDescription>Soma de carga × reps por sessão (kg)</CardDescription>
              </div>
              <Select value={String(volumeDays)} onValueChange={(v) => setVolumeDays(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(20, 20, 20, 0.95)",
                      border: "1px solid rgba(220, 38, 38, 0.3)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} kg`, "Volume"]}
                  />
                  <Bar dataKey="volume" fill="rgb(220, 38, 38)" radius={[4, 4, 0, 0]} name="Volume (kg)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum dado de volume disponível</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete treinos para ver seu volume total
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações sobre Cardio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recomendações de Cardio
            </CardTitle>
            <CardDescription>Baseado no ciclo atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Frequência</p>
                <p className="font-medium">4x na semana</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duração</p>
                <p className="font-medium">30 minutos</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Intensidade</p>
                <p className="font-medium">Baixa (LISS)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Quando</p>
                <p className="font-medium">Em jejum ou após treinos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

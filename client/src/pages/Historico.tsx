import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Dumbbell } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Historico() {
  const { data: workoutLogs, isLoading } = trpc.workoutLogs.getMyLogs.useQuery();
  const { data: workoutTypes } = trpc.workoutTypes.getAll.useQuery();
  const { data: cycles } = trpc.cycles.getAll.useQuery();

  // Mapear logs com detalhes
  const logsWithDetails = workoutLogs?.map((log) => {
    const workoutType = workoutTypes?.find((wt) => wt.id === log.workoutTypeId);
    const cycle = cycles?.find((c) => c.id === log.cycleId);
    return {
      ...log,
      workoutTypeName: workoutType?.name || "Treino",
      workoutTypeCode: workoutType?.code || "?",
      cycleName: cycle?.name.split(":")[0] || "Ciclo",
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando histórico...</p>
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
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Histórico de Treinos</h1>
                <p className="text-sm text-muted-foreground">
                  {logsWithDetails?.length || 0} treinos registrados
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {logsWithDetails && logsWithDetails.length > 0 ? (
          <div className="space-y-4">
            {logsWithDetails.map((log) => (
              <Card key={log.id} className={log.completed ? "border-green-500/30" : "border-border"}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary">{log.workoutTypeCode}</span>
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {log.workoutTypeName}
                          {log.completed && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {format(new Date(log.workoutDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={log.completed ? "default" : "secondary"}>
                      {log.completed ? "Completo" : "Pendente"}
                    </Badge>
                  </div>
                </CardHeader>
                {log.notes && (
                  <CardContent>
                    <div className="ml-15">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notas:</strong> {log.notes}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum treino registrado</h3>
              <p className="text-muted-foreground mb-6">
                Comece a registrar seus treinos para acompanhar seu progresso
              </p>
              <Button asChild>
                <Link href="/">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Ver Treinos
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, X } from "lucide-react";
import { useMemo } from "react";

export function WeeklyProgressWidget() {
  const { data: workoutLogs, isLoading } = trpc.workoutLogs.getMyLogs.useQuery({ limit: 50 });

  const weekData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    // Calcular início da semana (domingo)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Criar array com os 7 dias da semana
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      // Verificar se há treino neste dia
      const hasWorkout = workoutLogs?.some((log: any) => {
        const logDate = new Date(log.workoutDate);
        return (
          logDate.getDate() === date.getDate() &&
          logDate.getMonth() === date.getMonth() &&
          logDate.getFullYear() === date.getFullYear()
        );
      });

      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const isFuture = date > today;

      days.push({
        date,
        dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i],
        dayNumber: date.getDate(),
        hasWorkout,
        isToday,
        isFuture,
      });
    }

    return days;
  }, [workoutLogs]);

  const completedDays = weekData.filter(d => d.hasWorkout).length;
  const progressPercentage = (completedDays / 7) * 100;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso Semanal</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progresso Semanal</CardTitle>
        <CardDescription>
          {completedDays} de 7 treinos completos esta semana
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Barra de progresso */}
        <div className="mb-4 w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Calendário da semana */}
        <div className="grid grid-cols-7 gap-2">
          {weekData.map((day, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xs text-muted-foreground font-medium">
                {day.dayName}
              </span>
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold
                  transition-all duration-200
                  ${day.isToday 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                    : ''
                  }
                  ${day.hasWorkout
                    ? 'bg-primary text-primary-foreground'
                    : day.isFuture
                    ? 'bg-muted/50 text-muted-foreground'
                    : 'bg-destructive/20 text-destructive'
                  }
                `}
              >
                {day.hasWorkout ? (
                  <Check className="w-5 h-5" />
                ) : day.isFuture ? (
                  <span>{day.dayNumber}</span>
                ) : (
                  <X className="w-5 h-5" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem motivacional */}
        <div className="mt-4 text-center">
          {completedDays === 7 ? (
            <p className="text-sm font-semibold text-primary">
              🔥 Semana perfeita! Continue assim!
            </p>
          ) : completedDays >= 5 ? (
            <p className="text-sm text-muted-foreground">
              Ótimo trabalho! Falta pouco para a semana perfeita!
            </p>
          ) : completedDays >= 3 ? (
            <p className="text-sm text-muted-foreground">
              Você está no caminho certo! Continue firme!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vamos lá! Ainda dá tempo de treinar esta semana!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

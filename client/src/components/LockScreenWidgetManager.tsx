import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useLockScreenWidget } from '@/hooks/useLockScreenWidget';

/**
 * Componente que gerencia automaticamente o widget de tela bloqueada
 * Atualiza o badge e notificações com base no progresso do usuário
 */
export function LockScreenWidgetManager() {
  const { data: workoutLogs } = trpc.workoutLogs.getMyLogs.useQuery({ limit: 50 });
  const { updateWorkoutWidget } = useLockScreenWidget();

  useEffect(() => {
    if (!workoutLogs) return;

    // Calcular treinos desta semana
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const workoutsThisWeek = workoutLogs.filter(log => {
      const logDate = new Date(log.workoutDate);
      return logDate >= startOfWeek;
    }).length;

    // Calcular sequência de dias consecutivos
    let streak = 0;
    const sortedLogs = [...workoutLogs].sort((a, b) => 
      new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
    );

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const log of sortedLogs) {
      const logDate = new Date(log.workoutDate);
      logDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
        currentDate = new Date(logDate);
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays > streak) {
        break;
      }
    }

    // Atualizar widget
    updateWorkoutWidget({
      workoutsThisWeek,
      streak: streak > 1 ? streak : undefined,
    });
  }, [workoutLogs, updateWorkoutWidget]);

  // Este componente não renderiza nada visualmente
  return null;
}

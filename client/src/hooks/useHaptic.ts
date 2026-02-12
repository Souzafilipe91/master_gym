import { useCallback } from 'react';

/**
 * Hook para feedback háptico (vibração) em dispositivos móveis
 */
export function useHaptic() {
  const vibrate = useCallback((pattern: number | number[]) => {
    // Verificar se a API de vibração está disponível
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration API error:', error);
      }
    }
  }, []);

  // Padrões pré-definidos para diferentes ações
  const patterns = {
    // Feedback leve (toque rápido)
    light: () => vibrate(10),
    
    // Feedback médio (toque normal)
    medium: () => vibrate(20),
    
    // Feedback forte (toque longo)
    heavy: () => vibrate(50),
    
    // Sucesso (dois toques curtos)
    success: () => vibrate([10, 50, 10]),
    
    // Erro (vibração longa)
    error: () => vibrate(100),
    
    // Completar série (padrão de celebração)
    setComplete: () => vibrate([20, 50, 20, 50, 20]),
    
    // Iniciar descanso (vibração crescente)
    restStart: () => vibrate([30, 100, 50]),
    
    // Fim do descanso (vibração urgente)
    restEnd: () => vibrate([50, 100, 50, 100, 50, 100, 50]),
    
    // Conquista desbloqueada (padrão especial)
    achievement: () => vibrate([30, 50, 30, 50, 30, 100, 50, 100, 50]),
    
    // Treino completo (vibração de celebração longa)
    workoutComplete: () => vibrate([50, 100, 50, 100, 50, 100, 100]),
  };

  return {
    vibrate,
    ...patterns,
  };
}

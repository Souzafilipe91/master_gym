import { useEffect } from 'react';

interface LockScreenWidgetData {
  title: string;
  description: string;
  icon?: string;
  badge?: number;
  image?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Hook para gerenciar widget de tela bloqueada
 * Usa Badging API e Notifications API para exibir informações na tela bloqueada
 */
export function useLockScreenWidget() {
  
  /**
   * Atualizar badge do app (número no ícone)
   */
  const setBadge = async (count: number) => {
    try {
      if ('setAppBadge' in navigator) {
        await (navigator as any).setAppBadge(count);
      }
    } catch (error) {
      console.warn('Badge API not supported:', error);
    }
  };

  /**
   * Limpar badge do app
   */
  const clearBadge = async () => {
    try {
      if ('clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
      }
    } catch (error) {
      console.warn('Badge API not supported:', error);
    }
  };

  /**
   * Criar notificação rica para tela bloqueada
   */
  const showLockScreenWidget = async (data: LockScreenWidgetData) => {
    try {
      // Verificar permissão de notificações
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return;
      }

      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      // Verificar se há service worker registrado
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Criar notificação rica
      await registration.showNotification(data.title, {
        body: data.description,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'lock-screen-widget',
        requireInteraction: false,
        silent: true,
        data: {
          url: '/',
          image: data.image,
        },
        actions: data.actions?.map(action => ({
          action: action.action,
          title: action.title,
          icon: action.icon,
        })) || [],
      } as any);

      // Atualizar badge se fornecido
      if (data.badge !== undefined) {
        await setBadge(data.badge);
      }
    } catch (error) {
      console.error('Error showing lock screen widget:', error);
    }
  };

  /**
   * Atualizar widget com informações de treino
   */
  const updateWorkoutWidget = async (data: {
    workoutsThisWeek: number;
    nextWorkout?: string;
    streak?: number;
  }) => {
    const { workoutsThisWeek, nextWorkout, streak } = data;
    
    let description = `${workoutsThisWeek}/7 treinos esta semana`;
    if (streak && streak > 1) {
      description += ` • ${streak} dias consecutivos 🔥`;
    }
    if (nextWorkout) {
      description += `\nPróximo: ${nextWorkout}`;
    }

    await showLockScreenWidget({
      title: 'Gym Master',
      description,
      badge: 7 - workoutsThisWeek, // Mostra quantos treinos faltam
      icon: '/icon-192.png',
      actions: [
        {
          action: 'open-app',
          title: 'Abrir App',
        },
        {
          action: 'view-workouts',
          title: 'Ver Treinos',
        },
      ],
    });
  };

  /**
   * Limpar widget da tela bloqueada
   */
  const clearLockScreenWidget = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({
          tag: 'lock-screen-widget',
        });
        
        notifications.forEach(notification => notification.close());
      }
      
      await clearBadge();
    } catch (error) {
      console.error('Error clearing lock screen widget:', error);
    }
  };

  return {
    setBadge,
    clearBadge,
    showLockScreenWidget,
    updateWorkoutWidget,
    clearLockScreenWidget,
  };
}

/**
 * Sistema de notificações push para lembretes de treino
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function checkNotificationPermission(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

export interface WorkoutReminder {
  title: string;
  body: string;
  scheduledTime: Date;
  workoutType: 'A' | 'B' | 'C' | 'D';
}

export async function scheduleWorkoutReminder(reminder: WorkoutReminder): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.warn('[Notifications] Permission not granted');
    return;
  }

  // Calculate delay until scheduled time
  const now = new Date().getTime();
  const scheduledTime = reminder.scheduledTime.getTime();
  const delay = scheduledTime - now;

  if (delay <= 0) {
    // Show immediately if time has passed
    showNotification(reminder.title, reminder.body);
    return;
  }

  // Schedule notification
  setTimeout(() => {
    showNotification(reminder.title, reminder.body);
  }, delay);

  // Store in localStorage for persistence
  const reminders = getStoredReminders();
  reminders.push({
    ...reminder,
    scheduledTime: reminder.scheduledTime.toISOString(),
  });
  localStorage.setItem('workout_reminders', JSON.stringify(reminders));
}

function showNotification(title: string, body: string): void {
  if (!checkNotificationPermission()) {
    return;
  }

  // Try to use Service Worker notification first (better for PWA)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'workout-reminder',
        requireInteraction: false,
      });
    });
  } else {
    // Fallback to regular notification
    new Notification(title, {
      body,
      icon: '/icon-192.png',
    });
  }
}

function getStoredReminders(): any[] {
  const stored = localStorage.getItem('workout_reminders');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function clearStoredReminders(): void {
  localStorage.removeItem('workout_reminders');
}

// Restore scheduled reminders on app load
export function restoreScheduledReminders(): void {
  const reminders = getStoredReminders();
  const now = new Date().getTime();

  reminders.forEach((reminder: any) => {
    const scheduledTime = new Date(reminder.scheduledTime).getTime();
    
    // Only restore future reminders
    if (scheduledTime > now) {
      scheduleWorkoutReminder({
        ...reminder,
        scheduledTime: new Date(reminder.scheduledTime),
      });
    }
  });
}

/**
 * Envia notificação imediata de fim de descanso
 * Funciona mesmo com a tela bloqueada via Service Worker
 */
export async function notifyRestEnd(): Promise<void> {
  if (!checkNotificationPermission()) {
    // Tenta solicitar permissão se ainda não foi concedida
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  const title = '\u23F1\uFE0F Descanso Terminado!';
  const body = 'Hora da próxima série. Vamos lá! 💪';

  // Preferência: Service Worker notification (aparece na tela bloqueada)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'rest-end',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200, 100, 200],
      } as NotificationOptions);
      return;
    } catch (err) {
      console.warn('[Notifications] SW notification failed, falling back:', err);
    }
  }

  // Fallback: notificação simples
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
    });
  }
}

// Default workout schedule (can be customized by user)
export const DEFAULT_WORKOUT_SCHEDULE = {
  A: { day: 1, time: '18:00' }, // Monday
  B: { day: 3, time: '18:00' }, // Wednesday
  C: { day: 5, time: '18:00' }, // Friday
  D: { day: 6, time: '10:00' }, // Saturday
};

export function scheduleWeeklyReminders(): void {
  const schedule = DEFAULT_WORKOUT_SCHEDULE;
  
  Object.entries(schedule).forEach(([workout, config]) => {
    const [hours, minutes] = config.time.split(':').map(Number);
    const now = new Date();
    const scheduledDate = new Date();
    
    // Calculate next occurrence of this day
    const currentDay = now.getDay();
    const targetDay = config.day;
    let daysUntilTarget = targetDay - currentDay;
    
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && now.getHours() >= hours)) {
      daysUntilTarget += 7;
    }
    
    scheduledDate.setDate(now.getDate() + daysUntilTarget);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    scheduleWorkoutReminder({
      title: '💪 Hora do Treino!',
      body: `Treino ${workout} agendado para agora. Vamos treinar!`,
      scheduledTime: scheduledDate,
      workoutType: workout as 'A' | 'B' | 'C' | 'D',
    });
  });
}

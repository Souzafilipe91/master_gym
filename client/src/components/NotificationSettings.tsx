import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  checkNotificationPermission,
  requestNotificationPermission,
  scheduleWeeklyReminders,
  clearStoredReminders,
} from "@/lib/notifications";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function NotificationSettings() {
  const [hasPermission, setHasPermission] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const permission = checkNotificationPermission();
    setHasPermission(permission);
    
    // Check if notifications are enabled in localStorage
    const enabled = localStorage.getItem('notifications_enabled') === 'true';
    setNotificationsEnabled(enabled && permission);
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      setHasPermission(true);
      setNotificationsEnabled(true);
      localStorage.setItem('notifications_enabled', 'true');
      
      // Schedule weekly reminders
      scheduleWeeklyReminders();
      
      toast.success('Notificações ativadas!', {
        description: 'Você receberá lembretes dos seus treinos.',
      });
    } else {
      toast.error('Permissão negada', {
        description: 'Ative as notificações nas configurações do navegador.',
      });
    }
  };

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false);
    localStorage.setItem('notifications_enabled', 'false');
    clearStoredReminders();
    
    toast.info('Notificações desativadas', {
      description: 'Você não receberá mais lembretes de treino.',
    });
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      handleEnableNotifications();
    } else {
      handleDisableNotifications();
    }
  };

  return (
    <Card className="p-6 bg-zinc-900 border-zinc-800">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {notificationsEnabled ? (
            <Bell className="w-6 h-6 text-red-600 mt-1" />
          ) : (
            <BellOff className="w-6 h-6 text-zinc-500 mt-1" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Lembretes de Treino
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Receba notificações push nos horários dos seus treinos agendados
            </p>
            
            {!hasPermission && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-500">
                  ⚠️ Permissão de notificações necessária
                </p>
              </div>
            )}
            
            <div className="text-xs text-zinc-500 space-y-1">
              <p>📅 Segunda: Treino A - 18:00</p>
              <p>📅 Quarta: Treino B - 18:00</p>
              <p>📅 Sexta: Treino C - 18:00</p>
              <p>📅 Sábado: Treino D - 10:00</p>
            </div>
          </div>
        </div>
        
        <Switch
          checked={notificationsEnabled}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-red-600"
        />
      </div>
      
      {!hasPermission && (
        <Button
          onClick={handleEnableNotifications}
          className="w-full mt-4 bg-red-600 hover:bg-red-700"
        >
          <Bell className="w-4 h-4 mr-2" />
          Ativar Notificações
        </Button>
      )}
    </Card>
  );
}

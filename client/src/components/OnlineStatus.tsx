import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { isOnline, onOnline, onOffline, getSyncQueue, clearSyncQueue } from "@/lib/offlineStorage";

export function OnlineStatus() {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setOnline(isOnline());

    const handleOnline = async () => {
      setOnline(true);
      toast.success('Conexão restaurada', {
        description: 'Sincronizando dados...',
      });
      
      // Sync pending operations
      await syncPendingOperations();
    };

    const handleOffline = () => {
      setOnline(false);
      toast.warning('Modo offline', {
        description: 'Dados serão sincronizados quando voltar online.',
      });
    };

    const unsubOnline = onOnline(handleOnline);
    const unsubOffline = onOffline(handleOffline);

    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, []);

  const syncPendingOperations = async () => {
    setSyncing(true);
    
    try {
      const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        setSyncing(false);
        return;
      }

      console.log(`[Sync] Syncing ${queue.length} pending operations...`);

      // Process each pending operation
      for (const item of queue) {
        try {
          await fetch(item.endpoint, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data),
            credentials: 'include',
          });
          
          // Remove from queue on success
          if (item.id) {
            const { removeFromSyncQueue } = await import('@/lib/offlineStorage');
            await removeFromSyncQueue(item.id);
          }
        } catch (error) {
          console.error('[Sync] Failed to sync operation:', error);
        }
      }

      await clearSyncQueue();
      
      toast.success('Sincronização concluída', {
        description: `${queue.length} operação(ões) sincronizada(s).`,
      });
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      toast.error('Erro na sincronização', {
        description: 'Tentaremos novamente mais tarde.',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (online && !syncing) {
    return null; // Don't show anything when online and not syncing
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
        online
          ? 'bg-blue-600 text-white'
          : 'bg-yellow-600 text-white'
      }`}>
        {syncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Sincronizando...</span>
          </>
        ) : online ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Modo Offline</span>
          </>
        )}
      </div>
    </div>
  );
}

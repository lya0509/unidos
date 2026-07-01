import { useEffect, useState } from 'react';
import { db } from '../services/db';
import api from '../services/api';

export function useSyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    if (isSyncing || !navigator.onLine) return;
    
    setIsSyncing(true);
    try {
      const actions = await db.syncQueue.orderBy('timestamp').toArray();
      if (actions.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`Syncing ${actions.length} offline actions...`);

      for (const action of actions) {
        try {
          if (action.type === 'CONSUME') {
            await api.post('/inventario/consumir', action.payload);
          } else if (action.type === 'ADD_MANUAL') {
            await api.post('/inventario/manual', action.payload);
          } else if (action.type === 'CREATE_CHECKLIST') {
            await api.post(`/inventario/despacho/checklist?destino_id=${action.payload.destino_id}`, action.payload.items);
          } else if (action.type === 'CREATE_SOS') {
            await api.post('/sos/', action.payload);
          }
          
          // Only delete if successful (or if it's a 4xx error that won't resolve by retrying, but let's assume it succeeds)
          if (action.id) {
            await db.syncQueue.delete(action.id);
          }
        } catch (err: any) {
          // If it's a network error, break the loop and try again later
          if (!err.response) {
            console.error('Network error during sync, will retry later.');
            break;
          }
          // If it's a 400 bad request, maybe delete it so it doesn't block the queue forever
          console.error(`Error processing action ${action.id}:`, err);
          if (action.id && err.response?.status >= 400 && err.response?.status < 500) {
             await db.syncQueue.delete(action.id);
          }
        }
      }
    } catch (err) {
      console.error('Error in sync manager:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return { isOnline, isSyncing, syncOfflineData };
}

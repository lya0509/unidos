import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

interface SocketContextType {
  newSosEvent: any | null;
  clearNewSosEvent: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [newSosEvent, setNewSosEvent] = useState<any | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Solicitar permiso de Notificaciones Push nativas al iniciar (solo en contextos seguros / HTTPS / localhost)
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      typeof Notification.requestPermission === 'function' &&
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      try {
        Notification.requestPermission();
      } catch (e) {
        console.warn("Notification.requestPermission failed:", e);
      }
    }

    if (user && user.zona_operacion) {
      // Connect to WebSocket using the user's zone
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/${encodeURIComponent(user.zona_operacion)}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log(`Connected to WS for zone: ${user.zona_operacion}`);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_SOS') {
            setNewSosEvent(data.data);
            playTacticalBip();
            
            // Trigger Native Push Notification si está permitido y soportado
            if (
              'Notification' in window && 
              Notification.permission === 'granted'
            ) {
              const isUrgent = data.data.descripcion?.includes('[URGENTE]');
              
              if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                  const options: any = {
                    body: data.data.descripcion,
                    icon: '/favicon.svg',
                    vibrate: isUrgent ? [200, 100, 200, 100, 200, 100, 200] : [200, 100, 200],
                    tag: 'sos-alert',
                    requireInteraction: isUrgent
                  };
                  registration.showNotification(isUrgent ? '⚠️ SOS URGENTE' : '🔴 Nuevo SOS en tu zona', options);
                }).catch(() => {
                  // Fallback
                  new Notification(isUrgent ? '⚠️ SOS URGENTE' : '🔴 Nuevo SOS en tu zona', {
                    body: data.data.descripcion,
                    icon: '/icon-192.png'
                  });
                });
              } else {
                new Notification(isUrgent ? '⚠️ SOS URGENTE' : '🔴 Nuevo SOS en tu zona', {
                  body: data.data.descripcion,
                  icon: '/icon-192.png'
                });
              }
            }
          }
        } catch (err) {
          console.error("Error parsing WS message", err);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
      };
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  const clearNewSosEvent = () => setNewSosEvent(null);

  const playTacticalBip = () => {
    try {
      // Create a short tactical bip sound using Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Audio not supported or interaction required first");
    }
  };

  return (
    <SocketContext.Provider value={{ newSosEvent, clearNewSosEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocketUrl } from '../services/api';

interface Message {
  id?: string;
  remitente_id: string;
  mensaje: string;
  created_at?: string;
  usuarios?: { nombre: string };
  nonce?: string;
}

interface ChatBoxProps {
  roomId: string;
  roomTitle: string;
  onClose?: () => void;
}

export function ChatBox({ roomId, roomTitle, onClose }: ChatBoxProps) {
  const { user: authUser } = useAuth();
  
  // Fallback for guests (Anonymous user)
  const user = authUser || {
    id: '00000000-0000-0000-0000-000000000000',
    nombre: 'Ciudadano (Anónimo)'
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Load history & connect WebSocket
  useEffect(() => {
    let active = true;

    const connectRoom = async () => {
      try {
        const res = await api.get(`/ws/history/${roomId}`);
        if (active) setMessages(res.data);
      } catch (err) {
        console.error("Error loading chat history:", err);
      } finally {
        if (active) setLoadingHistory(false);
      }

      if (active) {
        const socketUrl = getSocketUrl('/ws');
        ws.current = new WebSocket(`${socketUrl}/${roomId}`);
        
        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'CHAT_MESSAGE') {
            // Check if we already have this message (if it has an ID from DB, or if we optimistically added it)
            setMessages((prev) => {
              if (data.nonce && prev.some(m => m.nonce === data.nonce)) {
                return prev; // Deduplicate optimistic message
              }
              return [...prev, data];
            });
          }
        };
      }
    };

    connectRoom();

    return () => {
      active = false;
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !ws.current || cooldown > 0) return;

    const nonce = Date.now().toString();
    const msgPayload = {
      type: 'CHAT_MESSAGE',
      remitente_id: user.id,
      mensaje: inputText.trim(),
      usuarios: { nombre: user.nombre },
      nonce
    };

    // WebSocket send
    ws.current.send(JSON.stringify(msgPayload));
    
    // Optimistic UI update
    setMessages(prev => [...prev, msgPayload]);
    setInputText('');
    setCooldown(5); // 5 seconds cooldown
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-xl relative">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-800 text-white px-4 py-3 flex justify-between items-center z-10">
        <div>
          <h3 className="font-black uppercase tracking-wider">{roomTitle}</h3>
          <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Conexión Segura (WSS)</p>
        </div>
        {onClose && (
          <button 
            onClick={async () => {
              if (roomId !== 'global_chat') {
                try {
                  await fetch(`${import.meta.env.VITE_API_URL}/api/v1/ws/history/${roomId}`, {
                    method: 'DELETE'
                  });
                } catch (e) {
                  console.error('Failed to clear chat history', e);
                }
              }
              onClose();
            }} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-slate-400 text-sm font-bold uppercase tracking-widest text-center">
            No hay mensajes. <br/>Escribe para iniciar la conversación.
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.remitente_id === user?.id;
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-[10px] text-slate-500 font-bold ml-2 mb-1">{msg.usuarios?.nombre || 'Desconocido'}</span>
                )}
                <div 
                  className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-500/20' 
                      : 'bg-slate-800 text-white rounded-bl-sm border border-slate-700 shadow-sm'
                  } shadow-md`}
                >
                  {msg.mensaje}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={cooldown > 0}
              placeholder={cooldown > 0 ? `Espera ${cooldown}s...` : "Escribe un mensaje..."}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 font-medium placeholder-slate-400 disabled:opacity-60 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || cooldown > 0}
              className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
    </div>
  );
}

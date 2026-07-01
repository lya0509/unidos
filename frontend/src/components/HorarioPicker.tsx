import React, { useState } from 'react';
import { Clock, Loader2, X } from 'lucide-react';

interface HorarioPickerProps {
  onSave: (horarioStr: string) => Promise<void>;
  onClose: () => void;
}

export function HorarioPicker({ onSave, onClose }: HorarioPickerProps) {
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('16:00');
  const [loading, setLoading] = useState(false);

  const formatAmPm = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours}:${m} ${ampm}`;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formatted = `${formatAmPm(start)} - ${formatAmPm(end)}`;
      await onSave(formatted);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-emerald-500/30 animate-in zoom-in-95 duration-200 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-full p-1 border border-slate-700">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider text-center">
            Horario de Atención
          </h2>
          <p className="text-xs text-slate-400 mt-2 text-center font-bold px-2">
            Define tu horario de disponibilidad para que la comunidad sepa cuándo acudir.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 text-center">Apertura</label>
            <input 
              type="time" 
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full text-center text-xl font-black text-white bg-slate-800 p-3 rounded-xl border border-slate-600 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <span className="text-2xl font-black text-slate-600 mt-6">-</span>
          <div className="flex-1">
            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 text-center">Cierre</label>
            <input 
              type="time" 
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="w-full text-center text-xl font-black text-white bg-slate-800 p-3 rounded-xl border border-slate-600 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all font-black uppercase tracking-widest"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar Horario'}
        </button>
      </div>
    </div>
  );
}

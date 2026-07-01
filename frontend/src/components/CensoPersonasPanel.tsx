import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  UserPlus, Users, Loader2, Check, Search, Calendar, Heart, ShieldAlert, Edit2, ClipboardList
} from 'lucide-react';

export const CensoPersonasPanel: React.FC = () => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cedula, setCedula] = useState('');
  const [estadoSalud, setEstadoSalud] = useState('atendido');
  const [notas, setNotas] = useState('');

  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/personas/centro');
      setPersonas(res.data);
    } catch (err) {
      console.error("Error cargando personas del centro", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) return;

    setSaving(true);
    try {
      await api.post('/personas/', {
        nombre_completo: nombreCompleto.trim(),
        cedula: cedula.trim() ? cedula.trim() : null,
        estado_salud: estadoSalud,
        notas: notas.trim() ? notas.trim() : null
      });
      
      alert("Persona registrada con éxito en el censo nacional.");
      setNombreCompleto('');
      setCedula('');
      setEstadoSalud('atendido');
      setNotas('');
      fetchPersonas();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al registrar persona.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'atendido':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'en_atencion':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'trasladado':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'fallecido':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
      {/* FORMULARIO DE REGISTRO */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl h-fit">
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-blue-500" /> Registrar Ingreso
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-6 uppercase tracking-wider">Registra refugiados, pacientes o damnificados en tu zona.</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Nombre Completo</label>
            <input 
              type="text"
              required
              value={nombreCompleto}
              onChange={e => setNombreCompleto(e.target.value)}
              placeholder="Nombre y Apellido"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Cédula (Opcional)</label>
            <input 
              type="text"
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              placeholder="Ej: 21345678"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Estado de Salud / Situación</label>
            <select
              value={estadoSalud}
              onChange={e => setEstadoSalud(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="atendido">🟢 Atendido / Estable</option>
              <option value="en_atencion">🟡 En Atención / En Observación</option>
              <option value="trasladado">🔵 Trasladado a Otro Centro</option>
              <option value="fallecido">⚫ Fallecido</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Notas u Observaciones (Opcional)</label>
            <textarea 
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Ingresó por deshidratación leve. Familiares notificados."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm h-24 resize-none outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !nombreCompleto.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Registrar Persona
          </button>
        </form>
      </div>

      {/* LISTADO / HISTORIAL */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-500" /> Personas Censadas en este Punto
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-6 uppercase tracking-wider">Historial de refugiados o ingresados que has registrado.</p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : personas.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-slate-800 dark:text-white font-black uppercase tracking-wider text-sm mb-1">Sin registros activos</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">Aún no has censado a ninguna persona en este punto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">
              {personas.map(persona => (
                <div 
                  key={persona.id} 
                  className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 relative shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">{persona.nombre_completo}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0 ${getStatusColor(persona.estado_salud)}`}>
                        {persona.estado_salud?.replace('_', ' ')}
                      </span>
                    </div>
                    {persona.cedula && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono tracking-wider mt-0.5">C.I: {persona.cedula}</p>
                    )}

                    {persona.notas && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-2.5 leading-relaxed break-words">
                        {persona.notas}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-200 dark:border-slate-800/50">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(persona.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

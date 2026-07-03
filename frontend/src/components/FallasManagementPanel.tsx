import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  AlertOctagon, CheckCircle2, Circle, Trash2, 
  Loader2, Mail, Smartphone, RefreshCw, Eye, EyeOff
} from 'lucide-react';

export const FallasManagementPanel: React.FC = () => {
  const [fallas, setFallas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'resueltas'>('todas');

  const fetchFallas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fallas');
      setFallas(res.data);
    } catch (err) {
      console.error("Error cargando fallas para administración", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFallas();
  }, []);

  const handleResolverFalla = async (id: string, currentResuelta: boolean) => {
    setActionLoadingId(id);
    try {
      await api.put(`/fallas/${id}/resolver?resuelta=${!currentResuelta}`);
      alert(`Falla marcada como ${!currentResuelta ? 'resuelta' : 'pendiente'}.`);
      fetchFallas();
    } catch (err) {
      console.error("Error al actualizar estado de falla", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEliminarFalla = async (id: string) => {
    if (!confirm("¿Deseas eliminar definitivamente este reporte de falla?")) return;
    
    setActionLoadingId(id);
    try {
      await api.delete(`/fallas/${id}`);
      alert("Reporte de falla eliminado.");
      fetchFallas();
    } catch (err) {
      console.error("Error eliminando reporte de falla", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredFallas = fallas.filter(f => {
    if (filtro === 'pendientes') return !f.resuelta;
    if (filtro === 'resueltas') return f.resuelta;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" /> Registro de Fallas y Bugs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Revisa los reportes técnicos enviados por los usuarios de la plataforma.
          </p>
        </div>
        
        <button 
          onClick={fetchFallas}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
        >
          <RefreshCw className="w-4 h-4" /> Recargar Reportes
        </button>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['todas', 'pendientes', 'resueltas'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
              filtro === f 
                ? 'bg-red-600 text-white shadow-md shadow-red-500/10' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {f === 'todas' ? 'Ver Todas' : f === 'pendientes' ? '🚨 Pendientes' : '✅ Resueltas'}
          </button>
        ))}
      </div>

      {/* LISTADO */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : filteredFallas.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">
          No hay reportes de fallas en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFallas.map(falla => (
            <div 
              key={falla.id} 
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                falla.resuelta 
                  ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70' 
                  : 'border-red-500/30 bg-red-950/10'
              }`}
            >
              {/* Contenido e Info */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${falla.resuelta ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500 text-white'}`}>
                    {falla.resuelta ? 'Resuelta' : 'Pendiente'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {new Date(falla.created_at).toLocaleString('es-VE')}
                  </span>
                </div>

                <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed break-words whitespace-pre-line bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  {falla.descripcion}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-500" /> {falla.nombre_usuario} {falla.email ? `(${falla.email})` : ''}</span>
                  <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-purple-500" /> {falla.dispositivo}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 w-full md:w-auto self-end md:self-center shrink-0">
                <button
                  onClick={() => handleResolverFalla(falla.id, falla.resuelta)}
                  disabled={actionLoadingId === falla.id}
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                    falla.resuelta
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/20 shadow-lg shadow-emerald-500/15'
                  }`}
                >
                  {falla.resuelta ? (
                    <>
                      <Circle className="w-4 h-4" /> Marcar Pendiente
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Resolver Falla
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleEliminarFalla(falla.id)}
                  disabled={actionLoadingId === falla.id}
                  className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center"
                  title="Eliminar Reporte"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

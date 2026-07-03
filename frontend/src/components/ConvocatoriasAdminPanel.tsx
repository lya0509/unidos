import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  ClipboardList, CheckCircle2, XCircle, Trash2, 
  Loader2, Users, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';

export const ConvocatoriasAdminPanel: React.FC = () => {
  const [convocatorias, setConvocatorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inscritos, setInscritos] = useState<Record<string, any[]>>({});
  const [inscritosLoading, setInscritosLoading] = useState<string | null>(null);

  const fetchConvocatorias = async () => {
    setLoading(true);
    try {
      const res = await api.get('/convocatorias/admin/todas');
      setConvocatorias(res.data);
    } catch (err) {
      console.error("Error cargando convocatorias", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInscritos = async (id: string) => {
    setInscritosLoading(id);
    try {
      const res = await api.get(`/convocatorias/${id}/inscritos`);
      setInscritos(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {
      console.error("Error cargando inscritos", err);
    } finally {
      setInscritosLoading(null);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!inscritos[id]) fetchInscritos(id);
    }
  };

  const handleCerrar = async (id: string) => {
    if (!confirm("¿Deseas cerrar esta convocatoria?")) return;
    try {
      await api.put(`/convocatorias/${id}/cerrar`);
      alert("Convocatoria cerrada.");
      fetchConvocatorias();
    } catch (err) { console.error(err); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta convocatoria y todos sus inscritos definitivamente?")) return;
    try {
      await api.delete(`/convocatorias/${id}`);
      alert("Convocatoria eliminada.");
      fetchConvocatorias();
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchConvocatorias(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-rose-500" /> Gestión de Convocatorias
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Administra las convocatorias de voluntariado y sus inscritos.</p>
        </div>
        <button onClick={fetchConvocatorias} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase">
          <RefreshCw className="w-4 h-4" /> Recargar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
      ) : convocatorias.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">No hay convocatorias registradas.</div>
      ) : (
        <div className="space-y-4">
          {convocatorias.map(c => {
            const pct = Math.min(100, Math.round((c.inscritos_count / c.limite_personas) * 100));
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className={`rounded-2xl border overflow-hidden transition-all ${c.activa ? 'border-rose-500/20 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-70'}`}>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.activa ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {c.activa ? 'Activa' : 'Cerrada'}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{c.titulo}</h3>
                      <p className="text-xs text-slate-500 font-bold">Por: {c.creador_nombre} · {new Date(c.created_at).toLocaleDateString('es-VE')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {c.activa && (
                        <button onClick={() => handleCerrar(c.id)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-500 hover:text-white border border-slate-200 dark:border-slate-700 transition-colors" title="Cerrar convocatoria">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleEliminar(c.id)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-500 hover:text-white border border-slate-200 dark:border-slate-700 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300">{c.descripcion}</p>
                  {c.instrucciones && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs font-bold text-amber-800 dark:text-amber-300">
                      📋 {c.instrucciones}
                    </div>
                  )}

                  {/* Barra de progreso */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                      <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Inscritos</span>
                      <span className="text-rose-500">{c.inscritos_count} / {c.limite_personas}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Toggle inscritos */}
                  <button onClick={() => toggleExpand(c.id)} className="w-full flex items-center justify-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider py-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? 'Ocultar Inscritos' : `Ver Inscritos (${c.inscritos_count})`}
                  </button>
                </div>

                {/* Lista de inscritos expandible */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    {inscritosLoading === c.id ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-rose-500" /></div>
                    ) : !inscritos[c.id] || inscritos[c.id].length === 0 ? (
                      <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-4">No hay inscritos aún.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {inscritos[c.id].map((ins, idx) => (
                          <div key={ins.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-slate-400 w-6">{idx + 1}.</span>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{ins.nombre_completo}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">C.I: {ins.cedula} {ins.telefono ? `· Tel: ${ins.telefono}` : ''}</p>
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold">{new Date(ins.created_at).toLocaleDateString('es-VE')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

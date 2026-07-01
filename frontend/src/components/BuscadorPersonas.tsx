import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, MapPin, Activity, Calendar, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export const BuscadorPersonas = () => {
  const [query, setQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && filtroEstado === 'Todos') return;
    
    setLoading(true);
    try {
      const res = await api.get(`/personas/buscar?q=${encodeURIComponent(query)}&estado=${filtroEstado !== 'Todos' ? filtroEstado : ''}`);
      setResultados(res.data);
      setSearched(true);
    } catch (err) {
      console.error('Error buscando personas', err);
      setResultados([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filtroEstado !== 'Todos' && !query) {
      handleSearch();
    }
  }, [filtroEstado]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
        
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3 mb-6">
          <Search className="text-blue-400 w-6 h-6" /> Buscador de Personas
        </h2>
        
        <p className="text-slate-400 text-xs font-bold mb-6">
          Ingresa el nombre, apellido o número de cédula para localizar a una persona registrada en algún centro o refugio de la red.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
              <UserIcon className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, Apellido o Cédula..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white placeholder:text-slate-500 transition-all"
            />
          </div>
          
          <div className="w-full md:w-48 shrink-0">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white transition-all uppercase tracking-wider cursor-pointer"
            >
              <option value="Todos">Cualquier Estado</option>
              <option value="atendido">Atendido</option>
              <option value="en_atencion">En Atención</option>
              <option value="trasladado">Trasladado</option>
              <option value="fallecido">Fallecido</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-xl uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[120px] shadow-lg shadow-blue-900/20"
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : 'Buscar'}
          </button>
        </form>
      </div>

      {/* Resultados */}
      {searched && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
            Resultados de la Búsqueda ({resultados.length})
          </h3>
          
          {resultados.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <Search className="w-12 h-12 text-slate-700 mb-4" />
              <h4 className="text-white font-black uppercase tracking-wider mb-2">No se encontraron registros</h4>
              <p className="text-slate-500 text-xs font-bold">Intenta buscar con otros términos o verifica que el número de cédula sea correcto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultados.map((persona) => (
                <div key={persona.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-slate-600 transition-colors">
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl
                    ${persona.estado_salud === 'atendido' ? 'bg-emerald-600 text-white' : 
                      persona.estado_salud === 'en_atencion' ? 'bg-amber-500 text-white' : 
                      persona.estado_salud === 'fallecido' ? 'bg-slate-800 text-slate-300' :
                      'bg-blue-600 text-white'}`}
                  >
                    {persona.estado_salud?.replace('_', ' ')}
                  </div>
                  
                  <div className="flex gap-4 items-start mb-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">{persona.nombre_completo}</h4>
                      {persona.cedula && (
                        <p className="text-xs text-slate-400 font-bold font-mono tracking-wider">C.I: {persona.cedula}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-start gap-2 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-0.5">Ubicación Actual</p>
                        <p className="text-white font-bold">{persona.usuarios?.nombre || 'Centro Desconocido'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-xs pt-2 border-t border-slate-700/50">
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-0.5">Fecha de Ingreso / Registro</p>
                        <p className="text-slate-200">{new Date(persona.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {persona.notas && (
                      <div className="flex items-start gap-2 text-xs pt-2 border-t border-slate-700/50">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-0.5">Observaciones</p>
                          <p className="text-slate-300">{persona.notas}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

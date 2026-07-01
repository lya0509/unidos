import React, { useState } from 'react'
import { Search, Loader2, MapPin, Activity, User as UserIcon } from 'lucide-react'
import api from '../services/api'

interface PersonaEncontradía {
  id: string
  nombre_completo: string
  cedula?: string
  estado_salud: string
  notas?: string
  created_at: string
  usuarios: {
    nombre: string
    zona_operacion: string
    rol: string
  }
}

export const PersonFinder: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PersonaEncontradía[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 3) {
      setError('Ingresa al menos 3 caracteres para buscar.')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const res = await api.get(`/personas/buscar?q=${encodeURIComponent(query)}`)
      setResults(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al buscar personas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-xl">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Buscador de Personas
            </h2>
            <p className="text-xs font-bold text-slate-500">
              Localiza familiares registrados en clínicas o refugios
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, apellido o cédula..."
            className="w-full pl-5 pr-14 py-4 bg-slate-100 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center w-12"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-xs font-bold mt-3 text-center">{error}</p>
        )}
      </div>

      {searched && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">
            Resultados ({results.length})
          </h3>
          
          {results.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <UserIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">No se encontraron coincidencias.</p>
              <p className="text-xs text-slate-400 mt-2">Intenta buscar solo por un apellido o un nombre.</p>
            </div>
          ) : (
            results.map((p) => (
              <div key={p.id} className="glass-panel p-5 rounded-xl border border-blue-500/20 relative group hover:border-blue-500/50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {p.nombre_completo}
                    </h4>
                    {p.cedula && (
                      <p className="text-sm font-bold text-slate-500 mb-2">CI: {p.cedula}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 mt-3">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{p.usuarios?.nombre} ({p.usuarios?.rol.replace('_', ' ')})</span>
                    </div>
                    {p.usuarios?.zona_operacion && (
                      <div className="ml-6 mt-1">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                          Zona: {p.usuarios.zona_operacion.includes('||') ? p.usuarios.zona_operacion.split('||')[0] : p.usuarios.zona_operacion}
                        </p>
                        <a 
                          href={
                            p.usuarios.zona_operacion.includes('||') && p.usuarios.zona_operacion.split('||').length >= 3
                              ? `https://www.google.com/maps/search/?api=1&query=${p.usuarios.zona_operacion.split('||')[1]},${p.usuarios.zona_operacion.split('||')[2]}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.usuarios.zona_operacion.includes('||') ? p.usuarios.zona_operacion.split('||')[0] : p.usuarios.zona_operacion) + ', Venezuela')}`
                          }
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 font-bold text-[10px] uppercase px-2 py-1 rounded border border-blue-500/30 transition-colors"
                        >
                          <MapPin className="w-3 h-3" /> Ver Ubicación
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end justify-between">
                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      p.estado_salud === 'A Salvo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-500/30' :
                      p.estado_salud === 'Fallecido' ? 'bg-slate-800 text-white border border-slate-700' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      <Activity className="w-4 h-4" />
                      {p.estado_salud}
                    </div>
                    
                    <div className="text-right mt-3 md:mt-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registrado el</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {p.notas && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Notas del centro:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">{p.notas}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

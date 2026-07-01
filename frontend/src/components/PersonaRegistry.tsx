import React, { useState, useEffect } from 'react'
import { Users, Save, Loader2, Search, User as UserIcon, Activity } from 'lucide-react'
import api from '../services/api'

interface Persona {
  id: string
  nombre_completo: string
  cedula?: string
  estado_salud: string
  notas?: string
  created_at: string
}

export const PersonaRegistry: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('V-')
  const [estadoSalud, setEstadoSalud] = useState('A Salvo')
  const [notas, setNotas] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    try {
      setFetching(true)
      const res = await api.get('/personas/centro')
      setPersonas(res.data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        nombre_completo: nombre,
        cedula: cedula.includes('-') && cedula.split('-')[1].length > 0 ? cedula : null,
        estado_salud: estadoSalud,
        notas: notas
      }
      const res = await api.post('/personas/', payload)
      setPersonas([res.data, ...personas])
      setNombre('')
      setCedula('V-')
      setEstadoSalud('A Salvo')
      setNotas('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrar persona')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Registrar Ingreso
            </h2>
            <p className="text-xs font-bold text-slate-500">
              Anota a las personas que llegan para ayudar a sus familiares a encontrarlas.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                Nombre Completo *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-600 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                Cédula (Opcional)
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden focus-within:border-blue-500 transition-all">
                <select 
                  value={cedula.split('-')[0] || 'V'} 
                  onChange={(e) => setCedula(e.target.value + '-' + (cedula.split('-')[1] || ''))}
                  className="bg-slate-200 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white px-2 outline-none border-r border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                </select>
                <input
                  type="text"
                  value={cedula.includes('-') ? cedula.split('-')[1] : cedula.replace(/^[VE]-/, '')}
                  onChange={(e) => {
                    const type = (cedula.split('-')[0] || 'V').replace(/[^VE]/g, 'V');
                    const num = e.target.value.replace(/\D/g, '');
                    setCedula(`${type}-${num}`);
                  }}
                  placeholder="12345678"
                  className="w-full px-3 py-2.5 bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                Estado Médico *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-600 pointer-events-none">
                  <Activity className="w-4 h-4" />
                </span>
                <select
                  required
                  value={estadoSalud}
                  onChange={(e) => setEstadoSalud(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all appearance-none"
                >
                  <option value="A Salvo">A Salvo / Sano</option>
                  <option value="Atendido">Atendido / Estable</option>
                  <option value="Herido">Herido / Crítico</option>
                  <option value="Trasladíado">Trasladíado a otro centro</option>
                  <option value="Fallecido">Fallecido</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                Notas (Opcional)
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ropa que vestía, acompañantes..."
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-lg active:scale-95 disabled:opacity-50 transition-all uppercase text-sm tracking-widest flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Registrar Persona
          </button>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          Registrados en este lugar
        </h3>
        
        {fetching ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : personas.length === 0 ? (
          <p className="text-center text-slate-500 font-bold p-4">No hay personas registradías aún.</p>
        ) : (
          <div className="space-y-3">
            {personas.map(p => (
              <div key={p.id} className="p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{p.nombre_completo}</h4>
                  <p className="text-xs text-slate-500 font-bold">{p.cedula || 'Sin cédula'} • {new Date(p.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs font-black uppercase tracking-widest rounded-md ${
                    p.estado_salud === 'A Salvo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    p.estado_salud === 'Fallecido' ? 'bg-slate-800 text-white' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {p.estado_salud}
                  </span>
                  {p.notas && <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{p.notas}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

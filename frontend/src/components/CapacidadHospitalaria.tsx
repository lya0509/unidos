import React, { useState, useEffect } from 'react'
import { Activity, HeartHandshake, Check, Package, Save, Loader2, BedDouble, Stethoscope } from 'lucide-react'
import api from '../services/api'

interface CapacidadHospitalariaProps {
  inventory: any[];
  onUpdate: () => void;
}

const AREAS = [
  { id: "Camillas Disponibles - Primeros Auxilios", label: "Primeros Auxilios", icon: Activity, color: "blue" },
  { id: "Camillas Disponibles - UCI", label: "UCI", icon: HeartHandshake, color: "red" },
  { id: "Camillas Disponibles - Cirugía", label: "Cirugía", icon: Check, color: "emerald" },
  { id: "Camillas Disponibles - Observación", label: "Observación", icon: Stethoscope, color: "purple" },
  { id: "Camas Pediátricas Disponibles", label: "Camas Pediátricas", icon: BedDouble, color: "pink" },
  { id: "Sillas de Ruedías Disponibles", label: "Silla de Ruedías", icon: Package, color: "amber" },
]

export function CapacidadHospitalaria({ inventory, onUpdate }: CapacidadHospitalariaProps) {
  const [capacities, setCapacities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const initial: Record<string, number> = {}
    AREAS.forEach(area => {
      const found = inventory.find(i => i.insumo === area.id)
      initial[area.id] = found ? found.cantidad : 0
    })
    setCapacities(initial)
  }, [inventory])

  const handleSave = async () => {
    setLoading(true)
    setSuccessMsg('')
    try {
      for (const area of AREAS) {
        const currentValInDB = inventory.find(i => i.insumo === area.id)?.cantidad || 0
        const newVal = capacities[area.id]
        
        const diff = newVal - currentValInDB
        if (diff !== 0) {
          await api.post('/inventario/manual', {
            insumo: area.id,
            cantidad: diff
          })
        }
      }
      setSuccessMsg('Capacidad actualizadía correctamente.')
      onUpdate()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error('Error actualizando capacidíad', err)
      alert('Hubo un error al actualizar la capacidíad.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-6 relative z-50">
      <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
        <Activity className="w-6 h-6 text-red-500" /> Capacidad Médica
      </h2>
      
      {successMsg && (
        <div className="bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-sm px-4 py-3 rounded-lg mb-6 font-bold flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="space-y-4 mb-8">
        {AREAS.map((area) => {
          const Icon = area.icon
          const colorClass = `text-${area.color}-600 dark:text-${area.color}-400`
          const bgClass = `bg-${area.color}-50 dark:bg-${area.color}-900/20`
          const borderClass = `border-${area.color}-200 dark:border-${area.color}-800`

          return (
            <div key={area.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${bgClass} ${borderClass}`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${colorClass}`} />
                <span className="font-bold text-slate-800 dark:text-slate-200">{area.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCapacities(prev => ({ ...prev, [area.id]: Math.max(0, prev[area.id] - 1) }))}
                  className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                >-</button>
                <input 
                  type="number" 
                  min="0"
                  value={capacities[area.id] || 0}
                  onChange={(e) => setCapacities(prev => ({ ...prev, [area.id]: parseInt(e.target.value) || 0 }))}
                  className="w-16 h-10 text-center font-black text-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => setCapacities(prev => ({ ...prev, [area.id]: prev[area.id] + 1 }))}
                  className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                >+</button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95 transition-all font-black uppercase tracking-widest"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Guardíar Capacidad
      </button>
    </div>
  )
}

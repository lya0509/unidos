import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  Activity,
  Package,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface StatsData {
  sos: {
    total: number
    abiertos: number
    entregados: number
    cancelados: number
    en_camino: number
  }
  inventario: {
    total_registros: number
    por_insumo: Record<string, number>
  }
  usuarios: {
    total: number
    por_rol: Record<string, number>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export function CommandDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/stats/global')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!stats || 'error' in stats) {
    return (
      <div className="text-center py-20 text-red-400 font-bold">
        Error cargando estadA-sticas
      </div>
    )
  }

  const sosCards = [
    {
      label: 'Total SOS',
      value: stats.sos.total,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-500/30',
      glow: 'shadow-blue-500/20',
      bg: 'bg-blue-100 dark:bg-blue-500/10',
    },
    {
      label: 'Abiertos',
      value: stats.sos.abiertos,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-500/30',
      glow: 'shadow-amber-500/20',
      bg: 'bg-amber-100 dark:bg-amber-500/10',
    },
    {
      label: 'En Camino',
      value: stats.sos.en_camino,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-300 dark:border-indigo-500/30',
      glow: 'shadow-indigo-500/20',
      bg: 'bg-indigo-100 dark:bg-indigo-500/10',
    },
    {
      label: 'Completados',
      value: stats.sos.entregados,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-300 dark:border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
      bg: 'bg-emerald-100 dark:bg-emerald-500/10',
    },
    {
      label: 'Cancelados',
      value: stats.sos.cancelados,
      icon: XCircle,
      color: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-500/30',
      glow: 'shadow-slate-500/20',
      bg: 'bg-slate-100 dark:bg-slate-500/10',
    },
  ]

  const rolesData = Object.entries(stats.usuarios.por_rol).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  const inventoryData = Object.entries(stats.inventario.por_insumo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <BarChart3 className="w-7 h-7 text-blue-400 relative z-10" />
          <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase">
            Centro de Comando
          </h2>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.2em] -mt-0.5">
            Estadísticas en tiempo real
          </p>
        </div>
      </div>

      {/* SOS Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sosCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl border ${card.border} ${card.bg} p-4 shadow-lg ${card.glow} transition-all hover:scale-105`}
          >
            <card.icon className={`w-5 h-5 mb-2 ${card.color} opacity-80`} />
            <div className="relative z-10">
              <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
              <p className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mt-0.5">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Users Card with PieChart */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg flex flex-col h-72">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              Usuarios
            </h3>
            <span className="ml-auto text-2xl font-black text-purple-600 dark:text-purple-400">
              {stats.usuarios.total}
            </span>
          </div>
          <div className="flex-1 min-h-0 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rolesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {rolesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Card with BarChart */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg flex flex-col h-72">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              Inventario Top 10
            </h3>
            <span className="ml-auto text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {stats.inventario.total_registros}
            </span>
          </div>
          <div className="flex-1 min-h-0 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                   cursor={{fill: '#334155'}}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                  {
                    inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

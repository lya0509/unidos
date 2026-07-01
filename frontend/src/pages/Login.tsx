import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { HeartHandshake, Mail, Lock, Loader2, Activity, Eye, EyeOff, Sun, Moon, Battery } from 'lucide-react'

interface LoginProps {
  onNavigateToRegister: () => void
  onNavigateToGuest?: () => void
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister, onNavigateToGuest }) => {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, contrasena)
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail ? JSON.stringify(detail) : 'Error de conexión.');
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10 relative flex flex-col justify-center items-center px-6 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Theme selector in top right */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleTheme} 
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-colors"
        >
          {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Battery className="w-4 h-4 text-green-500" />}
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="relative">
          <HeartHandshake className="text-blue-500 w-16 h-16 animate-pulse" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-widest text-shadow-glow">
          Uni<span className="text-blue-600 dark:text-blue-500">dos</span>
        </h1>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 mt-1" />
      </div>

      <div className="w-full max-w-md glass-panel p-8 rounded-xl relative overflow-hidden">
        {/* Tech decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/30 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/30 rounded-br-xl" />

        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center uppercase tracking-widest">Acceso</h2>
        <p className="text-blue-600/80 dark:text-blue-400/70 text-xs mb-8 text-center uppercase tracking-widest font-bold">Autenticación Requerida</p>

        {error && (
          <div className="bg-red-100 dark:bg-red-950/50 border border-red-500/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-6 font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <Activity className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Credencial ID</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-blue-600 dark:text-blue-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@unidos.ve"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Código de Seguridad</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-blue-600 dark:text-blue-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500 transition-all tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600/80 hover:bg-blue-500 text-white font-black py-4 rounded-lg active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2 uppercase tracking-wider border border-blue-400/50 glow-blue transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        <div className="mt-8 text-center space-y-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
            ¿No autorizado?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-1 underline transition-all"
            >
              Solicitar Acceso
            </button>
          </p>
          {onNavigateToGuest && (
            <button
              onClick={onNavigateToGuest}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
            >
              ← Volver al Mapa Público
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

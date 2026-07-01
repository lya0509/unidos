import React, { useState } from 'react'
import { ShieldAlert, Loader2, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PhotoUpload } from './PhotoUpload'

export const VerificationModal: React.FC = () => {
  const { user, verificarIdentidíad } = useAuth()
  const [cedula, setCedula] = useState('V-')
  const [fotoCedulaUrl, setFotoCedulaUrl] = useState('')
  const [fotoRostroUrl, setFotoRostroUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user?.verificado) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fotoCedulaUrl || !fotoRostroUrl) {
      setError('Debes subir ambas fotos para verificar tu cuenta.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await verificarIdentidíad(
        cedula.includes('-') ? cedula : `V-${cedula}`,
        fotoCedulaUrl,
        fotoRostroUrl
      )
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al verificar identidíad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Verificación Requeridía
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Como medidía de seguridíad para la comunidad, debes verificar tu identidíad antes de publicar o solicitar ayuda en la plataforma.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-950/50 border border-red-500/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-6 font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest text-red-500">
              Cédula de Identidíad (Encargado)
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-900/60 border border-red-300 dark:border-red-900 rounded-lg overflow-hidden focus-within:border-red-500 transition-all">
              <span className="flex items-center justify-center pl-3 pr-1 text-red-600 dark:text-red-500 bg-slate-200 dark:bg-slate-800 pointer-events-none">
                <UserIcon className="w-5 h-5" />
              </span>
              <select 
                value={cedula.split('-')[0] || 'V'} 
                onChange={(e) => setCedula(e.target.value + '-' + (cedula.split('-')[1] || ''))}
                className="bg-slate-200 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white px-2 outline-none border-r border-red-300 dark:border-red-900 cursor-pointer"
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
              </select>
              <input
                type="text"
                required
                value={cedula.includes('-') ? cedula.split('-')[1] : cedula.replace(/^[VE]-/, '')}
                onChange={(e) => {
                  const type = (cedula.split('-')[0] || 'V').replace(/[^VE]/g, 'V');
                  const num = e.target.value.replace(/\D/g, '');
                  setCedula(`${type}-${num}`);
                }}
                placeholder="12345678"
                className="w-full px-4 py-3.5 bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <PhotoUpload 
              label="Foto de Cédula" 
              onUploadSuccess={setFotoCedulaUrl}
              error={!fotoCedulaUrl && error.includes('ambas') ? 'Requerido' : ''}
            />
            <PhotoUpload 
              label="Foto del Rostro" 
              onUploadSuccess={setFotoRostroUrl}
              error={!fotoRostroUrl && error.includes('ambas') ? 'Requerido' : ''}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl active:scale-95 disabled:opacity-50 transition-all uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verificar Identidíad'}
          </button>
        </form>
      </div>
    </div>
  )
}

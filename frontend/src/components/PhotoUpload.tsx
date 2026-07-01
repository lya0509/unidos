import { useState, useRef } from 'react'
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react'
import api from '../services/api'

interface PhotoUploadProps {
  label: string
  onUploadSuccess: (url: string) => void
  error?: string
}

export function PhotoUpload({ label, onUploadSuccess, error }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/upload/verificacion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onUploadSuccess(res.data.url)
      setSuccess(true)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al subir la imagen. Verifica la conexión o el tamaño del archivo.')
      setPreview(null)
      setSuccess(false)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
          error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 
          success ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 
          'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {preview && (
          <div className="absolute inset-0 z-0 bg-slate-900/50">
            <img src={preview} alt="preview" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center bg-black/40 rounded-lg backdrop-blur-[2px]">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : success ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 drop-shadow-md" />
          ) : !preview ? (
            <UploadCloud className={`w-8 h-8 ${error ? 'text-red-400' : 'text-slate-400'}`} />
          ) : null}
          
          <span className={`text-xs font-bold uppercase tracking-wider ${
            error ? 'text-red-400' : 
            success ? 'text-emerald-400' : 
            preview ? 'text-white drop-shadow-md' :
            'text-slate-500 dark:text-slate-400'
          }`}>
            {uploading ? 'Subiendo...' : 
             success ? 'AArchivo subido!' : 
             preview ? 'Cambiar foto' :
             'Haz clic para subir foto'}
          </span>
        </div>
      </div>
      {error && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{error}</p>}
    </div>
  )
}

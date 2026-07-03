import { useTabNavigation } from '../../hooks/useTabNavigation';
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import { QrCode, PlusCircle, Package, Activity, Loader2, Check, MapPin, Calendar, MessageSquare, Sun, Moon, Battery, LogOut } from 'lucide-react'
import { DirectorioPanel } from '../../components/DirectorioPanel'
import { SOSChecklistForm } from '../../components/SOSChecklistForm'

export function IniciativaDashboard() {
  const { user, logout, deleteAccount } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useTabNavigation('qr')
  
  // SOS States
  const [sosList, setSosList] = useState([])
  const [showCreateSos, setShowCreateSos] = useState(false)
  const [sosData, setSosData] = useState('{"categorias":{},"cantidades":{},"detalles":""}')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // QR States
  const [insumoDonado, setInsumoDonado] = useState('')
  const [cantidadDonada, setCantidadDonada] = useState(1)
  const [generatedQR, setGeneratedQR] = useState('')

  // Inventory States
  const [myInventory, setMyInventory] = useState<any[]>([])
  const [manualInsumo, setManualInsumo] = useState('')
  const [manualCantidad, setManualCantidad] = useState(1)
  const [inventorySuccess, setInventorySuccess] = useState('')

  // Inventario Privacidad State
  const [publicarInventario, setPublicarInventario] = useState(user?.publicar_inventario !== false)

  const handleTogglePublicarInventario = async () => {
    try {
      const newVal = !publicarInventario
      await api.put('/auth/me/privacidad-inventario', { publicar: newVal })
      setPublicarInventario(newVal)
      alert(`Tu inventario ahora es ${newVal ? 'PÚBLICO (visible en el directorio)' : 'PRIVADO (oculto del directorio)'}.`)
    } catch (err: any) {
      alert('Error al actualizar la visibilidad del inventario.')
    }
  }

  const fetchSos = async () => {
    try {
      const res = await api.get(`/sos/feed?zona=${user?.zona_operacion || ''}`)
      setSosList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMyInventory = async () => {
    try {
      const res = await api.get('/inventario/mi-inventario')
      setMyInventory(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (user) {
      if (activeTab === 'sos') fetchSos()
      if (activeTab === 'inventory') fetchMyInventory()
    }
  }, [user, activeTab])

  // --- Handlers ---
  
  const handleCreateSos = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const parsed = JSON.parse(sosData);
      const allItems = Object.values(parsed.categorias || {}).flat() as string[];
      if (allItems.length === 0) {
        alert('Debes seleccionar al menos un insumo en la lista.');
        setLoading(false);
        return;
      }
      
      const insumo_solicitado = allItems.length === 1 
        ? allItems[0] 
        : `${allItems[0]} y ${allItems.length - 1} más`;
      
      const cantidad_solicitada = parseFloat(parsed.cantidades?.[allItems[0]] || '1');

      await api.post('/sos', {
        zona: user?.zona_operacion || 'general',
        insumo_solicitado,
        cantidad_solicitada,
        descripcion: sosData
      })
      setSosData('{"categorias":{},"cantidades":{},"detalles":""}')
      setShowCreateSos(false)
      fetchSos()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear alerta.')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveSos = async (sosId: string) => {
    try {
      await api.put(`/sos/resolver/${sosId}`)
      fetchSos()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al resolver alerta.')
    }
  }

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/qr/donacion', {
        insumo_donado: insumoDonado,
        cantidad_donada: cantidadDonada
      })
      setGeneratedQR(res.data.token_qr)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al generar QR.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddManualInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setInventorySuccess('')
    try {
      const res = await api.post('/inventario/manual', {
        insumo: manualInsumo,
        cantidad: manualCantidad
      })
      setInventorySuccess(res.data.mensaje)
      setManualInsumo('')
      setManualCantidad(1)
      fetchMyInventory()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al agregar inventario.')
    } finally {
      setLoading(false)
    }
  }

  const handleConsumeInventory = async (insumo: string) => {
    const qty = prompt(`¿Cuántas unidades de ${insumo} vas a restar/entregar?`)
    if (!qty) return
    const cantidad = parseFloat(qty)
    if (isNaN(cantidad) || cantidad <= 0) return alert('Cantidad inválida')

    try {
      await api.post('/inventario/consumir', { insumo, cantidad })
      fetchMyInventory()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al descontar inventario')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-white transition-colors duration-300">
      {/* HEADER FIJO SUPERIOR */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-50 p-4 shadow-sm dark:shadow-lg flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-blue-500 to-red-500 p-0.5 shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              {user?.foto_rostro_url ? (
                <img src={user.foto_rostro_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <Activity className="w-5 h-5 text-slate-400 dark:text-white" />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px]">
              {user?.nombre}
            </h1>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase">Iniciativa Ciudadana</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Battery className="w-4 h-4 text-green-500" />}
          </button>
          <button 
            onClick={logout}
            className="p-2 rounded-full bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/40 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 py-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 dark:bg-red-950/50 border border-red-500/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4 font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <Activity className="w-4 h-4" /> {error}
          </div>
        )}

      {/* DONAR TAB */}
      {activeTab === 'qr' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Donar Producto
            </h2>
            <p className="text-blue-600/80 dark:text-blue-400/70 text-xs font-bold uppercase tracking-widest">Generar token para Centro de Acopio</p>
          </div>

          <div className="glass-panel p-6 rounded-xl">
            {!generatedQR ? (
              <form onSubmit={handleGenerateQR} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Insumo / Producto</label>
                  <input
                    type="text"
                    required
                    value={insumoDonado}
                    onChange={(e) => setInsumoDonado(e.target.value)}
                    placeholder="Ej: Férulas 3D impresas"
                    className="w-full px-4 py-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Cantidad</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={cantidadDonada}
                    onChange={(e) => setCantidadDonada(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white text-center"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600/80 hover:bg-blue-500 text-white font-black py-4 rounded-lg active:scale-95 text-sm mt-4 flex items-center justify-center gap-2 uppercase tracking-wider border border-blue-400/50 glow-blue"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                  Generar Código QR
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="glass-panel inline-block p-6 rounded-xl mb-6 shadow-[0_0_30px_rgba(59,130,246,0.1)] dark:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${generatedQR}`}
                    alt="Código QR de Aporte"
                    className="w-48 h-48 mx-auto rounded-lg shadow-inner bg-white p-2"
                  />
                </div>
                <h3 className="text-xl font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-2">Token Generado</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed text-center mb-4">
                  Muestra este código al encargado del Centro de Acopio.
                </p>
                <div className="bg-slate-200 dark:bg-slate-900/80 p-3.5 rounded-lg max-w-xs mx-auto border border-blue-500/30 dark:border-blue-500/50 font-mono text-sm text-blue-700 dark:text-blue-400 font-bold break-all shadow-[0_0_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  {generatedQR}
                </div>
                <button
                  onClick={() => {
                    setGeneratedQR('')
                    setInsumoDonado('')
                    setCantidadDonada(1)
                  }}
                  className="mt-8 text-blue-600 dark:text-blue-400 font-bold text-sm hover:text-blue-500 dark:hover:text-blue-300 uppercase tracking-widest underline"
                >
                  Generar otro QR
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIRECTORIO TAB */}
      {activeTab === 'directorio' && (
        <DirectorioPanel />
      )}

      {/* SOS TAB */}
      {activeTab === 'sos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Muro General
              </h2>
              <p className="text-blue-600/80 dark:text-blue-400/70 text-xs font-bold uppercase tracking-widest">Alertas de todo el país</p>
            </div>
            {!showCreateSos && (
              <button
                onClick={() => setShowCreateSos(true)}
                className="bg-blue-600/80 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-black flex items-center gap-2 text-xs uppercase tracking-wider border border-blue-400/50 glow-blue transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" /> Pedir Materiales
              </button>
            )}
          </div>

          {showCreateSos && (
            <div className="glass-panel p-5 space-y-4 rounded-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nueva Solicitud</h3>
              <form onSubmit={handleCreateSos}>
                <SOSChecklistForm value={sosData} onChange={setSosData} />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateSos(false)}
                    className="px-5 py-2.5 rounded-lg font-bold text-slate-400 hover:bg-slate-800 text-sm uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600/80 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-black flex items-center gap-2 text-sm border border-blue-400/50 glow-blue disabled:opacity-50 uppercase tracking-wider"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar Alerta'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {sosList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-300 dark:border-slate-800 border-dashed rounded-xl">Sin alertas activas</div>
            ) : (
              sosList.map((sos: any) => (
                <div key={sos.id} className="glass-panel p-5 relative overflow-hidden rounded-xl">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        sos.urgente 
                          ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30' 
                          : 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30'
                      }`}>
                        <Activity className="w-3.5 h-3.5" /> {sos.urgente ? 'URGENTE' : 'SOS'}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {sos.usuarios?.zona_operacion || 'Sin Zona'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white uppercase tracking-wider">{sos.usuarios?.nombre}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2 leading-relaxed">
                      {sos.descripcion}
                    </p>
                    
                    {sos.solicitante_id === user?.id && (
                      <button
                        onClick={() => handleResolveSos(sos.id)}
                        className="mt-4 w-full bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 active:scale-95 text-sm uppercase tracking-wider"
                      >
                        <Check className="w-4 h-4" /> Marcar como Resuelto
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /> Mi Inventario
              </h2>
              <p className="text-yellow-600/80 dark:text-yellow-400/70 text-xs font-bold uppercase tracking-widest">Control de materias primas</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Visibilidad:</span>
              <button
                onClick={handleTogglePublicarInventario}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95 border ${
                  publicarInventario
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                }`}
              >
                {publicarInventario ? '🔓 Público' : '🔒 Privado'}
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl shadow-inner border border-slate-300 dark:border-slate-700/50">
            {myInventory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-300 dark:border-slate-800 border-dashed rounded-xl m-2">Inventario vacío</div>
            ) : (
              myInventory.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center border border-blue-500/30">
                      <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{item.insumo}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-xl text-blue-600 dark:text-blue-400">x{item.cantidad}</span>
                    <button
                      onClick={() => handleConsumeInventory(item.insumo)}
                      className="bg-red-100 dark:bg-red-950/50 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform uppercase tracking-widest"
                    >
                      Restar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="glass-panel p-5 space-y-4 rounded-xl mt-4">
            <h3 className="text-lg font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Añadir Manualmente</h3>
            {inventorySuccess && (
              <div className="bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-sm px-4 py-3 rounded-lg font-bold flex items-center gap-2">
                <Check className="w-5 h-5" /> {inventorySuccess}
              </div>
            )}
            <form onSubmit={handleAddManualInventory} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={manualInsumo}
                onChange={(e) => setManualInsumo(e.target.value)}
                placeholder="Insumo (ej. Férulas)"
                className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  required
                  min="1"
                  value={manualCantidad}
                  onChange={(e) => setManualCantidad(parseInt(e.target.value) || 1)}
                  className="w-24 px-4 py-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white text-center"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600/80 hover:bg-blue-500 text-white font-black px-6 rounded-lg active:scale-95 disabled:opacity-50 text-sm uppercase tracking-wider border border-blue-400/50 glow-blue flex-1 sm:flex-none"
                >
                  Sumar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation para Iniciativa Ciudadíana */}
              <div className="mt-12 mb-24 flex justify-center pb-safe">
          <button
            onClick={async () => {
              if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
                try {
                  await deleteAccount();
                } catch (e) {
                  alert('Error al eliminar cuenta');
                }
              }
            }}
            className="flex items-center gap-2 text-red-500/70 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors py-4 px-6 border border-red-500/20 rounded-xl hover:bg-red-500/10"
          >
            Eliminar Cuenta
          </button>
        </div>
      </div> {/* Closing flex-1 content area */}
      <nav className="fixed bottom-0 left-0 w-full glass z-50 border-t border-slate-200/80 dark:border-slate-800/80 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="flex justify-center items-center h-20 px-2 max-w-lg mx-auto gap-4 sm:gap-8">
          <button 
            onClick={() => setActiveTab('qr')}
            className={`flex flex-col items-center gap-1.5 w-24 transition-all ${activeTab === 'qr' ? 'text-blue-600 dark:text-blue-400 scale-105 bg-slate-100/80 dark:bg-slate-800/80 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <QrCode className="w-6 h-6" />
            <span className="text-[10px] font-black tracking-widest uppercase">Donar</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('sos')}
            className={`flex flex-col items-center gap-1.5 w-24 transition-all ${activeTab === 'sos' ? 'text-red-600 dark:text-red-400 scale-105 bg-slate-100/80 dark:bg-slate-800/80 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Activity className="w-6 h-6" />
            <span className="text-[10px] font-black tracking-widest uppercase">Muro SOS</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center gap-1.5 w-24 transition-all ${activeTab === 'inventory' ? 'text-yellow-600 dark:text-yellow-400 scale-105 bg-slate-100/80 dark:bg-slate-800/80 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Package className="w-6 h-6" />
            <span className="text-[10px] font-black tracking-widest uppercase">Inventario</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('directorio')}
            className={`flex flex-col items-center gap-1.5 w-24 transition-all ${activeTab === 'directorio' ? 'text-[#0038A8] dark:text-blue-400 scale-105 bg-slate-100/80 dark:bg-slate-800/80 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-black tracking-widest uppercase">Directorio</span>
          </button>
        </div>
      </nav>
    </div>
  )
}







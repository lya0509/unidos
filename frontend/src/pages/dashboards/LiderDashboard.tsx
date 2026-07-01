import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTabNavigation } from '../../hooks/useTabNavigation'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import { Activity, Map as MapIcon, Search, AlertTriangle, Radio, Sun, Moon, Battery, MessageSquare, Flag, ShieldAlert, ScanLine, LogOut, Share2, Pencil, Trash2, Check, Users, MapPin } from 'lucide-react'
import { RadarMap } from '../../components/RadarMap'
import { SOSChecklistForm } from '../../components/SOSChecklistForm'
import { SOSDescriptionDisplay } from '../../components/SOSDescriptionDisplay'
import { DirectorioPanel } from '../../components/DirectorioPanel'
import { ChatBox } from '../../components/ChatBox'
import { QRScanner } from '../../components/QRScanner'
import { CensoPersonasPanel } from '../../components/CensoPersonasPanel'

export const LiderDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useTabNavigation('mapa')
  
  const [sosList, setSosList] = useState<any[]>([])
  const [anuncios, setAnuncios] = useState<any[]>([])
  
  const [filtroZona, setFiltroZona] = useState('Nacional')
  const { theme, toggleTheme } = useTheme()
  const [lowDataMode, setLowDataMode] = useState(false)

  const getCoordinates = (zonaStr: string) => {
    if (!zonaStr) return null;
    const parts = zonaStr.split('||');
    if (parts.length >= 3) {
      const lat = parseFloat(parts[1]);
      const lng = parseFloat(parts[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };
  const [showSOSForm, setShowSOSForm] = useState(false)
  const [anuncioText, setAnuncioText] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [sosData, setSosData] = useState('{"categorias":{},"cantidades":{},"detalles":""}')

  // Edit/Share SOS States
  const [editingSos, setEditingSos] = useState<any | null>(null)
  const [editInsumo, setEditInsumo] = useState('')
  const [editCantidad, setEditCantidad] = useState(1)
  const [editDetalles, setEditDetalles] = useState('')

  const handleEditSosClick = (sos: any) => {
    setEditingSos(sos);
    setEditInsumo(sos.insumo_solicitado);
    setEditCantidad(sos.cantidad_solicitada);
    try {
      if (sos.descripcion && sos.descripcion.startsWith('{')) {
        const parsed = JSON.parse(sos.descripcion);
        setEditDetalles(parsed.detalles || '');
      } else {
        setEditDetalles(sos.descripcion || '');
      }
    } catch {
      setEditDetalles(sos.descripcion || '');
    }
  }

  const handleUpdateSos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSos) return;
    try {
      let desc = editingSos.descripcion;
      try {
        if (editingSos.descripcion && editingSos.descripcion.startsWith('{')) {
          const parsed = JSON.parse(editingSos.descripcion);
          parsed.detalles = editDetalles;
          desc = JSON.stringify(parsed);
        } else {
          desc = JSON.stringify({ categorias: {}, cantidades: {}, detalles: editDetalles });
        }
      } catch {
        desc = JSON.stringify({ categorias: {}, cantidades: {}, detalles: editDetalles });
      }

      await api.put(`/sos/editar/${editingSos.id}`, {
        insumo_solicitado: editInsumo,
        cantidad_solicitada: editCantidad,
        descripcion: desc
      });
      alert('Alerta SOS actualizada con éxito.');
      setEditingSos(null);
      fetchSos();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al actualizar alerta.');
    }
  }

  const handleDeleteSos = async (sosId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta alerta SOS del mapa?')) return;
    try {
      await api.delete(`/sos/${sosId}`);
      alert('Alerta SOS eliminada con éxito.');
      fetchSos();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar alerta.');
    }
  }

  const handleResolveSos = async (sosId: string) => {
    try {
      await api.put(`/sos/resolver/${sosId}`)
      alert('Alerta marcada como resuelta.');
      fetchSos()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al resolver alerta.')
    }
  }

  const handleShareSos = (sos: any) => {
    const zonaName = (sos.zona || sos.usuarios?.zona_operacion || 'Nacional').split('||')[0];
    let detallesStr = '';
    try {
      if (sos.descripcion && sos.descripcion.startsWith('{')) {
        const parsed = JSON.parse(sos.descripcion);
        detallesStr = parsed.detalles || '';
      } else {
        detallesStr = sos.descripcion || '';
      }
    } catch {
      detallesStr = sos.descripcion || '';
    }
    const text = `🚨 *ALERTA SOS - UNIDOS* 🚨\n\n📍 *Zona:* ${zonaName}\n⚠️ *Se necesita:* ${sos.insumo_solicitado} x${sos.cantidad_solicitada}\n📝 *Detalles:* ${detallesStr || 'Sin detalles'}\n\n🔗 *Únete a la red y apoya en:* https://unidos.com.ve/`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('¡Mensaje de ayuda copiado al portapapeles! Compártelo por WhatsApp u otras redes.');
    } else {
      alert('Copia el siguiente texto:\n\n' + text);
    }
  }

  const handleCreateSOS = async () => {
    try {
      const parsed = JSON.parse(sosData);
      const allItems = Object.values(parsed.categorias || {}).flat() as string[];
      if (allItems.length === 0) {
        alert('Debes seleccionar al menos un insumo en la lista.');
        return;
      }
      
      const insumo_solicitado = allItems.length === 1 
        ? allItems[0] 
        : `${allItems[0]} y ${allItems.length - 1} más`;
      
      const cantidad_solicitada = parseFloat(parsed.cantidades?.[allItems[0]] || '1');
      
      await api.post('/sos', {
        zona: user?.zona_operacion || 'Nacional',
        insumo_solicitado,
        cantidad_solicitada,
        descripcion: sosData,
        latitud: 10.5,
        longitud: -66.9
      });
      
      alert('SOS emitido con éxito.');
      setShowSOSForm(false);
      fetchSos();
      setSosData('{"categorias":{},"cantidades":{},"detalles":""}');
    } catch (err) {
      alert('Error al emitir SOS.');
    }
  }

  const fetchSos = async () => {
    try {
      const res = await api.get(`/sos/feed?zona=${filtroZona}`)
      setSosList(res.data)
    } catch (err) {
      console.error('Error fetching SOS', err)
      setSosList([])
    }
  }

  const fetchAnuncios = async () => {
    try {
      const res = await api.get(`/anuncios/feed?zona=${filtroZona}`)
      setAnuncios(res.data)
    } catch (err) {
      console.error('Error fetching Anuncios', err)
      setAnuncios([])
    }
  }

  const handleReport = async (userId: string) => {
    const reason = prompt('¿Por qué deseas reportar a este usuario? (Estafa, Peligro, Falso...)')
    if (!reason) return
    try {
      const res = await api.post(`/auth/reportar/${userId}`, { motivo: reason })
      alert(res.data.msg || "Reporte enviado.")
    } catch (e: any) {
      if (e.response?.status === 423) {
        alert("Este usuario ha recibido múltiples reportes y ha sido bloqueado preventivamente.")
      } else {
        alert("Error al enviar reporte.")
      }
    }
  }

  const handleScanQR = async (token: string) => {
    try {
      const result = await api.post('/voluntarios/validar', { token })
      alert('Voluntario validado con éxito: ' + result.data.nombre)
      setShowScanner(false)
    } catch (error) {
      alert('Error al validar QR. Puede ser inválido o ya utilizado.')
    }
  }

  const publishAnuncio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!anuncioText.trim()) return
    try {
      await api.post('/anuncios', { mensaje: anuncioText, zona: user?.zona_operacion })
      setAnuncioText('')
      alert('Anuncio publicado con éxito')
      fetchAnuncios()
    } catch (err) {
      alert('Error al publicar anuncio')
    }
  }

  const deleteAnuncio = async (id: string) => {
    if(!confirm('¿Seguro que deseas borrar este anuncio?')) return
    try {
      await api.delete(`/anuncios/${id}`)
      fetchAnuncios()
    } catch (err) {
      alert('Error al borrar anuncio')
    }
  }

  useEffect(() => {
    fetchSos()
    fetchAnuncios()
  }, [filtroZona])

  const ZONAS = [
    'Nacional', 'Caracas', 'Distrito Capital', 'Miranda', 'Zulia', 'Carabobo', 'Lara', 'Aragua', 
    'Anzoátegui', 'Bolívar', 'Táchira', 'Mérida', 'Falcón', 'Sucre', 'Monagas', 'Barinas', 'Apure', 'Guárico', 'Cojedes', 'Portuguesa', 'Yaracuy', 'Nueva Esparta', 'Vargas'
  ]

  const TABS = [
    { id: 'mapa', icon: <MapIcon className="w-5 h-5" />, label: 'Radar' },
    { id: 'feed', icon: <AlertTriangle className="w-5 h-5" />, label: 'SOS' },
    { id: 'personas', icon: <Users className="w-5 h-5" />, label: 'Censo' },
    { id: 'directorio', icon: <Search className="w-5 h-5" />, label: 'Directorio' },
    { id: 'anuncios', icon: <Radio className="w-5 h-5" />, label: 'Avisos' },
    { id: 'voluntarios', icon: <ScanLine className="w-5 h-5" />, label: 'QR' },
    { id: 'chat', icon: <MessageSquare className="w-5 h-5" />, label: 'Chat' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-white transition-colors duration-300">
      {/* HEADER FIJO SUPERIOR */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-50 p-4 shadow-sm dark:shadow-lg flex justify-between items-center">
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
            <p className="text-[10px] text-green-600 dark:text-green-400 font-bold tracking-widest uppercase">Líder Vecinal</p>
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

      {/* CONTENIDO PRINCIPAL (Ocupa el espacio disponible) */}
      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 py-6">
        
        {/* AUDITORIA INFO */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-start mb-6 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
                <h3 className="text-amber-600 dark:text-amber-500 font-bold text-sm">Atención: Auditoría Comunitaria</h3>
                <p className="text-slate-700 dark:text-slate-300 text-xs mt-1">
                    Para mantener la confianza, tu perfil puede ser auditado por la comunidad. Los perfiles con <span className="text-slate-900 dark:text-white font-black underline">5 reportes por irregularidades</span> serán bloqueados de la red. ¡Mantén tus despachos al día!
                </p>
            </div>
        </div>

        {/* MAPA TAB */}
        {activeTab === 'mapa' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider">
                <MapIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" /> Radar de Zona
              </h2>
              <div className="flex gap-2">
                  <select 
                      value={filtroZona} 
                      onChange={e => setFiltroZona(e.target.value)}
                      className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 shadow-sm"
                  >
                      {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <button onClick={() => setLowDataMode(!lowDataMode)} className={`text-[10px] px-2 py-1.5 rounded-lg font-bold uppercase ${lowDataMode ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                  {lowDataMode ? 'Datos Lentos ACTIVO' : 'Datos Lentos'}
                  </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative flex-1 min-h-[60vh]">
                {!lowDataMode ? <RadarMap filtroZona={filtroZona} /> : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <Activity className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
                        <h3 className="text-white font-black uppercase tracking-widest mb-2">Modo Datos Lentos</h3>
                        <p className="text-slate-400 text-sm">El mapa está desactivado para ahorrar batería y ancho de banda. Utiliza el directorio para ubicar centros.</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* FEED SOS TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-500/30 shadow-2xl p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" /> Emergencias Activas
                </h2>
                <button 
                  onClick={() => setShowSOSForm(!showSOSForm)}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                >
                  {showSOSForm ? 'Cancelar' : 'Emitir SOS'}
                </button>
              </div>

              {showSOSForm && (
                <div className="mb-8 p-5 bg-red-950/40 border border-red-500/30 rounded-xl space-y-4">
                  <SOSChecklistForm value={sosData} onChange={setSosData} />
                  <button
                    onClick={handleCreateSOS}
                    className="w-full bg-red-600 hover:bg-red-500 text-white p-3 rounded-lg font-black uppercase tracking-widest text-xs transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  >
                    Publicar Emergencia (Emitir SOS)
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sosList.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-800 border-dashed rounded-xl">
                    No hay emergencias reportadas en {filtroZona}
                  </div>
                ) : (
                  sosList.map(sos => {
                    const coords = getCoordinates(sos.zona || (sos.usuarios && sos.usuarios.zona_operacion));
                    return (
                      <div key={sos.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-red-500/50 transition-colors shadow-md flex flex-col justify-between">
                        <div>
                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg">
                            {sos.estado}
                          </div>
                          
                          {sos.solicitante_id !== user?.id && (
                            <button 
                              onClick={() => handleReport(sos.solicitante_id)}
                              className="absolute bottom-4 right-4 bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500/20 transition-all z-10"
                              title="Reportar"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
    
                          <div className="flex gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 shrink-0 overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                              {(sos.emisor_foto || sos.usuarios?.foto_rostro_url) ? (
                                <img src={sos.emisor_foto || sos.usuarios?.foto_rostro_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><Activity className="w-5 h-5"/></div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{sos.emisor_nombre || sos.usuarios?.nombre || 'Usuario'}</h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                                {(sos.emisor_rol || sos.usuarios?.rol || 'Usuario').toUpperCase().replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-xs text-red-600 dark:text-red-400 font-black tracking-widest mb-1 uppercase">Se necesita:</p>
                            <p className="text-slate-900 dark:text-white font-bold text-lg">{sos.insumo_solicitado} <span className="text-slate-500 dark:text-slate-400 text-sm">x{sos.cantidad_solicitada}</span></p>
                          </div>
    
                          <SOSDescriptionDisplay descripcion={sos.descripcion || ''} />
                        </div>
    
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleShareSos(sos)}
                              className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold py-2 rounded-lg transition-all flex justify-center items-center gap-2 active:scale-95 text-xs uppercase tracking-wider"
                            >
                              <Share2 className="w-4 h-4" /> Compartir
                            </button>
                            {coords && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                                target="_blank" rel="noreferrer"
                                className="flex-1 bg-blue-100 dark:bg-blue-600/20 hover:bg-blue-200 dark:hover:bg-blue-600/40 text-blue-700 dark:text-blue-500 border border-blue-300 dark:border-blue-500/30 text-center py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Ver ubicación en el mapa"
                              >
                                <MapPin className="w-4 h-4" /> Mapa
                              </a>
                            )}
                          </div>
    
                          {sos.solicitante_id === user?.id && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditSosClick(sos)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 font-bold py-2 rounded-lg transition-all flex justify-center items-center gap-1.5 active:scale-95 text-xs uppercase tracking-wider"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={() => handleResolveSos(sos.id)}
                                className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold py-2 rounded-lg transition-all flex justify-center items-center gap-1.5 active:scale-95 text-xs uppercase tracking-wider"
                                title="Resolver Alerta"
                              >
                                <Check className="w-3.5 h-3.5" /> Resolver
                              </button>
                              <button
                                onClick={() => handleDeleteSos(sos.id)}
                                className="bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 p-2 rounded-lg transition-all flex justify-center items-center active:scale-95"
                                title="Eliminar permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* CENSO DE PERSONAS TAB */}
        {activeTab === 'personas' && (
          <CensoPersonasPanel />
        )}

        {/* DIRECTORIO */}
        {activeTab === 'directorio' && (
          <div className="space-y-6">
             <DirectorioPanel />
          </div>
        )}

        {/* VOLUNTARIOS TAB (QR) */}
        {activeTab === 'voluntarios' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-blue-500/30 shadow-2xl p-6">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                    <ScanLine className="w-6 h-6 text-blue-400" /> Validar Voluntario
                </h2>
                
                <div className="max-w-md mx-auto text-center">
                    <p className="text-sm text-slate-400 mb-6">Escanea el código QR de un ciudadano para validar su identidad y asignarlo a tareas logísticas en tu comunidad.</p>
                    
                    {showScanner ? (
                        <div className="mb-6 rounded-xl overflow-hidden border-2 border-blue-500">
                            <QRScanner onScan={handleScanQR} onClose={() => setShowScanner(false)} />
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowScanner(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 mx-auto w-full mb-6"
                        >
                            <ScanLine className="w-6 h-6" /> Abrir Escáner QR
                        </button>
                    )}

                    <div className="border-t border-slate-700 pt-6 mt-6">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">O ingresa el ID manualmente</p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={qrToken}
                                onChange={e => setQrToken(e.target.value)}
                                placeholder="ID del Voluntario"
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            />
                            <button 
                                onClick={() => handleScanQR(qrToken)}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg font-bold"
                            >
                                Validar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* ANUNCIOS TAB */}
        {activeTab === 'anuncios' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                <Radio className="w-6 h-6 text-purple-400" /> Mis Avisos Comunitarios
              </h2>
              
              <form onSubmit={publishAnuncio} className="mb-8">
                <textarea 
                    value={anuncioText}
                    onChange={e => setAnuncioText(e.target.value)}
                    placeholder="Escribe un aviso público (Punto de encuentro, censo, organización...)"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white placeholder:text-slate-500 resize-none h-32 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                />
                <div className="flex justify-end mt-3">
                    <button type="submit" disabled={!anuncioText.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-black uppercase tracking-widest shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                        Publicar
                    </button>
                </div>
              </form>

              <div className="space-y-4">
                {anuncios.filter(a => a.emisor_id === user?.id).length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-800 border-dashed rounded-xl">
                    No has publicado avisos.
                  </div>
                ) : (
                  anuncios.filter(a => a.emisor_id === user?.id).map(a => (
                    <div key={a.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(a.fecha).toLocaleString()}</p>
                        </div>
                        <button onClick={() => deleteAnuncio(a.id)} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase">Borrar</button>
                      </div>
                      <p className="text-sm font-bold text-slate-200 leading-relaxed whitespace-pre-wrap">{a.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="h-[75vh]">
            <ChatBox roomId="global_chat" roomTitle="Chat Público y Avisos" />
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 pb-safe z-[999] shadow-md">
          <div className="flex overflow-x-auto hide-scrollbar items-center justify-center sm:justify-around gap-2 sm:gap-0 h-16 w-full max-w-3xl mx-auto px-2">
             {TABS.map(tab => {
                 const isActive = activeTab === tab.id
                 return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full min-w-[70px] h-full space-y-1 transition-all ${
                            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                     >
                        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                            {tab.icon}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                            {tab.label}
                        </span>
                     </button>
                 )
             })}
          </div>
      </div>

      {/* EDIT SOS MODAL */}
      {editingSos && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" /> Editar Alerta SOS
              </h3>
              <p className="text-xs text-slate-500">Actualiza las necesidades o detalles del auxilio.</p>
            </div>
            
            <form onSubmit={handleUpdateSos} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Insumo / Producto</label>
                <input 
                  type="text" 
                  required
                  value={editInsumo}
                  onChange={e => setEditInsumo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Cantidad Necesitada</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={editCantidad}
                  onChange={e => setEditCantidad(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Detalles del Suceso</label>
                <textarea 
                  required
                  value={editDetalles}
                  onChange={e => setEditDetalles(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold h-24 resize-none outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingSos(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

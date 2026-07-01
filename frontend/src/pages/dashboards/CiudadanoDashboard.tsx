import { useTabNavigation } from '../../hooks/useTabNavigation'
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { MapPin, Activity, Map as MapIcon, Search, AlertTriangle, Radio, Sun, Moon, Battery, MessageSquare, ShieldAlert, Home, UserSearch, Share2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { ChatBox } from '../../components/ChatBox'
import { RadarMap } from '../../components/RadarMap'
import { SOSDescriptionDisplay } from '../../components/SOSDescriptionDisplay'
import { DirectorioPanel } from '../../components/DirectorioPanel'
import { BuscadorPersonas } from '../../components/BuscadorPersonas'

export const CiudadanoDashboard = ({ onNavigateToLogin, onBackToLanding }: { onNavigateToLogin?: () => void, onBackToLanding?: () => void }) => {
  const [activeTab, setActiveTab] = useTabNavigation('inicio')
  
  const [sosList, setSosList] = useState<any[]>([])
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

  const handleShareSos = (sos: any) => {
    const emisorNombre = sos.emisor_nombre || sos.usuarios?.nombre || 'Usuario';
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
    const text = `🚨 *ALERTA SOS - UNIDOS* 🚨\n\n📍 *Zona:* ${zonaName}\n👤 *Emisor:* ${emisorNombre}\n⚠️ *Se necesita:* ${sos.insumo_solicitado} x${sos.cantidad_solicitada}\n📝 *Detalles:* ${detallesStr || 'Sin detalles'}\n\n🔗 *Únete a la red y apoya en:* https://unidos.com.ve/`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('¡Mensaje de ayuda copiado al portapapeles! Compártelo por WhatsApp u otras redes.');
    } else {
      alert('Copia el siguiente texto:\n\n' + text);
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

  useEffect(() => {
    fetchSos()
  }, [filtroZona])

  const ZONAS = [
    'Nacional', 'Caracas', 'Distrito Capital', 'Miranda', 'Zulia', 'Carabobo', 'Lara', 'Aragua', 
    'Anzoátegui', 'Bolívar', 'Táchira', 'Mérida', 'Falcón', 'Sucre', 'Monagas', 'Barinas', 'Apure', 'Guárico', 'Cojedes', 'Portuguesa', 'Yaracuy', 'Nueva Esparta', 'Vargas'
  ]

  const TABS = [
    { id: 'inicio', icon: <Home className="w-5 h-5" />, label: 'Inicio' },
    { id: 'mapa', icon: <MapIcon className="w-5 h-5" />, label: 'Radar' },
    { id: 'feed', icon: <AlertTriangle className="w-5 h-5" />, label: 'SOS' },
    { id: 'buscar', icon: <UserSearch className="w-5 h-5" />, label: 'Personas' },
    { id: 'directorio', icon: <Search className="w-5 h-5" />, label: 'Directorio' },
    { id: 'chat', icon: <MessageSquare className="w-5 h-5" />, label: 'Chat' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans text-slate-900 dark:text-white transition-colors duration-300">
      {/* HEADER FIJO SUPERIOR */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-50 p-4 shadow-sm dark:shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 p-0.5 border border-blue-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
             <Activity className="w-5 h-5 text-blue-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter truncate max-w-[150px]">
              Ciudadano
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">Red Pública Unidos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Battery className="w-4 h-4 text-green-500" />}
          </button>
          {onBackToLanding && (
            <button 
              onClick={onBackToLanding}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
            >
              Volver
            </button>
          )}
          {onNavigateToLogin && (
            <button 
              onClick={onNavigateToLogin}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              Acceso Centros
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 py-6">
        
        {/* INICIO TAB (ONBOARDING) */}
        {activeTab === 'inicio' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <h2 className="text-3xl font-black uppercase tracking-widest mb-4 relative z-10 text-shadow-glow">Bienvenido a Unidos</h2>
                <p className="text-blue-100 font-bold mb-6 max-w-2xl relative z-10 text-sm md:text-base">
                  La plataforma logística comunitaria de Venezuela. Aquí puedes monitorear emergencias en tiempo real, buscar personas desaparecidas o trasladadas, y ver el directorio de centros clínicos y refugios.
                </p>
                <div className="flex flex-wrap gap-3 relative z-10">
                   <button onClick={() => setActiveTab('mapa')} className="bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all">Ver Radar</button>
                   <button onClick={() => setActiveTab('buscar')} className="bg-blue-500/50 hover:bg-blue-500/70 backdrop-blur border border-blue-400/50 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all">Buscar Persona</button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                   <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-4">
                      <AlertTriangle className="w-6 h-6" />
                   </div>
                   <h3 className="font-black text-lg mb-2 uppercase tracking-wide text-slate-900 dark:text-white">Sección SOS</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Monitor de emergencias en tiempo real. Ve quién necesita ayuda, medicinas o traslados en tu zona.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                   <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                      <UserSearch className="w-6 h-6" />
                   </div>
                   <h3 className="font-black text-lg mb-2 uppercase tracking-wide text-slate-900 dark:text-white">Buscador Público</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Encuentra a familiares o amigos ingresando su nombre o cédula. Los centros actualizan el estado de cada persona.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                   <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
                      <Search className="w-6 h-6" />
                   </div>
                   <h3 className="font-black text-lg mb-2 uppercase tracking-wide text-slate-900 dark:text-white">Directorio</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Listado de clínicas, refugios y centros de acopio, incluyendo sus horarios y necesidades de inventario.</p>
                </div>
             </div>
          </div>
        )}

        {/* BUSCADOR DE PERSONAS */}
        {activeTab === 'buscar' && (
          <BuscadorPersonas />
        )}

        {/* MAPA TAB */}
        {activeTab === 'mapa' && (
          <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider">
                <MapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Radar de Zona
              </h2>
              <div className="flex gap-2">
                  <select 
                      value={filtroZona} 
                      onChange={e => setFiltroZona(e.target.value)}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:border-blue-500 shadow-sm"
                  >
                      {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <button onClick={() => setLowDataMode(!lowDataMode)} className={`text-[10px] px-2 py-1.5 rounded-lg font-bold uppercase ${lowDataMode ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'}`}>
                  {lowDataMode ? 'Datos Lentos ACTIVO' : 'Datos Lentos'}
                  </button>
              </div>
            </div>
            
            <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-white/10 shadow-xl overflow-hidden relative flex-1 min-h-[60vh]">
                {!lowDataMode ? <RadarMap filtroZona={filtroZona} /> : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <Activity className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
                        <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-widest mb-2">Modo Datos Lentos</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">El mapa está desactivado para ahorrar batería y ancho de banda. Utiliza el directorio para ubicar centros.</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* FEED SOS TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-500/30 shadow-2xl p-6 relative">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" /> Emergencias Activas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sosList.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-300 dark:border-slate-800 border-dashed rounded-xl">
                    No hay emergencias reportadas en {filtroZona}
                  </div>
                ) : (
                  sosList.map(sos => {
                    const coords = getCoordinates(sos.zona || (sos.usuarios && sos.usuarios.zona_operacion));
                    return (
                      <div key={sos.id} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-red-500/50 transition-colors shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg">
                            {sos.estado}
                          </div>
                          
                          <div className="flex gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 overflow-hidden border-2 border-slate-300 dark:border-slate-600">
                              {(sos.emisor_foto || sos.usuarios?.foto_rostro_url) ? (
                                <img src={sos.emisor_foto || sos.usuarios?.foto_rostro_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><Activity className="w-5 h-5"/></div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{sos.emisor_nombre || sos.usuarios?.nombre || 'Usuario'}</h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                                {(sos.emisor_rol || sos.usuarios?.rol || 'ciudadano').toUpperCase().replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-xs text-red-600 dark:text-red-400 font-black tracking-widest mb-1 uppercase">Se necesita:</p>
                            <p className="text-slate-900 dark:text-white font-bold text-lg">{sos.insumo_solicitado} <span className="text-slate-500 dark:text-slate-400 text-sm">x{sos.cantidad_solicitada}</span></p>
                          </div>
    
                          <SOSDescriptionDisplay descripcion={sos.descripcion || ''} />
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                           <a 
                             href={`https://wa.me/?text=SOS+en+${sos.emisor_nombre || sos.usuarios?.nombre || 'Usuario'}+%28${filtroZona}%29.+Necesitan+${sos.cantidad_solicitada}+${sos.insumo_solicitado}.+Ingresa+a+Unidos+para+ayudar.`}
                             target="_blank" rel="noreferrer"
                             className="flex-1 bg-green-100 dark:bg-green-600/20 hover:bg-green-200 dark:hover:bg-green-600/40 text-green-700 dark:text-green-500 border border-green-300 dark:border-green-500/30 text-center py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 min-w-[70px]"
                           >
                             WhatsApp
                           </a>
                           {coords && (
                             <a 
                               href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                               target="_blank" rel="noreferrer"
                               className="flex-1 bg-blue-100 dark:bg-blue-600/20 hover:bg-blue-200 dark:hover:bg-blue-600/40 text-blue-700 dark:text-blue-500 border border-blue-300 dark:border-blue-500/30 text-center py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 min-w-[70px] cursor-pointer"
                               title="Ver ubicación en el mapa"
                             >
                               <MapPin className="w-3.5 h-3.5" /> Mapa
                             </a>
                           )}
                           <button 
                             onClick={() => handleShareSos(sos)}
                             className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-750 text-center py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 min-w-[70px]"
                           >
                             <Share2 className="w-3.5 h-3.5" /> Copiar Info
                           </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* DIRECTORIO */}
        {activeTab === 'directorio' && (
          <div className="space-y-6">
             <DirectorioPanel />
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="h-[75vh] animate-in fade-in zoom-in-95 duration-300">
            <ChatBox roomId="global_chat" roomTitle="Chat Público y Avisos" />
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION BAR (PREMIUM) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 pb-safe z-[999] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex overflow-x-auto hide-scrollbar items-center justify-between sm:justify-around gap-1 sm:gap-0 h-[72px] w-full max-w-lg mx-auto px-4">
             {TABS.map(tab => {
                 const isActive = activeTab === tab.id
                 return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex flex-col items-center justify-center w-[60px] sm:w-[70px] h-full space-y-1 transition-all duration-300 ${
                            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                     >
                        {isActive && (
                          <div className="absolute top-0 w-8 h-1 bg-blue-600 dark:bg-blue-500 rounded-b-full shadow-[0_2px_10px_rgba(37,99,235,0.5)]"></div>
                        )}
                        <div className={`transition-all duration-300 ${isActive ? '-translate-y-1 scale-110 drop-shadow-md' : 'translate-y-0 scale-100'}`}>
                            {tab.icon}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'}`}>
                            {tab.label}
                        </span>
                     </button>
                 )
             })}
          </div>
      </div>
    </div>
  )
}

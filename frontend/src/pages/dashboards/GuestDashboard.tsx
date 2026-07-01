import { useTabNavigation } from '../../hooks/useTabNavigation'
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { MapPin, Activity, Map as MapIcon, Search, AlertTriangle, Radio, Sun, Moon, Battery, MessageSquare, ShieldAlert } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { ChatBox } from '../../components/ChatBox'
import { RadarMap } from '../../components/RadarMap'
import { SOSDescriptionDisplay } from '../../components/SOSDescriptionDisplay'
import { DirectorioPanel } from '../../components/DirectorioPanel'

export const GuestDashboard = ({ onNavigateToLogin }: { onNavigateToLogin: () => void }) => {
  const [activeTab, setActiveTab] = useTabNavigation('mapa')
  
  const [sosList, setSosList] = useState<any[]>([])
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [filtroZona, setFiltroZona] = useState('Nacional')
  
  const { theme, toggleTheme } = useTheme()
  const [lowDataMode, setLowDataMode] = useState(false)

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
    { id: 'directorio', icon: <Search className="w-5 h-5" />, label: 'Directorio' },
    { id: 'anuncios', icon: <Radio className="w-5 h-5" />, label: 'Noticias' },
    { id: 'chat', icon: <MessageSquare className="w-5 h-5" />, label: 'Chat' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 pb-24">
      {/* HEADER FIJO SUPERIOR */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 p-0.5 border border-slate-700 overflow-hidden flex items-center justify-center">
             <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter truncate max-w-[150px]">
              Invitado
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Modo Observador</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors">
            {theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Battery className="w-4 h-4 text-green-500" />}
          </button>
          <button 
            onClick={() => onNavigateToLogin()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            Acceder
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 py-6">
        
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4 flex gap-3 items-start mb-6">
           <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
           <div>
              <h3 className="text-blue-500 font-bold text-sm">Estás en Modo Observador</h3>
              <p className="text-slate-300 text-xs mt-1">
                Puedes ver el Radar de Emergencias, el Directorio Público y los Anuncios Comunitarios. Inicia sesión para interactuar, emitir SOS o administrar inventarios.
              </p>
           </div>
        </div>

        {/* MAPA TAB */}
        {activeTab === 'mapa' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                <MapIcon className="w-6 h-6 text-blue-400" /> Radar de Zona
              </h2>
              <div className="flex gap-2">
                  <select 
                      value={filtroZona} 
                      onChange={e => setFiltroZona(e.target.value)}
                      className="bg-slate-800 text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500"
                  >
                      {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <button onClick={() => setLowDataMode(!lowDataMode)} className={`text-[10px] px-2 py-1.5 rounded-lg font-bold uppercase ${lowDataMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {lowDataMode ? 'Datos Lentos ACTIVO' : 'Datos Lentos'}
                  </button>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-xl overflow-hidden relative flex-1 min-h-[60vh]">
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
            <div className="bg-slate-900 rounded-2xl border border-red-500/30 shadow-2xl p-6 relative">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                  <AlertTriangle className="w-6 h-6 text-red-500" /> Emergencias Activas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sosList.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-800 border-dashed rounded-xl">
                    No hay emergencias reportadas en {filtroZona}
                  </div>
                ) : (
                  sosList.map(sos => (
                    <div key={sos.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative overflow-hidden group hover:border-red-500/50 transition-colors">
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg">
                        {sos.estado}
                      </div>
                      
                      <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0 overflow-hidden border-2 border-slate-600">
                          {sos.emisor_foto ? <img src={sos.emisor_foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Activity className="w-5 h-5"/></div>}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{sos.emisor_nombre}</h3>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider">{sos.emisor_rol.toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-red-400 font-black tracking-widest mb-1 uppercase">Se necesita:</p>
                        <p className="text-white font-bold text-lg">{sos.insumo_solicitado} <span className="text-slate-400 text-sm">x{sos.cantidad_solicitada}</span></p>
                      </div>

                      <SOSDescriptionDisplay descripcion={sos.descripcion || ''} />
                      
                      <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
                         <a 
                           href={`https://wa.me/?text=SOS+en+${sos.emisor_nombre}+%28${filtroZona}%29.+Necesitan+${sos.cantidad_solicitada}+${sos.insumo_solicitado}.+Ingresa+a+ViendoRed+para+ayudar.`}
                           target="_blank" rel="noreferrer"
                           className="flex-1 bg-green-600/20 hover:bg-green-600/40 text-green-500 border border-green-500/30 text-center py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
                         >
                           Compartir WA
                         </a>
                         <button onClick={() => onNavigateToLogin()} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">
                           Ayudar
                         </button>
                      </div>
                    </div>
                  ))
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

        {/* ANUNCIOS TAB */}
        {activeTab === 'anuncios' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                <Radio className="w-6 h-6 text-purple-400" /> Noticias de {filtroZona}
              </h2>
              
              <div className="space-y-4">
                {anuncios.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-800 border-dashed rounded-xl">
                    No hay noticias públicas publicadas.
                  </div>
                ) : (
                  anuncios.map(a => (
                    <div key={a.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(a.fecha).toLocaleString()}</p>
                        </div>
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
      <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 pb-safe z-[999]">
          <div className="flex overflow-x-auto hide-scrollbar items-center justify-center sm:justify-around gap-2 sm:gap-0 h-16 w-full max-w-3xl mx-auto px-2">
             {TABS.map(tab => {
                 const isActive = activeTab === tab.id
                 return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full min-w-[70px] h-full space-y-1 transition-all ${
                            isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
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
    </div>
  )
}

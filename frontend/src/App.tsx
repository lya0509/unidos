import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard'
import { BackgroundMesh } from './components/BackgroundMesh'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { WhatsNewCarousel } from './components/WhatsNewCarousel'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { CiudadanoDashboard } from './pages/dashboards/CiudadanoDashboard'
import { LiderDashboard } from './pages/dashboards/LiderDashboard'
import { CentroDashboard } from './pages/dashboards/CentroDashboard'
import { IniciativaDashboard } from './pages/dashboards/IniciativaDashboard'
import { CommandDashboard } from './pages/dashboards/CommandDashboard'
import { HeartHandshake, Loader2, BarChart3 } from 'lucide-react'

// Email del administrador supremo
const ADMIN_EMAIL = 'laya.juanluis@gmail.com'

function Dashboard() {
  const { user } = useAuth()
  const [page, setPage] = useState<'home' | 'stats'>('home')

  const renderDashboard = () => {
    // Acceso de superadmin por rol especial O por email
    if (user?.rol === 'juan' || user?.email === ADMIN_EMAIL) {
      return <SuperAdminDashboard />
    }
    switch (user?.rol) {
      case 'ciudadano':
      case 'voluntario':
        return <CiudadanoDashboard />
      case 'lider_vecinal':
        return <LiderDashboard />
      case 'iniciativa_ciudadana':
      case 'iniciativa_ciudadíana':
        return <IniciativaDashboard />
      case 'centro_acopio':
      case 'medico':
      case 'clinica':
      case 'comunidad':
      case 'refugio':
        return <CentroDashboard />
      default:
        return <div className="p-10 text-center font-bold">Rol no reconocido: {user?.rol}</div>
    }
  }

  return (
    <div className="min-h-screen relative font-sans selection:bg-blue-500/30 overflow-x-hidden w-full max-w-[100vw]">
      <WhatsNewCarousel />
      {/* Barra tricolor venezolana */}
      <div className="h-1.5 w-full fixed top-0 left-0 z-[100] flex">
        <div className="w-1/3 bg-[#FCE300]"></div>
        <div className="w-1/3 bg-[#0038A8]"></div>
        <div className="w-1/3 bg-[#CE1126]"></div>
      </div>
      <GlobalSosAlert />

      {/* Contenido principal */}
      <main className="w-full relative z-10">
        {page === 'stats' ? <CommandDashboard /> : renderDashboard()}
      </main>

      {/* FAB para Command Center */}
      <div className="fixed top-24 right-4 z-[9999]">
         <button
            onClick={() => setPage(page === 'stats' ? 'home' : 'stats')}
            className={`p-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all active:scale-90 border backdrop-blur-md ${
              page === 'stats'
                ? 'bg-blue-600/90 text-white border-blue-500'
                : 'bg-slate-900/80 text-blue-400 border-slate-700 hover:bg-slate-800'
            }`}
            title="Centro de Comando"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
      </div>
    </div>
  )
}

import { SocketProvider, useSocket } from './context/SocketContext'
import { useRef } from 'react'
import { LandingPage } from './pages/LandingPage'

function GlobalSosAlert() {
  const { newSosEvent, clearNewSosEvent } = useSocket();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const onStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    startPos.current = { x: clientX, y: clientY };
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    setOffset({ x: deltaX, y: deltaY });
  };

  const onEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (Math.abs(offset.x) > 100 || Math.abs(offset.y) > 100) {
      setIsExiting(true);
      setTimeout(() => {
        clearNewSosEvent();
        setOffset({ x: 0, y: 0 });
        setIsExiting(false);
      }, 200);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  };

  if (!newSosEvent) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 z-[100] w-[90%] max-w-sm touch-none select-none transition-transform ${isExiting ? 'opacity-0 scale-95 duration-200' : ''}`}
      style={{
        transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.2s ease-out, opacity 0.2s, scale 0.2s'
      }}
      onTouchStart={(e) => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={onEnd}
      onMouseDown={(e) => onStart(e.clientX, e.clientY)}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
    >
      <div className="bg-red-600/90 backdrop-blur-md border border-red-500 p-4 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-start gap-4 text-white animate-in fade-in slide-in-from-top-10 cursor-grab active:cursor-grabbing">
        <div className="bg-white/20 p-2 rounded-lg pointer-events-none">
          <HeartHandshake className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 pointer-events-none">
          <h3 className="font-black uppercase tracking-widest text-sm mb-1">¡Nuevo SOS Detectado!</h3>
          <p className="text-xs font-bold text-red-100 uppercase mb-2">Zona: {newSosEvent.zona?.split('||')[0]}</p>
          <p className="text-sm font-medium leading-tight">{newSosEvent.descripcion}</p>
          <p className="text-[10px] text-white/50 font-bold uppercase mt-3 flex gap-2 items-center">
            ←  Desliza para descartar  →
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AppWrapper() {
  const [screen, setScreen] = useState<'landing' | 'guest' | 'login' | 'register'>('landing')

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BackgroundMesh />
          <AppContent screen={screen} setScreen={setScreen} />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

function AppContent({ screen, setScreen }: { screen: 'landing' | 'guest' | 'login' | 'register', setScreen: (s: 'landing' | 'guest' | 'login' | 'register') => void }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!token) {
    if (screen === 'landing') {
      return <LandingPage onEnterAsCitizen={() => setScreen('guest')} onEnterAsAcopio={() => setScreen('login')} />
    }
    if (screen === 'guest') {
      return <CiudadanoDashboard onNavigateToLogin={() => setScreen('login')} onBackToLanding={() => setScreen('landing')} />
    }
    return screen === 'login'
      ? <Login onNavigateToRegister={() => setScreen('register')} onNavigateToGuest={() => setScreen('landing')} />
      : <Register onNavigateToLogin={() => setScreen('login')} onNavigateToGuest={() => setScreen('landing')} />
  }

  return <Dashboard />
}

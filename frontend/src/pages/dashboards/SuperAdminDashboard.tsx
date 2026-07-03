import React, { useState } from 'react';
import { CiudadanoDashboard } from './CiudadanoDashboard';
import { CentroDashboard } from './CentroDashboard';
import { IniciativaDashboard } from './IniciativaDashboard';
import { LiderDashboard } from './LiderDashboard';
import { CommandDashboard } from './CommandDashboard';
import { IdentityAuditPanel } from './IdentityAuditPanel';
import { PostModerationPanel } from '../../components/PostModerationPanel';
import { UserManagementPanel } from '../../components/UserManagementPanel';
import { FallasManagementPanel } from '../../components/FallasManagementPanel';
import { ConvocatoriasAdminPanel } from '../../components/ConvocatoriasAdminPanel';
import { RadarMap } from '../../components/RadarMap';
import { AuthContext, useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const originalAuth = useAuth();
  const [mockRol, setMockRol] = useState('comando'); // Default view

  const ADMIN_EMAIL = 'juanluislaya@gmail.com';

  if (!originalAuth.user || (originalAuth.user.rol !== 'juan' && originalAuth.user.email !== ADMIN_EMAIL)) {
     return <div className="p-10 text-center font-bold text-red-500">ACCESO DENEGADO</div>;
  }

  // Create a proxy auth context where everything is the same EXCEPT the role
  const mockContextValue = {
    ...originalAuth,
    user: {
       ...originalAuth.user,
       rol: mockRol
    }
  };

  const renderMockDashboard = () => {
    switch (mockRol) {
       case 'ciudadano': return <CiudadanoDashboard />;
       case 'centro_acopio': return <CentroDashboard />;
       case 'iniciativa_ciudadana': return <IniciativaDashboard />;
       case 'lider_vecinal': return <LiderDashboard />;
       case 'comando': return <CommandDashboard />;
       case 'auditoria': return <IdentityAuditPanel />;
       case 'moderacion': return <PostModerationPanel />;
       case 'usuarios_db': return <UserManagementPanel />;
       case 'fallas_db': return <FallasManagementPanel />;
       case 'convocatorias_db': return <ConvocatoriasAdminPanel />;
       case 'mapa_radar': return (
         <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
           <div>
             <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">🗺️ Mapa de Radar Comunitario</h2>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monitoreo general en tiempo real de alertas SOS y Centros de Apoyo.</p>
           </div>
           <RadarMap filtroZona="Nacional" />
         </div>
       );
       default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Super Admin Control Panel */}
      <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border-2 border-red-500/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
            <ShieldAlert className="text-red-500 w-6 h-6" /> PANEL SUPREMO (JUAN)
          </h2>
          <button 
             onClick={() => originalAuth.logout()}
             className="bg-red-600/20 text-red-400 hover:bg-red-600/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold uppercase transition-colors"
          >
             <LogOut className="w-4 h-4" /> Salir de Juan
          </button>
        </div>
        
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-2">Simular Vista / Dashboard:</p>
        <div className="flex flex-wrap gap-2 relative z-10">
          {[
             { id: 'comando', label: 'Comando Central' },
             { id: 'centro_acopio', label: 'Clínica / Centro' },
             { id: 'lider_vecinal', label: 'Líder Vecinal' },
             { id: 'iniciativa_ciudadana', label: 'Iniciativa' },
             { id: 'ciudadano', label: 'Ciudadano' },
             { id: 'auditoria', label: 'Auditoría de Identidades' },
             { id: 'moderacion', label: 'Moderación de Muro' },
             { id: 'usuarios_db', label: '👥 Gestión de Usuarios (Real)' },
             { id: 'fallas_db', label: '🛠️ Reportes de Fallas' },
             { id: 'convocatorias_db', label: '📋 Convocatorias' },
             { id: 'mapa_radar', label: '🗺️ Mapa de Radar' }
          ].map(r => (
            <button 
               key={r.id}
               onClick={() => setMockRol(r.id)}
               className={`px-3 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 ${mockRol === r.id ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render the Dashboard wrapped in the mocked AuthContext */}
      <AuthContext.Provider value={mockContextValue}>
        <div className="border-4 border-slate-800 rounded-3xl p-1 relative bg-slate-50 dark:bg-slate-950/50 shadow-inner">
           {renderMockDashboard()}
        </div>
      </AuthContext.Provider>
    </div>
  );
}

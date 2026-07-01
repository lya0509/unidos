import React, { useState } from 'react';
import { CiudadanoDashboard } from './CiudadanoDashboard';
import { CentroDashboard } from './CentroDashboard';
import { IniciativaDashboard } from './IniciativaDashboard';
import { LiderDashboard } from './LiderDashboard';
import { CommandDashboard } from './CommandDashboard';
import { IdentityAuditPanel } from './IdentityAuditPanel';
import { PostModerationPanel } from '../../components/PostModerationPanel';
import { AuthContext, useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const originalAuth = useAuth();
  const [mockRol, setMockRol] = useState('comando'); // Default view

  if (!originalAuth.user || originalAuth.user.rol !== 'juan') {
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
             { id: 'moderacion', label: 'Moderación de Muro' }
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

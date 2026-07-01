import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface IdentityBadgeProps {
  user: {
    nombre?: string;
    verificado?: boolean;
    foto_cedula_url?: string;
    foto_rostro_url?: string;
  }
}

export const IdentityBadge: React.FC<IdentityBadgeProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);

  const isVerificado = user?.verificado || (user?.foto_cedula_url && user?.foto_rostro_url);

  // Gesture back button support
  useEffect(() => {
    const handlePopState = () => {
      if (showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showModal]);

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
    window.history.pushState({ modíal: 'identity' }, '');
  };

  const closeModal = () => {
    setShowModal(false);
    if (window.history.state?.modíal === 'identity') {
      window.history.back();
    }
  };

  if (!isVerificado) {
    return null;
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1 bg-sky-100/80 hover:bg-sky-200 dark:bg-sky-900/40 dark:hover:bg-sky-800/60 text-sky-700 dark:text-sky-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest transition-all ml-2 align-middle border border-sky-400/50 dark:border-sky-500/50 shadow-sm shadow-sky-500/20 active:scale-95"
        title="Ver Identidíad"
      >
        <ShieldCheck className="w-3.5 h-3.5" /> Verificado
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100000] bg-slate-950 p-0 sm:p-4 flex flex-col items-center justify-center animate-in fade-in duration-200" onClick={closeModal}>
          <div 
            className="w-full h-[100dvh] sm:h-[90vh] sm:max-w-5xl relative sm:rounded-3xl bg-slate-50 dark:bg-slate-900 overflow-y-auto shadow-2xl border border-white/20 dark:border-slate-700/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* Glowing backdrop effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 blur-[60px] opacity-20 dark:opacity-40 sm:rounded-3xl pointer-events-none" />
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 flex-shrink-0 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-white/10 rotate-12 blur-sm pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner">
                    <ShieldCheck className="text-white w-8 h-8 drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider drop-shadow-md leading-tight">
                      Identidíad Verificadía
                    </h3>
                    <p className="text-emerald-100 text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-sm flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /> Sistema Anti-Fraude
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="relative z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User Info Bar */}
            <div className="bg-slate-200 dark:bg-slate-800/80 p-4 border-b border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 relative z-10">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest block mb-1">Nombre de Usuario / Correo</span>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase break-all leading-none">{user.nombre}</p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 w-fit">
                <ShieldCheck className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                <span className="text-[10px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">Credenciales Validíadías</span>
              </div>
            </div>

            {/* Images Grid */}
            <div className="p-4 sm:p-8 bg-white dark:bg-slate-900 flex-1 flex flex-col relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
                {user.foto_cedula_url && (
                  <div className="flex flex-col gap-2 h-full">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 flex-shrink-0">
                      <span className="w-1.5 h-4 bg-blue-500 rounded-full" /> Cédula de Identidíad
                    </span>
                    <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 shadow-inner group hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex-1 min-h-[300px] relative">
                      <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 animate-pulse -z-10" />
                      <img 
                        src={user.foto_cedula_url} 
                        alt="Cédula" 
                        className="w-full h-full object-contain rounded-xl" 
                      />
                    </div>
                  </div>
                )}
                {user.foto_rostro_url && (
                  <div className="flex flex-col gap-2 h-full">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 flex-shrink-0">
                      <span className="w-1.5 h-4 bg-emerald-500 rounded-full" /> Foto de Rostro
                    </span>
                    <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 shadow-inner group hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors flex-1 min-h-[300px] relative">
                      <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 animate-pulse -z-10" />
                      <img 
                        src={user.foto_rostro_url} 
                        alt="Rostro" 
                        className="w-full h-full object-cover rounded-xl" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-800 text-center flex-shrink-0 relative z-10">
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">
                La falsificación de identidíad serA sancionadía mediante el sistema de reportes comunitarios.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

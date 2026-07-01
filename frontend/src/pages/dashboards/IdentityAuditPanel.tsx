import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldAlert, Trash2, Ban, CheckCircle, RefreshCw } from 'lucide-react';

export function IdentityAuditPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/auditoria');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRechazar = async (userId: string) => {
    if (!confirm('¿Estás seguro de rechazar la identidad de este usuario? Perderá la insignia de verificado.')) return;
    try {
      await api.post(`/auth/usuarios/${userId}/rechazar-identidad`);
      alert('Identidad rechazada con éxito.');
      fetchUsers();
    } catch (err) {
      alert('Error al rechazar identidad.');
    }
  };

  const handleEliminar = async (userId: string) => {
    if (!confirm('AATENCIÓN! ¿Estás seguro de eliminar permanentemente a este usuario? Esta acción NO se puede deshacer.')) return;
    try {
      await api.delete(`/auth/usuarios/${userId}`);
      alert('Usuario eliminado permanentemente.');
      fetchUsers();
    } catch (err) {
      alert('Error al eliminar usuario.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-6 h-6" /> Auditoría de Identidades
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Control Supremo sobre verificaciones ({users.length})
          </p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-300 dark:border-slate-800 border-dashed rounded-xl">
          Cargando usuarios...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-300 dark:border-slate-800 border-dashed rounded-xl">
          No hay usuarios verificados o con documentos pendientes
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => (
            <div key={u.id} className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                    {u.nombre}
                    {u.verificado && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </h3>
                  <div className="text-xs font-bold text-slate-500 tracking-wider">
                    {u.email} • <span className="uppercase text-blue-500">{u.rol.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Documento</span>
                  <a href={u.foto_cedula_url} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <img src={u.foto_cedula_url} alt="Cédula" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold tracking-widest uppercase">Ver Completa</div>
                  </a>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rostro</span>
                  <a href={u.foto_rostro_url} target="_blank" rel="noreferrer" className="block relative group aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <img src={u.foto_rostro_url} alt="Rostro" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold tracking-widest uppercase">Ver Completa</div>
                  </a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => handleRechazar(u.id)}
                  className="flex-1 py-2 px-3 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Ban className="w-4 h-4" /> Rechazar 
                </button>
                <button 
                  onClick={() => handleEliminar(u.id)}
                  className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Bajar de una
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

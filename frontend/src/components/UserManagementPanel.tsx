import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Users, Search, ShieldCheck, ShieldAlert, Trash2, 
  UserX, UserCheck, Loader2, Mail, MapPin, Phone, RefreshCw 
} from 'lucide-react';

export const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/admin/usuarios');
      setUsers(res.data);
    } catch (err) {
      console.error("Error cargando usuarios para administración", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleEstado = async (id: string, currentActive: boolean) => {
    const actionText = currentActive ? "suspender" : "reactivar";
    if (!confirm(`¿Estás seguro de que deseas ${actionText} esta cuenta?`)) return;
    
    setActionLoadingId(id);
    try {
      await api.put(`/auth/usuarios/${id}/cambiar-estado?activo=${!currentActive}`);
      alert(`Usuario ${currentActive ? 'suspendido' : 'activado'} con éxito.`);
      fetchUsers();
    } catch (err) {
      console.error("Error al cambiar estado del usuario", err);
      alert("No se pudo cambiar el estado del usuario.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerifyManual = async (id: string) => {
    if (!confirm("¿Deseas verificar manualmente la identidad de este usuario sin requerir fotos de cédula?")) return;
    
    setActionLoadingId(id);
    try {
      await api.put(`/auth/usuarios/${id}/aprobar-identidad`);
      alert("Identidad verificado manualmente.");
      fetchUsers();
    } catch (err) {
      console.error("Error al verificar manual", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`🚨 ¡ATENCIÓN! ¿Deseas eliminar definitivamente la cuenta de "${name}"? Esta acción no se puede deshacer.`)) return;
    
    setActionLoadingId(id);
    try {
      await api.delete(`/auth/usuarios/${id}`);
      alert("Usuario eliminado correctamente.");
      fetchUsers();
    } catch (err) {
      console.error("Error eliminando usuario", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.zona_operacion && user.zona_operacion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const roleLabels: Record<string, string> = {
    centro_acopio: "📦 Centro de Acopio",
    lider_vecinal: "👤 Líder Vecinal",
    clinica: "🏥 Clínica/Hospital",
    comunidad: "🏘️ Comunidad",
    refugio: "⛺ Refugio/Campamento",
    iniciativa_ciudadana: "🤝 Iniciativa",
    ciudadano: " citizen Ciudadano"
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" /> Control y Gestión de Usuarios
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Banea, reactiva, verifica identidades o elimina cuentas comunitarias.
          </p>
        </div>
        
        <button 
          onClick={fetchUsers}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
        >
          <RefreshCw className="w-4 h-4" /> Recargar Lista
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search className="w-5 h-5" />
        </span>
        <input 
          type="text" 
          placeholder="Buscar por nombre, email o zona..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-sm outline-none focus:border-red-500 transition-colors"
        />
      </div>

      {/* LISTADO */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">
          No se encontraron usuarios comunitarios.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map(user => (
            <div 
              key={user.id} 
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                !user.activo 
                  ? 'border-red-500/30 bg-red-950/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Información del usuario */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">{user.nombre}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {roleLabels[user.rol] || user.rol}
                  </span>
                  
                  {user.verificado ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 uppercase">
                      <ShieldCheck className="w-3 h-3" /> Verificado
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 uppercase">
                      <ShieldAlert className="w-3 h-3" /> Sin Verificar
                    </span>
                  )}

                  {!user.activo && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-500 text-white flex items-center gap-1 uppercase">
                      Suspendido
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                  {user.zona_operacion && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.zona_operacion.split('||')[0]}</span>}
                  {user.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.telefono}</span>}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* Botón de suspender/reactivar */}
                <button
                  onClick={() => handleToggleEstado(user.id, user.activo)}
                  disabled={actionLoadingId === user.id}
                  className={`flex-1 md:flex-none px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                    user.activo
                      ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                >
                  {user.activo ? (
                    <>
                      <UserX className="w-4 h-4" /> Suspender
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Reactivar
                    </>
                  )}
                </button>

                {/* Botón de verificación manual */}
                {!user.verificado && (
                  <button
                    onClick={() => handleVerifyManual(user.id)}
                    disabled={actionLoadingId === user.id}
                    className="flex-1 md:flex-none px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-blue-500/10"
                  >
                    <ShieldCheck className="w-4 h-4" /> Verificar
                  </button>
                )}

                {/* Botón de eliminación */}
                <button
                  onClick={() => handleDeleteUser(user.id, user.nombre)}
                  disabled={actionLoadingId === user.id}
                  className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center"
                  title="Eliminar Cuenta Definitivamente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

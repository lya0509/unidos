import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Camera, Check, Trash2, Loader2, ShieldAlert, Flag, Info, Megaphone, CheckCircle, RefreshCw 
} from 'lucide-react';

export const PostModerationPanel: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'baneados' | 'activos'
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/publicaciones/admin/todas');
      setPosts(res.data);
    } catch (err) {
      console.error("Error cargando todas las publicaciones", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleUnban = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.put(`/publicaciones/${id}/desbanear`);
      alert("Publicación restablecida. Se limpiaron las banderitas.");
      fetchPosts();
    } catch (err) {
      console.error("Error al desbanear", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas eliminar definitivamente este reporte del muro y borrar su imagen de Supabase Storage?")) return;
    setActionLoadingId(id);
    try {
      await api.delete(`/publicaciones/${id}`);
      alert("Publicación eliminada con éxito.");
      fetchPosts();
    } catch (err) {
      console.error("Error al borrar", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filtroEstado === 'baneados') return post.baneado === true;
    if (filtroEstado === 'activos') return post.baneado === false && (!post.cantidad_reportes || post.cantidad_reportes === 0);
    if (filtroEstado === 'precaucion') return post.baneado === false && post.cantidad_reportes > 0 && post.cantidad_reportes < 25;
    return true;
  });

  const catLabels: Record<string, string> = {
    urgente: "🚨 Urgente",
    autoridades: "📢 Autoridades",
    donacion: "🎁 Donación",
    mal_estado: "🚧 Vías/Lugar",
    servicios: "💡 Servicios",
    solidaridad: "🤝 Solidaridad"
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Moderación Suprema de Muro
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Supervisa los reportes visuales con banderas del país.</p>
        </div>
        
        <button 
          onClick={fetchPosts}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
        >
          <RefreshCw className="w-4 h-4" /> Recargar
        </button>
      </div>

      {/* FILTROS DE ESTADO */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'todos', label: 'Ver Todas' },
          { id: 'activos', label: 'Activas (Sin Reportes)' },
          { id: 'precaucion', label: '⚠️ Precaución (1-24 Banderas)' },
          { id: 'baneados', label: '🚫 Baneadas (25 Banderas)' }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setFiltroEstado(opt.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
              filtroEstado === opt.id 
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/20' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* POSTS LISTING */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-black uppercase text-slate-800 dark:text-white tracking-wider mb-1">Muro de Moderación Limpio</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">No hay reportes bajo este filtro en el sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map(post => (
            <div 
              key={post.id} 
              className={`glass-panel rounded-2xl border p-5 flex flex-col justify-between gap-4 shadow-lg ${
                post.baneado 
                  ? 'border-red-500/40 bg-red-950/5' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Header card info */}
                <div className="flex justify-between items-start mb-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">{post.creador_nombre}</h4>
                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mt-1">
                      {catLabels[post.categoria] || post.categoria}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      post.baneado ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {post.baneado ? 'Baneada' : 'Activa'}
                    </span>
                    <span className="text-[10px] text-red-500 dark:text-red-400 font-bold flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5 fill-red-500/20" /> {post.cantidad_reportes} Banderitas
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mb-3 leading-relaxed break-words whitespace-pre-line">
                  {post.descripcion}
                </p>

                {/* Media file preview */}
                {post.media_url && (
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 relative z-0">
                    {post.media_url.endsWith('.mp4') || post.media_url.includes('video/') ? (
                      <video src={post.media_url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.media_url} alt="Media" className="w-full h-full object-cover" />
                    )}
                    <a 
                      href={post.media_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider border border-white/10"
                    >
                      Ampliar
                    </a>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                {post.baneado && (
                  <button 
                    onClick={() => handleUnban(post.id)}
                    disabled={actionLoadingId === post.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Desbanear
                  </button>
                )}
                
                <button 
                  onClick={() => handleDelete(post.id)}
                  disabled={actionLoadingId === post.id}
                  className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 font-black py-2 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

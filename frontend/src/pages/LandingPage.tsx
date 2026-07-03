import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { 
  Activity, MapPin, Users, Package, AlertTriangle, Radio, 
  Sun, Moon, Battery, Share2, Camera, Plus, Heart, Info, 
  Shield, MessageSquare, Loader2, Sparkles, Megaphone, Flag, Send, Download, AlertOctagon
} from 'lucide-react';

interface LandingPageProps {
  onEnterAsCitizen: () => void;
  onEnterAsAcopio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterAsCitizen, onEnterAsAcopio }) => {
  const { theme, toggleTheme } = useTheme();
  
  // Stats States
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Feed States
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  
  // Modal Creation States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newCedula, setNewCedula] = useState('');
  const [newCategoria, setNewCategoria] = useState('urgente');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reporte de fallas States
  const [showFallasModal, setShowFallasModal] = useState(false);
  const [fallaNombre, setFallaNombre] = useState('');
  const [fallaEmail, setFallaEmail] = useState('');
  const [fallaDescripcion, setFallaDescripcion] = useState('');
  const [fallaEnviando, setFallaEnviando] = useState(false);

  // Helper: tiempo relativo legible
  const formatTiempoRelativo = (fechaISO: string): string => {
    const ahora = Date.now();
    const fecha = new Date(fechaISO).getTime();
    const minutos = Math.floor((ahora - fecha) / 60000);
    if (minutos < 1) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/global');
      setStats(res.data);
    } catch (err) {
      console.error("Error cargando estadísticas", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFeed = async () => {
    setFeedLoading(true);
    try {
      const res = await api.get(`/publicaciones/feed?categoria=${filtroCategoria}`);
      setPublicaciones(res.data);
    } catch (err) {
      console.error("Error cargando feed", err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [filtroCategoria]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescripcion.trim()) return;
    if (!newFile) {
      alert('La imagen o video es obligatorio para publicar un reporte visual.');
      return;
    }
    if (!newCedula.trim()) {
      alert('La cédula o documento de identidad es obligatoria para publicar.');
      return;
    }
    
    setUploading(true);
    try {
      let mediaUrl = null;
      
      // 1. Subir archivo
      const formData = new FormData();
      formData.append('file', newFile);
      const uploadRes = await api.post('/upload/publicacion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mediaUrl = uploadRes.data.url;
      
      // 2. Crear publicación con cédula
      await api.post('/publicaciones', {
        creador_nombre: newNombre.trim() ? newNombre.trim() : "Vecino Anónimo",
        creador_rol: "publico",
        cedula: newCedula.trim(),
        categoria: newCategoria,
        descripcion: newDescripcion,
        media_url: mediaUrl
      });
      
      // Limpiar y cerrar
      setNewNombre('');
      setNewCedula('');
      setNewCategoria('urgente');
      setNewDescripcion('');
      setNewFile(null);
      setPreviewUrl(null);
      setShowCreateModal(false);
      fetchFeed();
      fetchStats();
    } catch (err) {
      alert("Error al publicar. Por favor, revisa el archivo o intenta de nuevo.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  const handleReportarFallaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallaDescripcion.trim()) return;
    
    setFallaEnviando(true);
    try {
      await api.post('/fallas', {
        nombre_usuario: fallaNombre.trim() ? fallaNombre.trim() : "Anónimo",
        email: fallaEmail.trim(),
        descripcion: fallaDescripcion.trim(),
        dispositivo: navigator.userAgent || "Navegador Web"
      });
      
      alert("¡Reporte de falla enviado con éxito! Los administradores del sistema lo revisarán pronto.");
      setFallaNombre('');
      setFallaEmail('');
      setFallaDescripcion('');
      setShowFallasModal(false);
    } catch (err) {
      alert("No se pudo enviar el reporte. Por favor, intenta de nuevo.");
      console.error(err);
    } finally {
      setFallaEnviando(false);
    }
  };
  const handleReportPost = async (id: string) => {
    const motivo = prompt(
      'Selecciona el motivo del reporte (escribe el número):\n1. Falsa\n2. Inadecuada o Inapropiada\n3. Perjudicial o Peligrosa'
    );
    if (!motivo) return;
    const motivos: Record<string, string> = { '1': 'Falsa', '2': 'Inadecuada', '3': 'Perjudicial' };
    const motivoTexto = motivos[motivo.trim()] || 'No especificado';
    try {
      await api.post(`/publicaciones/${id}/reportar`, { motivo: motivoTexto });
      alert(`Reporte registrado como "${motivoTexto}". Gracias por ayudar a mantener la comunidad segura.`);
      fetchFeed();
    } catch (err) {
      console.error("Error al reportar", err);
    }
  };

  const handleSharePost = async (post: any) => {
    const catLabels: Record<string, string> = {
      urgente: "🔴 Urgente",
      autoridades: "📢 Autoridades",
      donacion: "🎁 Donación / Aporte",
      mal_estado: "🚧 Vía / Lugar Dañado",
      servicios: "💡 Servicios Públicos",
      solidaridad: "🤝 Solidaridad"
    };
    
    const label = catLabels[post.categoria] || "Reporte";
    const text = `🚨 *REPORTE EN UNIDOS VENEZUELA* 🚨\n\n📌 *Categoría:* ${label}\n👤 *Por:* ${post.creador_nombre}\n📝 *Detalles:* ${post.descripcion}\n\n🔗 Ver más e ingresar aquí: ${window.location.origin}`;
    
    // Si el navegador soporta compartir nativo (móviles)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reporte Comunitario - ${label}`,
          text: text,
          url: window.location.origin
        });
      } catch (err) {
        console.log("Compartir cancelado o no soportado", err);
      }
    } else {
      // Si no, redirigir a WhatsApp Web/App directamente
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      
      // Además copiar al portapapeles por comodidad
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
    }
  };

  const categories = [
    { id: 'todos', label: 'Ver Todo', color: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' },
    { id: 'urgente', label: '🚨 Urgente', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30' },
    { id: 'autoridades', label: '📢 Autoridades', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30' },
    { id: 'donacion', label: '🎁 Donaciones', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' },
    { id: 'mal_estado', label: '🚧 Daños / Vías', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30' },
    { id: 'servicios', label: '💡 Servicios', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' },
    { id: 'solidaridad', label: '🤝 Solidaridad', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans pb-20 relative overflow-x-hidden">
      {/* VENEZUELAN TOP BAR */}
      <div className="h-1.5 w-full fixed top-0 left-0 z-[100] flex">
        <div className="w-1/3 bg-[#FCE300]"></div>
        <div className="w-1/3 bg-[#0038A8]"></div>
        <div className="w-1/3 bg-[#CE1126]"></div>
      </div>

      {/* FLOAT THEME TOGGLE */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={toggleTheme} 
          className="p-3 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : theme === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Battery className="w-5 h-5 text-green-500" />}
        </button>
      </div>

      {/* HERO SECTION */}
      <header className="relative py-20 px-4 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-blue-600/10 via-transparent to-transparent">
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-[#FCE300]/10 blur-3xl" />
        <div className="absolute top-[20%] right-[-10%] w-80 h-80 rounded-full bg-[#0038A8]/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 rounded-full bg-[#CE1126]/10 blur-3xl" />

        <div className="glass-panel inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
          <Sparkles className="w-4 h-4 animate-pulse" /> Red Humanitaria de Emergencias
        </div>

        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 max-w-4xl text-slate-900 dark:text-white leading-[0.95]">
          Red <span className="text-blue-600 dark:text-blue-400">Unidos</span>
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-2xl text-sm md:text-base leading-relaxed mb-10">
          La plataforma descentralizada y colaborativa para coordinar ayuda en emergencias, compartir donaciones de insumos clínicos, registrar reportes de zonas dañadas y conectar voluntarios.
        </p>

        {/* ACCESS BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4 relative z-10">
          <button
            onClick={onEnterAsCitizen}
            className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
          >
            <Radio className="w-5 h-5 animate-ping text-[#FCE300]" /> Entrar como Ciudadano
          </button>
          
          <button
            onClick={onEnterAsAcopio}
            className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-wider text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-white shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Gestión Institucional
          </button>
        </div>
      </header>

      {/* STATS SECTION */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 text-center mb-6">Estadísticas en Tiempo Real</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {statsLoading ? "..." : stats?.sos?.abiertos || 0}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alertas SOS Activas</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {statsLoading ? "..." : (stats?.usuarios?.por_rol?.centro_acopio || 0) + (stats?.usuarios?.por_rol?.clinica || 0) + (stats?.usuarios?.por_rol?.refugio || 0)}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Puntos de Ayuda Activos</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Camera className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {publicaciones.length}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reportes Visuales (24h)</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEED (instagram style / whatsapp status) */}
      <section className="max-w-4xl mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-500" /> Muro de Reportes Visuales
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Publica fotos y reportes al instante. Duran solo 24 horas y desaparecen.</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-5 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 border border-blue-400/30"
          >
            <Plus className="w-4 h-4" /> Nuevo Reporte (Foto)
          </button>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                filtroCategoria === cat.id 
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-md shadow-blue-500/10' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FEED GRID/LIST */}
        {feedLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : publicaciones.length === 0 ? (
          <div className="glass-panel text-center py-20 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-black uppercase tracking-wider mb-1">Muro Visual Despejado</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">No hay reportes visuales en esta categoría por las últimas 24 horas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {publicaciones.map(post => (
              <div 
                key={post.id} 
                className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-lg transition-transform hover:scale-[1.01]"
              >
                {/* Image section */}
                {post.media_url ? (
                  <div className="h-56 w-full relative overflow-hidden bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    {post.media_url.endsWith('.mp4') || post.media_url.includes('video/') ? (
                      <video src={post.media_url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.media_url} alt="Reporte" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-black/70 text-white backdrop-blur-sm border border-white/10">
                      {categories.find(c => c.id === post.categoria)?.label || post.categoria}
                    </span>
                  </div>
                ) : (
                  <div className="h-20 w-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 relative flex items-center px-4">
                    <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {categories.find(c => c.id === post.categoria)?.label || post.categoria}
                    </span>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider">{post.creador_nombre}</h4>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                          {formatTiempoRelativo(post.created_at)}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleReportPost(post.id)}
                        className="text-red-500/70 hover:text-red-500 border border-red-500/20 p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center gap-1 text-[9px] font-black uppercase"
                        title="Marcar con bandera/reportar"
                      >
                        <Flag className="w-3.5 h-3.5" /> Flag
                      </button>
                    </div>

                    <p className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed break-words whitespace-pre-line mb-4">
                      {post.descripcion}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSharePost(post)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Compartir
                    </button>
                    {post.media_url && (
                      <a
                        href={post.media_url}
                        download={`reporte_unidos_${post.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                        title="Descargar Foto/Video"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL CREAR REPORTE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" /> Publicar Reporte Visual
              </h3>
              <p className="text-xs text-slate-500">Comparte lo que ocurre a tu alrededor. Desaparecerá en 24h.</p>
            </div>
            
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Tu Nombre (Opcional)</label>
                <input 
                  type="text" 
                  value={newNombre}
                  onChange={e => setNewNombre(e.target.value)}
                  placeholder="Ej: Juan de Chacao (deja en blanco para Vecino Anónimo)"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-500 mb-1.5 uppercase tracking-widest">Cédula o Documento de Identidad *</label>
                <input 
                  type="text"
                  required
                  value={newCedula}
                  onChange={e => setNewCedula(e.target.value)}
                  placeholder="Ej: V-12345678 (no será visible públicamente)"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-red-300 dark:border-red-700/50 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-red-500"
                />
                <p className="text-[9px] text-slate-400 mt-1">🔒 Solo visible para el administrador en caso de contenido inapropiado.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Categoría del Estado</label>
                <select
                  value={newCategoria}
                  onChange={e => setNewCategoria(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-blue-500"
                >
                  <option value="urgente">🚨 Emergencia / Urgente</option>
                  <option value="autoridades">📢 Para Autoridades</option>
                  <option value="donacion">🎁 Donación / Aporte Gratis</option>
                  <option value="mal_estado">🚧 Vías o Zonas Dañadas</option>
                  <option value="servicios">💡 Falla de Servicios</option>
                  <option value="solidaridad">🤝 Búsqueda o Solidaridad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">¿Qué está pasando? (Descripción)</label>
                <textarea 
                  required
                  value={newDescripcion}
                  onChange={e => setNewDescripcion(e.target.value)}
                  placeholder="Ej: La entrada del CC Sambil Chacao está obstruida por escombros, eviten circular."
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm h-24 resize-none outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-500 mb-1.5 uppercase tracking-widest">Cargar Foto o Video *<span className="text-slate-400 font-normal ml-1">(Obligatorio)</span></label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seleccionar Archivo</span>
                    <input 
                      type="file" 
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  
                  {previewUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-300 dark:border-slate-700 relative shrink-0">
                      {newFile?.type.startsWith('video/') ? (
                        <video src={previewUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={previewUrl} className="w-full h-full object-cover" />
                      )}
                      <button 
                        type="button"
                        onClick={() => { setNewFile(null); setPreviewUrl(null); }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setNewNombre('');
                    setNewCedula('');
                    setNewFile(null);
                    setPreviewUrl(null);
                    setNewDescripcion('');
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={uploading || !newDescripcion.trim() || !newFile || !newCedula.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* FOOTER */}
      <footer className="max-w-4xl mx-auto px-4 mt-20 pb-8 text-center border-t border-slate-200 dark:border-slate-800/80 pt-6">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
          © {new Date().getFullYear()} Unidos Venezuela. Todos los derechos reservados.
        </p>
        <button 
          onClick={() => setShowFallasModal(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
        >
          <AlertOctagon className="w-4 h-4 animate-pulse" /> ¿Algo no funciona? Reportar Falla en el Sistema
        </button>
      </footer>

      {/* MODAL REPORTAR FALLA */}
      {showFallasModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" /> Reportar Falla Técnica
              </h3>
              <p className="text-xs text-slate-500">Describe el bug o error técnico para que podamos solucionarlo.</p>
            </div>
            
            <form onSubmit={handleReportarFallaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Tu Nombre (Opcional)</label>
                <input 
                  type="text" 
                  value={fallaNombre}
                  onChange={e => setFallaNombre(e.target.value)}
                  placeholder="Ej: Pedro de Chacao"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Tu Correo (Opcional)</label>
                <input 
                  type="email" 
                  value={fallaEmail}
                  onChange={e => setFallaEmail(e.target.value)}
                  placeholder="Ej: pedro@gmail.com"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-500 mb-1.5 uppercase tracking-widest">¿Qué está fallando? *</label>
                <textarea 
                  required
                  value={fallaDescripcion}
                  onChange={e => setFallaDescripcion(e.target.value)}
                  placeholder="Ej: El botón de registrar personas no responde o la app tarda mucho en cargar el mapa."
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm h-28 resize-none outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setFallaNombre('');
                    setFallaEmail('');
                    setFallaDescripcion('');
                    setShowFallasModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={fallaEnviando || !fallaDescripcion.trim()}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {fallaEnviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

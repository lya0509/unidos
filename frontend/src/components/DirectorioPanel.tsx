import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, QrCode, MessageSquare, Radio, HeartHandshake, Users, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { IdentityBadge } from './IdentityBadge';

interface DirectorioPanelProps {
  setActiveDonationQr?: (id: string) => void;
  setActiveChatRoom?: (room: { id: string; title: string }) => void;
}

export const DirectorioPanel: React.FC<DirectorioPanelProps> = ({
  setActiveDonationQr,
  setActiveChatRoom
}) => {
  const [filtroZona, setFiltroZona] = useState('Nacional');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [directorioList, setDirectorioList] = useState<any[]>([]);
  const [anunciosList, setAnunciosList] = useState<any[]>([]);

  // Estado para convocatorias de voluntariado
  const [convocatorias, setConvocatorias] = useState<any[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [modalConvId, setModalConvId] = useState<string | null>(null);
  const [inscForm, setInscForm] = useState({ nombre_completo: '', cedula: '', telefono: '' });
  const [inscLoading, setInscLoading] = useState(false);
  const [inscExito, setInscExito] = useState<string | null>(null);
  const [inscError, setInscError] = useState<string | null>(null);

  const fetchAnuncios = async () => {
    try {
      const res = await api.get('/anuncios/feed?zona=' + filtroZona);
      setAnunciosList(res.data);
    } catch (err) {
      console.error('Error fetching Anuncios', err);
      setAnunciosList([]);
    }
  };

  const fetchDirectorio = async () => {
    try {
      const res = await api.get('/auth/directorio?zona=' + filtroZona);
      setDirectorioList(res.data);
    } catch (err) {
      console.error('Error fetching Directorio', err);
      setDirectorioList([]);
    }
  };

  const fetchConvocatorias = async () => {
    setConvLoading(true);
    try {
      const res = await api.get('/convocatorias?zona=' + filtroZona);
      setConvocatorias(res.data);
    } catch (err) {
      console.error('Error fetching Convocatorias', err);
      setConvocatorias([]);
    } finally {
      setConvLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectorio();
    fetchAnuncios();
    fetchConvocatorias();
  }, [filtroZona]);

  const handleInscripcion = async () => {
    if (!inscForm.nombre_completo.trim()) { setInscError('Debes escribir tu nombre completo.'); return; }
    if (!inscForm.cedula.trim()) { setInscError('Debes escribir tu cédula de identidad.'); return; }
    setInscLoading(true);
    setInscError(null);
    try {
      const res = await api.post(`/convocatorias/${modalConvId}/inscribirse`, inscForm);
      setInscExito(res.data.mensaje);
      setInscForm({ nombre_completo: '', cedula: '', telefono: '' });
      fetchConvocatorias();
    } catch (err: any) {
      setInscError(err?.response?.data?.detail || 'Error al inscribirse. Intenta de nuevo.');
    } finally {
      setInscLoading(false);
    }
  };

  const cerrarModal = () => {
    setModalConvId(null);
    setInscExito(null);
    setInscError(null);
    setInscForm({ nombre_completo: '', cedula: '', telefono: '' });
  };

  // Los avisos generales se muestran aparte
  const avisosGenerales = anunciosList;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* ====== SECCIÓN DE CONVOCATORIAS DE VOLUNTARIADO ====== */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <HeartHandshake className="text-rose-500 w-5.5 h-5.5" /> Convocatorias de Voluntariado
        </h2>

        {convLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          </div>
        ) : convocatorias.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-bold uppercase tracking-widest text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No hay convocatorias abiertas actualmente
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {convocatorias.map(c => {
              const pct = Math.min(100, Math.round((c.inscritos_count / c.limite_personas) * 100));
              const lleno = c.inscritos_count >= c.limite_personas;
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-rose-500/20 rounded-xl p-5 shadow-md flex flex-col hover:border-rose-500/40 transition-all hover:shadow-lg group">
                  {/* Cabecera */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-500 font-black text-xs shrink-0">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{c.titulo}</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">
                        Por: {c.creador_nombre}
                      </span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3 flex-grow whitespace-pre-wrap">
                    {c.descripcion}
                  </p>

                  {/* Instrucciones especiales */}
                  {c.instrucciones && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3 text-xs font-bold text-amber-800 dark:text-amber-300">
                      📋 <strong>Instrucciones:</strong> {c.instrucciones}
                    </div>
                  )}

                  {/* Barra de progreso */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Cupos</span>
                      <span className={lleno ? 'text-red-500' : 'text-emerald-500'}>{c.inscritos_count} / {c.limite_personas}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${lleno ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Botón de inscripción */}
                  {lleno ? (
                    <div className="w-full text-center py-2.5 rounded-lg bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Cupos Agotados
                    </div>
                  ) : (
                    <button
                      onClick={() => setModalConvId(c.id)}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 active:scale-95 uppercase tracking-wider text-[10px] shadow-md hover:shadow-lg"
                    >
                      <HeartHandshake className="w-4 h-4" /> Inscribirme como Voluntario
                    </button>
                  )}

                  {/* Fecha */}
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString('es-VE')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== MODAL DE INSCRIPCIÓN ====== */}
      {modalConvId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={cerrarModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-500" /> Inscripción
              </h3>
              <button onClick={cerrarModal} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {inscExito ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <p className="text-lg font-black text-slate-900 dark:text-white">{inscExito}</p>
                <button onClick={cerrarModal} className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-lg uppercase tracking-wider text-xs transition-colors">
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-500 font-bold">Completa tus datos para confirmar tu inscripción como voluntario.</p>

                {inscError && (
                  <div className="bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded-lg text-xs font-bold text-red-700 dark:text-red-300">
                    {inscError}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    value={inscForm.nombre_completo}
                    onChange={e => setInscForm(f => ({ ...f, nombre_completo: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Cédula de Identidad *</label>
                  <input
                    type="text"
                    value={inscForm.cedula}
                    onChange={e => setInscForm(f => ({ ...f, cedula: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                    placeholder="Ej: V-12345678"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    value={inscForm.telefono}
                    onChange={e => setInscForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                    placeholder="Ej: 0412-1234567"
                  />
                </div>

                <button
                  onClick={handleInscripcion}
                  disabled={inscLoading}
                  className="w-full mt-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-black py-3 rounded-lg transition-all flex justify-center items-center gap-2 active:scale-95 uppercase tracking-wider text-xs"
                >
                  {inscLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {inscLoading ? 'Procesando...' : 'Confirmar Inscripción'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== ANUNCIOS COMUNITARIOS ====== */}
      {avisosGenerales.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="text-purple-600 dark:text-purple-400 w-5 h-5" /> Avisos Comunitarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {avisosGenerales.map((a, i) => {
              const parts = a.usuarios?.zona_operacion?.split('||');
              const lat = parts?.[1];
              const lng = parts?.[2];
              return (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md relative overflow-hidden flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    {a.usuarios?.foto_rostro_url ? (
                      <img src={a.usuarios.foto_rostro_url} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="Avatar" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                        {a.usuarios?.nombre?.substring(0, 2) || 'US'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[180px]">{a.usuarios?.nombre}</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                        {a.usuarios?.rol?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed mb-4 flex-grow whitespace-pre-wrap">
                    {a.mensaje}
                  </p>

                  {lat && lng && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors uppercase tracking-wider"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Ver en Google Maps
                    </a>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== DIRECTORIO DE RED ====== */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="text-emerald-600 dark:text-emerald-500 w-5 h-5" /> Directorio de Red
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={filtroRol} 
              onChange={(e) => setFiltroRol(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-xs font-bold text-slate-800 dark:text-white px-3 py-2 uppercase tracking-wider shadow-sm"
            >
              <option value="Todos">Todas las Categorías</option>
              <option value="centro_acopio">Centros de Acopio</option>
              <option value="clinica">Clínicas / Médicos</option>
              <option value="refugio">Refugios</option>
              <option value="lider_vecinal">Líderes Vecinales</option>
              <option value="iniciativa_ciudadana">Iniciativas Ciudadanas</option>
            </select>
            <select 
              value={filtroZona} 
              onChange={(e) => setFiltroZona(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-xs font-bold text-slate-800 dark:text-white px-3 py-2 uppercase tracking-wider shadow-sm"
            >
              <option value="Nacional">Toda Venezuela</option>
              <option value="Caracas">Caracas / Dtto Capital</option>
              <option value="Miranda">Miranda</option>
              <option value="Guaira">La Guaira</option>
              <option value="Aragua">Aragua</option>
              <option value="Carabobo">Carabobo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directorioList.filter(u => filtroRol === 'Todos' || u.rol === filtroRol).length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-sm border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">No hay registros para este filtro</div>
          ) : (
            directorioList
              .filter(u => filtroRol === 'Todos' || u.rol === filtroRol)
              .map((centro: any) => {
                const horarioItem = centro.inventario?.find((i: any) => i.insumo.startsWith('HORARIO: '));
                const horarioStr = horarioItem ? horarioItem.insumo.replace('HORARIO: ', '') : null;
                const stockItems = centro.inventario?.filter((i: any) => !i.insumo.startsWith('HORARIO: ')) || [];
                
                const parts = centro.zona_operacion?.split('||');
                const lat = parts?.[1];
                const lng = parts?.[2];

                return (
                  <div key={centro.id} className="bg-white dark:bg-slate-900 p-5 relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {(centro.zona_operacion)?.split('||')[0] || 'Nacional'}
                      </span>
                      {lat && lng && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" /> Ver Mapa
                        </a>
                      )}
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg font-bold uppercase tracking-widest">
                        {centro.rol.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black mb-4 text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      {centro.nombre}
                      <IdentityBadge user={centro} />
                    </h3>

                    {horarioStr && (
                      <div className="mb-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <Calendar className="w-5 h-5" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Horario de Atención</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{horarioStr}</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4 flex-grow border border-slate-200 dark:border-slate-700">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">Inventario / Necesidades</h4>
                      {stockItems.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No hay inventario publicado</p>
                      ) : (
                        <div className="space-y-2">
                          {stockItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{item.insumo}</span>
                              <span className="text-xs font-black text-blue-600 dark:text-blue-400">x{item.cantidad}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      {setActiveDonationQr && (
                        <button 
                          onClick={() => setActiveDonationQr(centro.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 active:scale-95 uppercase tracking-wider text-[10px] glow-blue"
                        >
                          <QrCode className="w-4 h-4" /> Donar
                        </button>
                      )}
                      {setActiveChatRoom && (
                        <button 
                          onClick={() => setActiveChatRoom({ id: `user_${centro.id}`, title: `Chat: ${centro.nombre}` })}
                          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 active:scale-95 text-[10px] uppercase tracking-wider border border-slate-300 dark:border-slate-700"
                        >
                          <MessageSquare className="w-4 h-4" /> Chat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

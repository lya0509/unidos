import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, QrCode, MessageSquare, Radio, HeartHandshake } from 'lucide-react';
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

  useEffect(() => {
    fetchDirectorio();
    fetchAnuncios();
  }, [filtroZona]);

  // Filtrar avisos en solicitudes de voluntariado y avisos generales
  const voluntariados = anunciosList.filter(a => 
    a.mensaje?.toLowerCase().includes('voluntario') || 
    a.mensaje?.toLowerCase().includes('voluntariado')
  );
  
  const avisosGenerales = anunciosList.filter(a => 
    !a.mensaje?.toLowerCase().includes('voluntario') && 
    !a.mensaje?.toLowerCase().includes('voluntariado')
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* SECCIÓN DE VOLUNTARIADO */}
      {voluntariados.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <HeartHandshake className="text-rose-500 w-5.5 h-5.5" /> Solicitudes de Voluntariado
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voluntariados.map((a, i) => {
              const parts = a.usuarios?.zona_operacion?.split('||');
              const lat = parts?.[1];
              const lng = parts?.[2];
              return (
                <div key={i} className="bg-white dark:bg-slate-900 border border-rose-500/20 rounded-xl p-5 shadow-md relative overflow-hidden flex flex-col hover:border-rose-500/40 transition-colors">
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">
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

      {/* ANUNCIOS SECTION */}
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

      {/* DIRECTORIO SECTION */}
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

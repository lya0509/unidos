import React from 'react';

export const SOSDescriptionDisplay: React.FC<{ descripcion: string }> = ({ descripcion }) => {
  if (!descripcion) return null;

  try {
    let rawStr = descripcion;
    let isUrgente = false;
    
    if (rawStr.startsWith('[URGENTE] ')) {
      isUrgente = true;
      rawStr = rawStr.replace('[URGENTE] ', '');
    }

    if (rawStr.startsWith('{')) {
      const parsed = JSON.parse(rawStr);
      const categorias = parsed.categorias || {};
      const detalles = parsed.detalles || '';

      const catKeys = Object.keys(categorias);
      
      if (catKeys.length === 0 && !detalles) {
        return <p className="text-slate-600 dark:text-slate-300 text-sm mb-2 leading-relaxed">Sin descripción</p>;
      }

      return (
        <div className="mb-4">
          {catKeys.length > 0 && (
            <div className="flex flex-col gap-2 mb-2.5">
              {catKeys.map((catKey) => (
                <div key={catKey} className="w-full bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-500/30 rounded-md p-2">
                  <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 block mb-0.5 tracking-wider">
                    {catKey === 'refugio' ? '⛺ Refugio' : 
                     catKey === 'alimentos' ? '🍱 Alimentos' :
                     catKey === 'ropa' ? '👕 Ropa' :
                     catKey === 'higiene' ? '🧻 Higiene' :
                     catKey === 'limpieza' ? '🧹 Infraestructura' :
                     catKey === 'medico' ? '⚕️ Med. Descartable' :
                     catKey === 'medicamentos' ? '💊 Medicamentos' :
                     catKey === 'mascotas' ? '🐶 Mascotas' : catKey}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {categorias[catKey].map((item: string) => (
                      <span key={item} className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-tight flex items-start justify-between gap-1">
                        <span><span className="text-blue-400 mt-0.5">•</span> {item}</span>
                        {parsed.cantidades && parsed.cantidades[item] && (
                          <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-100/50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-[10px]">
                            x{parsed.cantidades[item]}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {parsed.items_especificos && parsed.items_especificos.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">Carga Rápidía / Cantidades Exactas</span>
              <ul className="space-y-1">
                {parsed.items_especificos.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>• {item.insumo}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">x{item.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {detalles && (
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Detalles Adicionales</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{detalles}</p>
            </div>
          )}
        </div>
      );
    }
  } catch (e) {
    // If JSON parsing fails, fall through to default text render
  }

  // Fallback for legacy plain text descriptions
  const isUrgent = descripcion.startsWith('[URGENTE]');
  const displayDesc = isUrgent ? descripcion.replace('[URGENTE] ', '') : descripcion;
  
  return (
    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
      {displayDesc}
    </p>
  );
};

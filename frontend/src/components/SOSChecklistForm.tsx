import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

export const SOS_CATEGORIES = [
  {
    id: 'refugio_dormir',
    title: '⛺ Artículos para Dormir y Refugio',
    items: [
      'Carpas / Tiendas de campaña (Familiares)',
      'Toldos estructurales grandes',
      'Lonas impermeables pesadas',
      'Camas plegables (Catres)',
      'Colchones inflables',
      'Colchonetas de espuma (Alta densidad)',
      'Aislantes térmicos (Esterillas/Mats)',
      'Sacos de dormir (Sleeping bags)',
      'Ropa de cama: Sábanas y fundas',
      'Cobijas térmicas / Mantas / Edredones',
      'Almohadas',
      'Mosquiteros grandes',
      'Repelente de insectos'
    ]
  },
  {
    id: 'alimentos',
    title: '🍱 Alimentos (No perecederos) y Agua',
    items: [
      'Botellones de agua (18-20L)',
      'Botellas de agua (1.5L / 500ml)',
      'Pastillas potabilizadoras',
      'Proteínas enlatadas (Atún/Sardinas)',
      'Proteínas enlatadas (Pollo/Carne)',
      'Carbohidratos secos (Arroz/Pasta)',
      'Harina de maíz / Harina de trigo',
      'Avena / Galletas',
      'Aceite vegetal / Margarina',
      'Sal / Azúcar / Condimentos',
      'Fórmula materna (Etapas 1, 2, 3)',
      'Compotas / Cereales infantiles',
      'Leche en polvo',
      'Café / Té / Bebidas',
      'Barras energéticas'
    ]
  },
  {
    id: 'ropa',
    title: '👕 Ropa y Calzado',
    items: [
      'Bebés (0-24 meses): Bodies, monos',
      'Niños/Niñas (Tallas 2-12): Monos, franelas',
      'Adultos (S al XXL): Jeans, franelas',
      'Ropa Interior nueva / Medias',
      'Ropa de maternidad',
      'Impermeables / Ponchos',
      'Zapatos deportivos / Sandalias',
      'Botas de caucho'
    ]
  },
  {
    id: 'higiene',
    title: '🧻 Higiene Personal',
    items: [
      'Jabón de tocador / Champú / Acondicionador',
      'Desodorante',
      'Cepillos y crema dental / Enjuague',
      'Toallas sanitarias / Protectores',
      'Copas menstruales',
      'Pañales para bebé (Todas las tallas)',
      'Pañales para adulto (Todas las tallas)',
      'Toallas húmedas / Crema antipañalitis',
      'Afeitadoras / Peines / Cortaúñas',
      'Papel higiénico',
      'Toallas de baño'
    ]
  },
  {
    id: 'limpieza_infraestructura',
    title: '🧹 Limpieza, Cocina e Infraestructura',
    items: [
      'Plantas eléctricas / Extensiones',
      'Bombillos recargables / Linternas',
      'Baterías (AA, AAA, C, D)',
      'Bombonas de gas',
      'Cocinas industriales / Camping',
      'Ollas grandes / Abrelatas manuales',
      'Vajilla desechable / Plástico duro',
      'Tanques plásticos / Tobos / Baldes',
      'Cloro / Desinfectante / Detergente',
      'Bolsas industriales de basura',
      'Escobas / Rastrillos / Mopas',
      'Guantes gruesos de limpieza'
    ]
  },
  {
    id: 'epp_clinicas',
    title: '🛡️ EPP y Bioseguridad (Clínicas)',
    items: [
      'Mascarillas quirúrgicas (3 capas)',
      'Mascarillas KN95 / N95 / FFP2',
      'Mascarillas pediátricas desechables',
      'Lentes de seguridad / Caretas faciales',
      'Batas quirúrgicas desechables',
      'Gorros / Cumbrebotas desechables',
      'Guantes de examen (Nitrilo/Látex)',
      'Guantes quirúrgicos estériles'
    ]
  },
  {
    id: 'descartable_clinicas',
    title: '🩹 Material Médico Quirúrgico',
    items: [
      'Gasas estériles / Apósitos absorbentes',
      'Vendas elásticas / Vendas de yeso',
      'Inyectadoras (Todas las medidas)',
      'Yelcos / Catéteres (18G al 24G)',
      'Macrogoteros / Microgoteros',
      'Obturadores / Llaves de 3 vías',
      'Sondas Foley / Bolsas recolectoras',
      'Sondas nasogástricas',
      'Bajalenguas / Hisopos estériles',
      'Adhesivo médico / Tirro clínico / Leukoplast',
      'Contenedores de cortopunzantes / Bolsas rojas'
    ]
  },
  {
    id: 'medicamentos_clinicas',
    title: '💊 Medicamentos y Fluidoterapia',
    items: [
      'Solución Fisiológica 0.9%',
      'Solución Ringer Lactato',
      'Dextrosa al 5% y 10%',
      'Paracetamol / Ibuprofeno',
      'Ketoprofeno / Diclofenac / Dipirona',
      'Amoxicilina / Ciprofloxacina',
      'Ceftriaxona / Antibióticos IV',
      'Hidrocortisona / Dexametasona',
      'Adrenalina',
      'Toxoide Tetánico (Vacuna)',
      'Insulinas (Cadena de frío)',
      'Suero antiofídico / antiescorpiónico',
      'Alcohol 70% / Agua oxigenada',
      'Betadine (Povidona Yodada) / Clorhexidina',
      'Crema para quemaduras (Sulfadiazina de Plata)'
    ]
  },
  {
    id: 'equipos_clinicas',
    title: '🏥 Equipamiento, Diagnóstico y Apoyo Vital',
    items: [
      'Camillas plegables / Sábanas clínicas',
      'Biombos',
      'Cavas térmicas / Gel refrigerante',
      'Mantas térmicas aluminizadas',
      'Tensiómetros / Estetoscopios',
      'Termómetros (Digital/Infrarrojo)',
      'Oxímetros de pulso / Glucómetros',
      'Nebulizadores (Mascarillas adulto/pediátrica)',
      'Collares cervicales / Férulas',
      'Sillas de ruedas / Muletas'
    ]
  }
];

interface SOSChecklistFormProps {
  value: string;
  onChange: (jsonValue: string) => void;
}

export const SOSChecklistForm: React.FC<SOSChecklistFormProps> = ({ value, onChange }) => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  
  // Parse initial state or create empty
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    try {
      if (value && value.startsWith('{')) {
        const parsed = JSON.parse(value);
        return parsed.categorias || {};
      }
    } catch (e) {}
    return {};
  });

  const [detalles, setDetalles] = useState(() => {
    try {
      if (value && value.startsWith('{')) {
        return JSON.parse(value).detalles || '';
      }
    } catch (e) {}
    return value && !value.startsWith('{') ? value : '';
  });

  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    try {
      if (value && value.startsWith('{')) {
        return JSON.parse(value).cantidades || {};
      }
    } catch (e) {}
    return {};
  });

  const updateParent = (newSelections: Record<string, string[]>, newDetalles: string, newQuantities: Record<string, string>) => {
    const jsonStr = JSON.stringify({
      categorias: newSelections,
      cantidades: newQuantities,
      detalles: newDetalles
    });
    onChange(jsonStr);
  };

  const toggleItem = (catId: string, item: string) => {
    const catSelections = selections[catId] || [];
    let newCatSelections;
    if (catSelections.includes(item)) {
      newCatSelections = catSelections.filter(i => i !== item);
    } else {
      newCatSelections = [...catSelections, item];
    }
    
    const newSelections = { ...selections };
    if (newCatSelections.length === 0) {
      delete newSelections[catId];
    } else {
      newSelections[catId] = newCatSelections;
    }
    
    setSelections(newSelections);
    updateParent(newSelections, detalles, quantities);
  };

  const updateQuantity = (item: string, qty: string) => {
    const newQuantities = { ...quantities, [item]: qty };
    setQuantities(newQuantities);
    updateParent(selections, detalles, newQuantities);
  };

  const allSelectedItems = Object.values(selections).flat();

  return (
    <div className="space-y-3 mb-4">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Checklist Rápido de Necesidades</label>
      
      <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/40">
        {SOS_CATEGORIES.map((cat) => {
          const isExpanded = expandedCat === cat.id;
          const selectedCount = (selections[cat.id] || []).length;
          
          return (
            <div key={cat.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
              <button
                type="button"
                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cat.title}</span>
                  {selectedCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              
              {isExpanded && (
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map(item => {
                    const isSelected = (selections[cat.id] || []).includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(cat.id, item)}
                        className={`flex items-start gap-2 p-2 rounded text-left transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 opacity-50" />}
                        </div>
                        <span className="text-xs font-semibold leading-tight">{item}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Detalles Adicionales</label>
        <textarea
          value={detalles}
          onChange={(e) => {
            setDetalles(e.target.value);
            updateParent(selections, e.target.value, quantities);
          }}
          placeholder="Escribe detalles específicos (ej. Tallas, tipos de medicinas, cantidades...)"
          className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500"
          rows={2}
        />
      </div>

      {allSelectedItems.length > 0 && (
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
          <label className="block text-xs font-black text-emerald-700 dark:text-emerald-500 mb-2 uppercase tracking-widest">
            Cantidades de lo Seleccionado
          </label>
          <div className="space-y-2">
            {allSelectedItems.map((item) => (
              <div key={item} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate flex-1">{item}</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Cant."
                  value={quantities[item] || ''}
                  onChange={(e) => updateQuantity(item, e.target.value)}
                  className="w-20 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm font-bold text-center outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

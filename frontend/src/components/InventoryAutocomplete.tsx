import { useState, useMemo } from 'react'
import { Search, Plus, Check, Loader2 } from 'lucide-react'

// El listado exhaustivo de emergencias categorizado
const EMERGENCY_INVENTORY = [
  // REFUGIOS NORMALES - Dormir
  "Carpas / Tiendas de campaña (Familiares)", "Toldos estructurales grandes", "Lonas impermeables pesadas", 
  "Camas plegables (Catres)", "Colchones inflables", "Colchonetas de espuma", "Aislantes térmicos (Mats)", 
  "Sacos de dormir (Sleeping bags)", "Sábanas y fundas", "Cobijas térmicas", "Mantas / Edredones", 
  "Almohadas", "Mosquiteros grandes", "Repelente de insectos",
  
  // REFUGIOS NORMALES - Alimentos y Agua
  "Agua - Botellones (18-20L)", "Agua - Botellas (1.5L / 500ml)", "Pastillas potabilizadoras",
  "Atún enlatado", "Sardinas enlatadas", "Frijoles / Caraotas enlatadas", "Salchichas / Carne enlatada",
  "Arroz", "Pasta", "Harina de maíz", "Harina de trigo", "Avena", "Galletas de soda / dulces",
  "Leche en polvo", "Azúcar", "Sal", "Aceite vegetal", "Café", "Sopas instantáneas", "Comida para bebé (Compotas)",
  
  // REFUGIOS NORMALES - Ropa y Calzado
  "Ropa de Bebé (Nueva/Buen estado)", "Ropa de Niños (Nueva/Buen estado)", "Ropa de Adulto (Nueva/Buen estado)",
  "Ropa Interior (Solo nueva)", "Medias (Solo nuevas)", "Zapatos / Botas de lluvia", "Abrigos / Chaquetas",
  
  // REFUGIOS NORMALES - Higiene Personal
  "Jabón de baño (Pastilla/Líquido)", "Champú", "Cepillos de dientes", "Crema dental", 
  "Toallas sanitarias", "Tampones", "Pañales para bebé", "Pañales para adulto", 
  "Papel higiénico", "Toallitas húmedas", "Desodorante",
  
  // REFUGIOS NORMALES - Limpieza
  "Cloro / Lavandina", "Desinfectante", "Jabón en polvo / Lavaplatos", "Bolsas de basura industriales", 
  "Bolsas de basura domésticas", "Escobas y Haraganes", "Coleto / Mopa", "Guantes de goma pesados", "Mascarillas (Limpieza)",
  
  // REFUGIOS NORMALES - Infraestructura
  "Linternas (Pilas/Recargables)", "Pilas (AA, AAA, D)", "Velas y Fósforos / Yesqueros",
  "Generadores eléctricos (Plantas)", "Combustible (Gasolina/Gasoil)", "Extensiones eléctricas",
  "Herramientas (Martillo, clavos, alicate)", "Cinta adhesiva industrial (Duct tape)",
  
  // REFUGIOS NORMALES - Primeros Auxilios Básicos
  "Gasas estériles", "Vendas elásticas", "Alcohol isopropílico", "Agua oxigenada", "Yodo (Povidona)",
  "Algodón", "Curitas", "Adhesivo médico", "Paracetamol / Acetaminofén", "Ibuprofeno",
  "Antialérgicos (Loratadina, Cetirizina)", "Sales de rehidratación oral (Suero)",
  
  // REFUGIOS CLÍNICAS - Material Médico Crítico
  "Solución Fisiológica 0.9%", "Solución Ringer Lactato", "Solución Glucosada 5%",
  "Equipos de infusión (Macrogoteros/Microgoteros)", "Inyectadoras (3cc, 5cc, 10cc, 20cc)",
  "Catéteres intravenosos (Jelcos varios calibres)", "Obturadores / Llaves de 3 vías",
  
  // REFUGIOS CLÍNICAS - Medicamentos
  "Antibióticos Orales (Amoxicilina, Ciprofloxacina)", "Antibióticos IV (Ceftriaxona, Ampicilina)",
  "Analgésicos IV (Ketoprofeno, Diclofenac)", "Protectores Gástricos (Omeprazol, Ranitidina)",
  "Insulina (Rápida/Lenta)", "Antihipertensivos (Losartán, Captopril)", 
  "Anticonvulsivos (Fenitoína, Diazepam)", "Inhaladores (Salbutamol, Budesonida)",
  
  // REFUGIOS CLÍNICAS - Quirúrgico y Respiratorio
  "Suturas (Seda, Nylon, Vicryl)", "Bisturís (Hojas y mangos)", "Guantes estériles quirúrgicos",
  "Gasas empaquetadas estériles", "Campos quirúrgicos", "Cilindros de Oxígeno portátiles",
  "Mascarillas de Oxígeno (Adulto/Pediátrico)", "Cánulas nasales", "Nebulizadores",
  
  // REFUGIOS CLÍNICAS - Nutrición
  "Fórmulas infantiles (Etapa 1, 2, 3)", "Suplementos nutricionales (Ensure, Pediasure)",
  "Sondas nasogástricas",
  
  // MASCOTAS
  "Comida seca para perros (Perrarina)", "Comida seca para gatos (Gatarina)",
  "Medicamentos veterinarios básicos", "Collares y correas", "Jaulas transportadoras",
  
  // HOSPITALES / CLÍNICAS - CAPACIDAD
  "Camillas Disponibles - Primeros Auxilios", "Camillas Disponibles - Cirugía",
  "Camillas Disponibles - UCI", "Camillas Disponibles - Observación",
  "Sillas de Ruedas Disponibles", "Quirófanos Disponibles", "Camas Pediátricas Disponibles"
];

interface InventoryAutocompleteProps {
  onAdd?: (insumo: string, cantidad: number) => void;
  onChange?: (insumo: string) => void;
  loading?: boolean;
  customItems?: string[];
  mode?: 'full' | 'inputOnly';
  initialValue?: string;
}

export function InventoryAutocomplete({onAdd, onChange, loading = false, customItems = [], mode = 'full', initialValue = ''}: InventoryAutocompleteProps) {
  const [query, setQuery] = useState(initialValue)
  const [cantidad, setCantidad] = useState<number | ''>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    if (!query) return []
    const allItems = Array.from(new Set([...EMERGENCY_INVENTORY, ...customItems]));
    return allItems.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8)
  }, [query, customItems])

  const handleSelect = (item: string) => {
    setSelectedItem(item)
    setQuery(item)
    setShowDropdown(false)
    if (onChange) onChange(item)
  }

  const handleAdd = () => {
    if (!selectedItem && !query) return;
    if (!cantidad || cantidad <= 0) return alert('Debes ingresar una cantidad válida');
    
    // Si no lo seleccionó de la lista pero escribió algo, lo permitimos
    const finalItem = selectedItem || query;
    if (onAdd) onAdd(finalItem, Number(cantidad));
    
    // Reset
    setQuery('');
    setSelectedItem(null);
    setCantidad('');
  }

  return (
    <div className="w-full relative">
      <div className="flex gap-2 items-start">
        <div className="relative flex-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedItem(null)
                setShowDropdown(true)
                if (onChange) onChange(e.target.value)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar insumo (Ej: Carpas, Atún, Gasa...)"
              className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold shadow-sm transition-all"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && filteredItems.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
              {filteredItems.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <Check className={`w-4 h-4 ${selectedItem === item ? 'text-blue-500' : 'text-transparent'}`} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {mode === 'full' && (
          <>
            <div className="w-24">
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                placeholder="Cant."
                className="w-full px-3 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-center shadow-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={loading || (!selectedItem && !query) || !cantidad}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3.5 rounded-lg font-black flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all active:scale-95 disabled:opacity-50 h-[50px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span className="hidden sm:inline uppercase tracking-widest text-xs">Agregar</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

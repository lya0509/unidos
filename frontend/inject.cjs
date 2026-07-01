const fs = require('fs');
let content = fs.readFileSync('C:/VENEZUELA/frontend/src/pages/dashboards/CentroDashboard.tsx', 'utf8');

// 1. Add import
if (!content.includes('HorarioPicker')) {
    content = content.replace(
        "import { CapacidadHospitalaria } from '../../components/CapacidadHospitalaria'",
        "import { CapacidadHospitalaria } from '../../components/CapacidadHospitalaria'\nimport { HorarioPicker } from '../../components/HorarioPicker'"
    );
}

// 2. Add state
if (!content.includes('showHorarioPicker')) {
    content = content.replace(
        "const [activeChatRoom, setActiveChatRoom] = useState<{id: string, title: string} | null>(null)",
        "const [activeChatRoom, setActiveChatRoom] = useState<{id: string, title: string} | null>(null)\n  const [showHorarioPicker, setShowHorarioPicker] = useState(false)"
    );
}

// 3. Add HorarioPicker modal
if (!content.includes('<HorarioPicker')) {
    content = content.replace(
        "{activeChatRoom && (",
        "{showHorarioPicker && (\n        <HorarioPicker \n          onClose={() => setShowHorarioPicker(false)} \n          onSave={async (val) => { await handleAddManualInventory('HORARIO: ' + val, 1); }}\n        />\n      )}\n\n      {activeChatRoom && ("
    );
}

// 4. Add the trigger button inside the 'anuncios' tab
if (!content.includes('setShowHorarioPicker(true)')) {
    content = content.replace(
        /<h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex[\s\S]*?<\/h2>/,
        `<div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Publicar Anuncio
                </h2>
                <button 
                  onClick={() => setShowHorarioPicker(true)} 
                  type="button"
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" /> Fijar Horario
                </button>
              </div>`
    );
}

if (!content.includes(' Clock,')) {
   content = content.replace(/import \{([^}]+)\} from 'lucide-react'/, "import { $1, Clock } from 'lucide-react'");
}

fs.writeFileSync('C:/VENEZUELA/frontend/src/pages/dashboards/CentroDashboard.tsx', content, 'utf8');
console.log('Injected HorarioPicker');

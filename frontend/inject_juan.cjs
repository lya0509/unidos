const fs = require('fs');

let content = fs.readFileSync('C:/VENEZUELA/frontend/src/App.tsx', 'utf8');
if (!content.includes('SuperAdminDashboard')) {
   content = "import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard'\n" + content;
   
   content = content.replace(
      "case 'ciudadano':",
      "case 'juan':\n        return <SuperAdminDashboard />\n      case 'ciudadano':"
   );
   fs.writeFileSync('C:/VENEZUELA/frontend/src/App.tsx', content, 'utf8');
   console.log('App.tsx updated');
}

let regContent = fs.readFileSync('C:/VENEZUELA/frontend/src/pages/Register.tsx', 'utf8');
if (!regContent.includes('list="roles_list"')) {
    // We replace the <select> with an input that has a datalist so Juan can type 'juan'
    regContent = regContent.replace(
        /<select[\s\S]*?<\/select>/,
        `<input
                    list="roles_list"
                    value={rol}
                    onChange={(e) => setRol(e.target.value.toLowerCase())}
                    placeholder="Escribe o selecciona tu rol"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all appearance-none uppercase tracking-wider"
                  />
                  <datalist id="roles_list">
                    <option value="ciudadano">Ciudadano Solidario</option>
                    <option value="comunidad">Comunidad (Centro Temporal)</option>
                    <option value="refugio">Refugio (Campamento)</option>
                    <option value="lider_vecinal">Líder Vecinal</option>
                    <option value="clinica">Clínica / Hospital</option>
                  </datalist>`
    );
    fs.writeFileSync('C:/VENEZUELA/frontend/src/pages/Register.tsx', regContent, 'utf8');
    console.log('Register.tsx updated');
}

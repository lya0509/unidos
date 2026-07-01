const fs = require('fs');
const path = require('path');

const dashboards = [
    'CentroDashboard.tsx',
    'CiudadanoDashboard.tsx',
    'IniciativaDashboard.tsx',
    'LiderDashboard.tsx'
];

dashboards.forEach(file => {
    const fullPath = path.join('C:/VENEZUELA/frontend/src/pages/dashboards', file);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // We look for: const [activeTab, setActiveTab] = useState...('something')
    const stateRegex = /const\s+\[activeTab,\s*setActiveTab\]\s*=\s*useState(?:<[^>]+>)?\(['"]([^'"]+)['"]\)/;
    if (stateRegex.test(content)) {
        content = content.replace(stateRegex, "const [activeTab, setActiveTab] = useTabNavigation('$1')");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Injected useTabNavigation in', file);
    }
});

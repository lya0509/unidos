const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;

            const fixes = [
                { search: /irregularidades/g, replace: 'irregularidades' },
                { search: /irregularidAades/g, replace: 'irregularidades' },
                { search: /sern/g, replace: 'serán' },
                { search: /serAn/g, replace: 'serán' },
                { search: /serAn/g, replace: 'serán' },
                { search: /ASube/g, replace: '¡Sube' },
                { search: /,ASube/g, replace: '¡Sube' },
                { search: /da/g, replace: 'día' },
                { search: /dAa/g, replace: 'día' },
                { search: /atencin/g, replace: 'atención' },
                { search: /Especfico/g, replace: 'Específico' },
                { search: /Rpida/g, replace: 'Rápida' },
                { search: /Mantn/g, replace: 'Mantén' },
                { search: /Mantn/g, replace: '¡Mantén' },
                { search: /mAltiples/g, replace: 'múltiples' },
                { search: /CAcdula/g, replace: 'Cédula' },
                { search: /falsificaciA3n/g, replace: 'falsificación' },
                { search: /sancionada mediante el sistema/g, replace: 'sancionada mediante el sistema' }
            ];

            for (const fix of fixes) {
                if (fix.search.test(content)) {
                    content = content.replace(fix.search, fix.replace);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(file, content, 'utf8');
                console.log('Fixed', file);
            }
        }
    });
    return results;
}

walk('C:/VENEZUELA/frontend/src');

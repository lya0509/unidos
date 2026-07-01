const fs = require('fs');
const path = require('path');

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        if (fs.statSync(file).isDirectory()) walk(file);
        else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;

            const fixes = [
                { search: /díark/g, replace: 'dark' },
                { search: /díata/g, replace: 'data' },
                { search: /ciudíadíano/g, replace: 'ciudadano' },
                { search: /Ciudíadíano/g, replace: 'Ciudadano' },
                { search: /cantidíad/g, replace: 'cantidad' },
                { search: /Cantidíad/g, replace: 'Cantidad' },
                { search: /comunidíad/g, replace: 'comunidad' },
                { search: /Comunidíad/g, replace: 'Comunidad' },
                { search: /Calendíar/g, replace: 'Calendar' },
                { search: /Modíal/g, replace: 'Modal' },
                { search: /Seguridíad/g, replace: 'Seguridad' },
                { search: /Mirandía/g, replace: 'Miranda' },
                { search: /Todía/g, replace: 'Toda' },
                { search: /díatalist/g, replace: 'datalist' },
                { search: /ayudía/g, replace: 'ayuda' },
                { search: /Ayudía/g, replace: 'Ayuda' },
                { search: /díashed/g, replace: 'dashed' },
                { search: /entregadía/g, replace: 'entregada' },
                { search: /canceladía/g, replace: 'cancelada' },
                { search: /especificadía/g, replace: 'especificada' },
                { search: /emitidía/g, replace: 'emitida' },
                { search: /inválidí/g, replace: 'inválid' },
                { search: /radíar/g, replace: 'radar' },
                { search: /Radíar/g, replace: 'Radar' },
                { search: /solidía/g, replace: 'solida' },
                { search: /Solidía/g, replace: 'Solida' },
                { search: /Ciudíad/g, replace: 'Ciudad' },
                { search: /ciudíad/g, replace: 'ciudad' },
                { search: /edeterminadía/g, replace: 'edeterminada' },
                { search: /revalidíad/g, replace: 'revalidad' },
                { search: /comidía/g, replace: 'comida' }
            ];

            for (const fix of fixes) {
                if (fix.search.test(content)) {
                    content = content.replace(fix.search, fix.replace);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(file, content, 'utf8');
                console.log('Fixed back', file);
            }
        }
    });
}
walk('C:/VENEZUELA/frontend/src');

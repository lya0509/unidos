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
            
            // Clean up old regex corruption
            if (content.includes('COMUNIDÍAD')) {
                content = content.replace(/COMUNIDÍAD/g, 'COMUNIDAD');
                modified = true;
            }
            if (content.includes('Comunidíad')) {
                content = content.replace(/Comunidíad/g, 'Comunidad');
                modified = true;
            }
            if (content.includes('comunidíad')) {
                content = content.replace(/comunidíad/g, 'comunidad');
                modified = true;
            }
            if (content.includes('Todía Venezuela')) {
                content = content.replace(/Todía Venezuela/g, 'Toda Venezuela');
                modified = true;
            }
            
            // Wait, also in IdentityBadge I noticed "CAcdula" and "falsificaciA3n". Let's fix utf-8 corruption globally for some known bad sequences:
            if (content.includes('CAcdula')) {
                content = content.replace(/CAcdula/g, 'Cédula');
                modified = true;
            }
            if (content.includes('falsificaciA3n')) {
                content = content.replace(/falsificaciA3n/g, 'falsificación');
                modified = true;
            }
            if (content.includes('sancionada mediante el sistema de reportes comunitarios.')) {
                 // Nothing wrong here but let's check for 'A3n'
            }
            if (content.includes('A3n')) {
                content = content.replace(/A3n/g, 'ón');
                modified = true;
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

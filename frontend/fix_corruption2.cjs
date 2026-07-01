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
                { search: /díashboards/g, replace: 'dashboards' },
                { search: /Capacidíad/g, replace: 'Capacidad' }
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
}
walk('C:/VENEZUELA/frontend/src');

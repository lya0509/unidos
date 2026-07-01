const fs = require('fs');
let content = fs.readFileSync('C:/VENEZUELA/frontend/src/context/AuthContext.tsx', 'utf8');

// Replace the specific union types with just string
content = content.replace(/rol:\s*['"][^;]+;/, 'rol: string;');

fs.writeFileSync('C:/VENEZUELA/frontend/src/context/AuthContext.tsx', content, 'utf8');

// Also update App.tsx to avoid typescript error on `user.rol === 'juan'` if it happens
let appContent = fs.readFileSync('C:/VENEZUELA/frontend/src/App.tsx', 'utf8');
appContent = appContent.replace(/case 'juan':/g, "case 'juan':"); // Just to be sure
fs.writeFileSync('C:/VENEZUELA/frontend/src/App.tsx', appContent, 'utf8');

console.log('Fixed User interface in AuthContext.tsx');

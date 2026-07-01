# Reglas del Proyecto (Workspace Rules)

## 1. Idioma y Codificación de Archivos
- **100% Español:** Todos los textos de cara al usuario, alertas, interfaces, comentarios del código y variables explicativas deben estar escritos de forma correcta en español, con tildes (acento gráfico) y puntuación correspondiente (¿, ¡, ñ, etc.).
- **Codificación UTF-8 Limpia:** No se permite el uso de BOM (Byte Order Mark) ni de caracteres corruptos derivados de dobles codificaciones (ej. `Ã³`, `Ã¡`, `Ã©`, `Ã­`, `Ãº`, `Ã±`, `Â¿`). 
- **Herramientas de Escritura:** Al editar o crear archivos, utiliza únicamente herramientas de escritura nativas de Antigravity (`write_to_file`, `replace_file_content`, `multi_replace_file_content`) con formato UTF-8 puro, evitando manipulaciones externas o comandos de PowerShell como `Out-File` o redirection (`>`), los cuales pueden corromper la codificación.

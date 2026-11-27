# Instrucciones para agentes de Cinepollis

Lee este archivo antes de modificar el proyecto. Revisa también las instrucciones del directorio donde vayas a trabajar, el estado de Git y los cambios locales de tus compañeros.

- Para registro, inicio de sesión o sesiones, lee [el encargo de backend](database/ENCARGO-BACKEND-ACCESO.md) y revisa los campos y respuestas que usa src/screens/AccessScreen.jsx. Coordina los cambios al contrato de la API con quien mantiene el frontend.
- Para cambios en la base de datos, consulta [la guía de instalación y migraciones](database/LEEME-PRIMERO.md). Conserva los datos existentes y entrega los cambios de esquema como migraciones.
- Mantén la interfaz en español y comprueba la vista móvil cuando cambies una pantalla. Ejecuta npm run lint y npm run build para cambios del frontend.
- Usa variables de entorno para credenciales. Documenta los nombres y ejemplos ficticios. Antes de subir cambios, revisa los archivos incluidos en el commit.

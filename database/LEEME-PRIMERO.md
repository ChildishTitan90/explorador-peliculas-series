# Cinepollis · Entrega v3

Instalación nueva: ejecutar en PostgreSQL 001_schema.sql, 004_estadisticas_planes.sql y 005_acceso_correo.sql, en ese orden, con psql y ON_ERROR_STOP=1. En Atlas ejecutar mongodb/001_atlas.js. El script SQL 002 carga datos ficticios opcionales y 003 contiene ejemplos de consultas.

Si ya instalaste v2 (incluida la migración 004), ejecutar solo 005. Si instalaste únicamente 001, ejecutar 004 y después 005. Aplicar cada migración una sola vez.

## Acceso desde Cinepollis

El servidor registra username, display_name, email y password_hash generado mediante Argon2id. Validar el formato del correo y buscar la cuenta con lower(email)=lower($1). Los perfiles anteriores conservan su ID y sus relaciones. Para habilitarles acceso local hace falta verificar la identidad antes de asignar sus credenciales. La API pública de perfiles debe seleccionar explícitamente campos públicos.

email_verified_at empieza vacío. La primera versión permite iniciar sesión en ese estado. El envío de enlaces de verificación y el almacenamiento de sus tokens se incorporarán en una fase posterior.

El backend genera tokens aleatorios de sesión y recuperación, guarda solo su digest SHA-256 y comprueba el vencimiento. Entrega la sesión en una cookie HttpOnly y Secure en producción. Para cerrar sesión elimina su fila. Para recuperar, consume el token mediante DELETE con filtro de vigencia y RETURNING user_id, cambia el hash de contraseña e invalida las sesiones del usuario en la misma transacción. La entrega incluye el esquema; el backend y el servicio de correo se conectan por separado.

PostgreSQL guarda cuentas, listas, notas, planes y visualizaciones. MongoDB Atlas almacena la proyección de actividad pública. Las instrucciones de planes y estadísticas se encuentran en GUIA-PLANES-v2.md. ENTREGA.md documenta la primera versión; esta guía sustituye su propuesta de acceso con Google.

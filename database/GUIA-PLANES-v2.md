# Cinepollis · Instalación y actualización de bases de datos

## Si empiezas desde cero

1. Crea una base vacía en PostgreSQL 15 o superior. Desde la carpeta descomprimida ejecuta con psql los comandos siguientes, en orden. Cada archivo SQL de esquema utiliza una transacción.
   - `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgresql/001_schema.sql`
   - `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgresql/004_estadisticas_planes.sql`
2. En desarrollo puedes cargar datos ficticios con `postgresql/002_demo.sql` una sola vez. El archivo 003 contiene ejemplos de consultas para el backend.
3. En MongoDB Atlas configura un clúster y ejecuta `mongosh "$MONGODB_URI" --file mongodb/001_atlas.js`. El script 002_projection.js contiene las funciones que utilizará el proceso de sincronización. En PowerShell usa $env:DATABASE_URL y $env:MONGODB_URI al invocar estos comandos.

## Si ya instalaste la primera entrega

Usa la misma base PostgreSQL y ejecuta únicamente postgresql/004_estadisticas_planes.sql una vez. Conserva las tablas anteriores y recupera una vista por película y usuario con la fecha histórica disponible. La primera entrega solo guardaba una fecha por título. En Atlas siguen vigentes la colección y los índices originales.

## Qué conecta el backend

- PostgreSQL conserva cuentas, perfiles, seguimiento, listas, notas, críticas, invitaciones, votos por pareja, descartes de la ruleta, confirmaciones, historial y privacidad. En viewing_stats se consultan semanas (desde lunes), meses y años en horario de Ciudad de México. Un periodo sin filas equivale a cero. annual_badges devuelve las insignias de los años cerrados. El aro mensual y los efectos se pintan en el frontend usando el rango.
- MongoDB Atlas sirve la actividad pública de calificaciones. Cada documento agrupa autor, título, nota, crítica, spoiler y fecha de publicación. PostgreSQL escribe activity_outbox junto con el cambio de nota. Un proceso de backend debe enviar los eventos a Atlas, como explica ENTREGA.md. Las vistas personales y las confirmaciones del plan no se publican en ese feed. Una reseña publicada sí conserva su fecha de publicación.
- «Dónde verla en México» se obtiene de TMDb, consultando movie/{id}/watch/providers o tv/{id}/watch/providers. Usar results.MX.flatrate para suscripción y results.MX.rent para renta. Mostrar atribución a JustWatch y usar results.MX.link como enlace de disponibilidad.

## Reglas para integrar las pantallas

Tomar el usuario de la sesión de servidor. Usar consultas parametrizadas con esquema cinepollis. El cliente no debe tener acceso SQL directo ni elegir usuario o fecha al registrar vistas.

- «Ya vi» establece el estado si aún no está vista. «Volví a verla» registra otra fecha. Para ambas escrituras llamar a record_movie(usuario,titulo) dentro de la transacción de la API. La clave (usuario,título,día) evita duplicados. Para deshacer llamar a undo_movie_today(usuario,titulo). Nunca borrar entries para desmarcar una película: también contiene su crítica. Una vista compartida protegida o una única vista calificada produce un error que debe explicar la interfaz.
- Leer los totales públicos en viewing_stats. Para las barras diarias agrupar movie_views por day y devolver solo los conteos. Para títulos y fechas pasar el usuario de sesión (NULL para visitantes) a viewing_history y usar un intervalo con final excluido. Respetar users.public_history también en otras respuestas del perfil y en listados públicos. La crítica pública y el historial de visualización son datos distintos.
- Invitación, votación y sorteo son operaciones del backend. En una transacción bloquear el plan con SELECT FOR UPDATE, comprobar que el actor participa y limitar cada transición a su estado válido. Para crear una invitación debe existir alguna coincidencia en plan_candidates. En cada sorteo elegir únicamente coincidencias del tipo y pareja acordados, excluyendo passed_titles. Al rechazar guardar el descarte, limpiar ambos votos y sortear otra opción. Si no quedan opciones, usar exhausted. Al aceptar el segundo voto, volver a verificar ambos registros de lista bajo bloqueo antes de cambiar a agreed. La BD restringe a un plan abierto por pareja y tipo.
- Para confirmar una película llamar a record_movie(usuario,titulo,plan). Suma la vista individual inmediatamente y completa el plan tras la segunda confirmación. Si uno se arrepiente hoy y sigue pendiente, llamar a undo_movie_today(usuario,titulo,plan). Mostrar el marco y el acompañante solo para planes completos. Para confirmar una serie, el backend actualiza sender_seen/recipient_seen bajo el bloqueo del plan y lo completa al confirmar ambos; las series no suman al rango de películas.
- Usar updated_at=now() al modificar invitaciones o votos y ordenar por updated_at descendente. Para rangos e insignias consultar solo el historial por película. Las fechas anteriores se conservan a través de la migración; las nuevas vistas se registran con la fecha del servidor.
- Antes de desplegar conectar el backend, configurar credenciales de ambos servicios y probar sobre una copia del esquema instalado. Este paquete entrega los scripts de datos, no incluye cuentas de servidor ni el proceso worker en ejecución.

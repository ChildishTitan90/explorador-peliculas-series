# Cinepollis: entrega para el compañero de backend

## Qué ejecutar
1. Crear una base PostgreSQL vacía y ejecutar `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgresql/001_schema.sql`.
2. Opcional, solo en desarrollo: `002_demo.sql`. No es idempotente; no repetir sobre producción.
3. Ejecutar `mongosh "$MONGODB_URI" --file mongodb/001_atlas.js` en Atlas.
4. `003_queries.sql` contiene consultas parametrizadas para el backend, no otra migración.
5. `002_projection.js` contiene la operación de proyección para el worker, no un servidor completo.

PostgreSQL es la fuente de verdad: identidad Google, perfiles, seguidores, listas y notas. MongoDB guarda documentos desnormalizados del feed, reconstruibles desde SQL. No mantener dos versiones independientes de una nota. Atlas aloja MongoDB, no estas tablas PostgreSQL.

## Reglas resueltas
- Puntuación 0–5 en pasos de 0,5; `NULL` significa sin nota, cero es una nota válida.
- Solo películas y episodios tienen notas directas. Las series pueden estar en favoritos o pendientes.
- Temporada / serie: promedio de episodios calificados por esa persona, sin contar episodios sin nota como cero. La serie usa todos los episodios calificados, ponderados por episodio; no promedio simple de temporadas de distinto tamaño.
- El promedio del perfil mezcla notas de películas y episodios una sola vez. Las series derivadas no se vuelven a contar. Cantidades de vistas separadas: películas y episodios.
- Calificar marca visto y retira de pendientes. Cambiar una nota actualiza la misma entrada. Quitarla conserva el visto y quita su crítica. Una nueva nota sobre esa entrada conserva su primera fecha de publicación.
- Seguimiento inmediato, sin solicitudes; no se permite seguirse a uno mismo. Perfiles y listas públicos; datos de autenticación privados.
- Las críticas son el texto opcional de una nota, con bandera spoiler; no son comentarios a publicaciones. Reacciones y conversaciones quedan fuera.

## Sincronización fiable
Una escritura SQL genera activity_outbox en la MISMA transacción. Un worker procesa filas pendientes por version, aplica la proyección idempotente de Mongo y SOLO después marca processed_at. Reintentar si Mongo falla. No hay transacción distribuida: el feed es eventualmente consistente. Procesar por entry_id en orden / un worker al inicio. Los borrados se guardan como visible=false (tombstone); no borrarlos físicamente, evitan resucitar eventos antiguos. Los campos sourceVersion de Mongo son BSON Long; enviar version como cadena desde SQL. En cascadas de borrado de cuentas conservar los eventos y no publicar campos de identidad ausentes.

Para seguir a alguien, leer follows en SQL y pasar sus UUID a recentActivity(ids). El feed general usa recentActivity(). Cada sección tiene su endpoint con paginación por publishedAt + _id. No cambiar publishedAt al editar. Una actualización del perfil exige refrescar el snapshot actor de sus documentos o resolver el actor actual con SQL al leer. No exponer google_sub.

## API que deben implementar
`GET /auth/google`, callback Google verificado por el servidor (state, nonce, issuer, audience, exp); sesión HttpOnly/Secure; `POST /auth/logout`; `GET /me`; `PATCH /me`; `GET /users/:username`; `GET /users/:username/{followers,following,entries}`; `PUT/DELETE /users/:id/follow`; `PUT/DELETE /ratings/:kind/:tmdbId` (movie o episode); `GET /titles/:kind/:tmdbId/ratings`; `GET /activity?scope=all|following&cursor=...`.

El servidor toma user_id de la sesión, valida permisos y el título/episodio contra TMDb. No aceptar usuario, promedios, fechas o nota fuera de rango enviados por el cliente. No conectar React directamente a Atlas ni poner DATABASE_URL, MONGODB_URI o secretos Google en variables VITE_. Usar consultas SQL parametrizadas. No guardar contraseñas Google ni tokens OAuth en estas tablas. Definir usuario con rol de aplicación y rol separado para migraciones.

## Estado de la entrega
Son scripts y contratos, no bases desplegadas ni inicio de sesión de producción. Las nuevas pantallas usarán datos ficticios identificados como demostración hasta que el equipo conecte la API. Mantener `src/services/movieService.js` del equipo intacto.

Documentación primaria: https://www.postgresql.org/docs/current/ddl-constraints.html y https://www.mongodb.com/docs/manual/core/schema-validation/specify-json-schema/.

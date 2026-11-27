# Encargo de backend · Acceso con correo y contraseña

Implementa el registro, inicio de sesión, consulta de sesión y cierre de sesión de Cinepollis. Pablo se encarga de las pantallas de React. El primer entregable es una API que se pueda probar con dos cuentas en PostgreSQL local.

## Punto de partida

- Crea tu rama de desarrollo desde el develop actualizado. Revisa primero si el equipo ya eligió un servidor o framework y reutilízalo.
- Las migraciones y la guía están en la rama feature/base-datos-v3, carpeta database/. Consulta LEEME-PRIMERO.md. Para una base local vacía, ejecuta 001_schema.sql, 004_estadisticas_planes.sql y 005_acceso_correo.sql en ese orden. Si ya están instaladas, usa el esquema existente.
- La autenticación usa PostgreSQL. Puedes trabajar en local aunque el servidor compartido esté pendiente. MongoDB se utiliza para el feed de actividad.
- Las pantallas preparadas por Pablo usan las rutas relativas /api/auth/login y /api/auth/register, JSON y cookies del mismo origen. Acuerda un proxy local de /api hacia tu servidor si React y el backend corren en puertos distintos.

## Contrato de esta entrega

| Ruta | Entrada | Resultado esperado |
|---|---|---|
| POST /api/auth/register | JSON con display_name, username, email, password | 201 con JSON de perfil e inicio de sesión mediante cookie. 409 si el correo o usuario ya existe. |
| POST /api/auth/login | JSON con email, password | 200 con JSON de perfil y cookie. 401 con mensaje genérico si los datos son incorrectos. |
| GET /api/auth/me | Cookie de sesión | 200 con JSON de perfil. 401 si la sesión falta, venció o fue revocada. |
| POST /api/auth/logout | Cookie de sesión | Revoca la sesión actual, expira su cookie y devuelve 204. |

Formato acordable para el perfil devuelto por registro, login y me:

```json
{"user":{"id":"<uuid>","username":"ana","display_name":"Ana","avatar_url":null}}
```

Las pantallas ya distinguen 401 y 409. Para validaciones inválidas, usa 400 y devuelve un error JSON con código estable y mensaje en español. Comparte con Pablo ejemplos de éxito y error antes de terminar la implementación.

## Integración con PostgreSQL

- Usa cinepollis.users y cinepollis.login_sessions. Valida los campos en el servidor, normaliza el correo y aplica la comparación por lower(email) del esquema. username permite 3 a 24 letras minúsculas, números o guiones bajos. Controla conflictos de unicidad también cuando coincidan dos solicitudes.
- Genera password_hash con Argon2id. Usa consultas parametrizadas y devuelve únicamente los campos públicos indicados arriba.
- Genera un token aleatorio de sesión de alta entropía. La cookie lleva el token y PostgreSQL guarda su digest SHA-256 en token_hash, junto con user_id y expires_at. Valida la expiración al leer la sesión. Usa HttpOnly, SameSite y Secure en producción HTTPS. Aplica límites a intentos repetidos de autenticación.
- Obtén el usuario de la cookie. El correo puede seguir pendiente de verificación en esta entrega. La recuperación y el envío de enlaces se implementarán posteriormente.
- Configura la conexión mediante variables de entorno del servidor. En el PR documenta sus nombres con valores ficticios y cómo arrancar el backend.

## Prueba de aceptación

1. Registrar dos usuarios. Verificar sus UUID con /me y comprobar que duplicar el correo, incluso cambiando mayúsculas, devuelve 409.
2. Iniciar sesión desde dos perfiles de navegador distintos. Al recargar, /me sigue devolviendo a la persona correspondiente.
3. Probar una contraseña incorrecta y comprobar el 401. Cerrar una sesión, comprobar que su cookie anterior ya no sirve y que la otra cuenta sigue conectada.
4. Probar el envío desde las pantallas con Pablo. Entregar el PR hacia develop con el comando de arranque y los resultados de estas pruebas.

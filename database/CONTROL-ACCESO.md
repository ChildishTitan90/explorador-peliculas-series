# Reglas de acceso de Cinepollis

Cinco contraseñas incorrectas consecutivas bloquean nuevos inicios de sesión de
esa cuenta durante 15 minutos. Los intentos durante el bloqueo no lo prolongan.
Al terminar, la siguiente contraseña incorrecta inicia un contador nuevo.
Una contraseña correcta reinicia el contador si la cuenta está desbloqueada.
El bloqueo de nuevos accesos conserva la sesión que ya estuviera abierta.

Cada cuenta admite una sesión. Si la anterior tiene actividad en los últimos
cinco minutos y sigue vigente, se rechaza el nuevo acceso. Si está vencida o
inactiva, se reemplaza y su token anterior deja de ser válido.

## Instalación

Se copiaron del paquete v3 de Pablo los archivos 004 y 005.
En una base nueva ejecutar 001, 004, 005, 006 y 007 en ese orden, una sola vez,
con detención ante errores. El archivo 002 es opcional con datos ficticios.
El archivo 003 contiene ejemplos de consultas parametrizadas.
En una base existente ejecutar solo las migraciones pendientes.

006 se ejecuta dentro de una transacción. Si hay varias sesiones por usuario,
su restricción única falla y revierte la migración. Cerrar las sesiones de esas
cuentas desde el servidor antes de volver a ejecutarla.

## Conexión que debe implementar el servidor

1. Validar el CAPTCHA con su proveedor desde el servidor. El frontend envía su
   respuesta junto con el formulario. El proveedor y sus credenciales quedan
   pendientes de elegir.
2. Buscar el correo sin distinguir mayúsculas. Dar una respuesta genérica si
   la cuenta no existe o la contraseña falla.
3. Abrir una transacción y leer la cuenta con SELECT ... FOR UPDATE.
   Comprobar login_blocked_until antes de verificar la contraseña con Argon2id.
   Mantener ese bloqueo hasta guardar el resultado evita carreras entre
   solicitudes y cambios de contraseña.
4. Si falla la contraseña, llamar register_login_failure(user_id) y hacer
   COMMIT para conservar el contador, incluso al responder con un error de login.
5. Si es correcta, generar un token aleatorio, guardar su digest SHA-256 con
   start_login_session(user_id, digest, expires_at) y hacer COMMIT.
   El servidor define la duración de la sesión. Entregar la cookie HttpOnly
   y Secure únicamente si el resultado es created. blocked devuelve la fecha
   hasta la que debe esperar. session_active rechaza el nuevo acceso sin
   reemplazar la sesión anterior.
6. En cada solicitud protegida llamar touch_login_session(digest). Si devuelve
   NULL, pedir un nuevo acceso. Si devuelve un usuario, usar ese ID para permisos.
   Confirmar la transacción antes de enviar la respuesta.
7. Mientras la persona use activamente la página, enviar una confirmación de
   actividad como máximo una vez por minuto. Detenerla al ocultar la pestaña
   o tras cinco minutos sin interacción. Así una pestaña abandonada permite
   iniciar sesión en otro dispositivo.
8. Cerrar sesión eliminando el digest correspondiente. La recuperación de
   contraseña debe borrar las sesiones del usuario en la misma transacción.

Conceder al rol privado del servidor acceso a estas funciones y a las tablas
necesarias. Las funciones nuevas tienen ejecución pública revocada.
Mantener las tablas de autenticación fuera de los esquemas expuestos por la API
de Supabase. Las credenciales de base de datos pertenecen al servidor.
Agregar también límites de solicitudes por origen en el servidor para proteger
cuentas inexistentes y evitar que las verificaciones consuman recursos sin límite.

Estos archivos preparan la base. El login, la actividad de la página y el CAPTCHA
requieren la implementación del servidor y su conexión con React.

## Instalación en Supabase del 26 de noviembre de 2026

Proyecto cinepollis, referencia ahwnpazumwfmymopaisc. Se instalaron 001, 004,
005 y 006 desde SQL Editor. Las diez tablas tienen RLS habilitado, como
recoge 007. Hay seis vistas y cero usuarios guardados. La protección automática
del editor falló al resolver nombres sin esquema después de 004; se aplicó
la protección con nombres completos y se verificó en pg_tables.

Las pruebas transaccionales comprobaron cinco fallos, bloqueo de 15 minutos,
ausencia de extensión del bloqueo, reinicio del contador, rechazo de otra sesión
activa, reemplazo de una inactiva e invalidación de tokens anteriores y vencidos.
Se corrigió la variable reservada session_user a session_account_id en 006.
Los datos temporales de prueba se revirtieron.

RLS está habilitado sin políticas para acceso directo del cliente. La conexión
del servidor y su rol privado todavía deben configurarse. El login usa las
tablas propias del esquema cinepollis; no se configuró Supabase Auth.

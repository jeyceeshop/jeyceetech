# Activar administración y seguimiento de Jey Cee

El código incluye un portal real con almacenamiento en Supabase. La demo `/admin/demo` utiliza exclusivamente datos ficticios en memoria, no necesita contraseña, no envía correos y borra sus cambios al recargar. No concede acceso al portal real.

## 1. Preparar la base de datos

En un proyecto Supabase controlado por Jey Cee, abre **SQL Editor** y ejecuta **todo** [database/portal.sql](../database/portal.sql). Crea tablas privadas de solicitudes, mensajes y límites de intentos, además de las funciones de escritura atómica. Las tablas y funciones no permiten acceso con las claves públicas `anon` ni con usuarios `authenticated`; solo las funciones del servidor usan `service_role`.

Puedes reutilizar el proyecto de las reseñas. No elimina ni modifica sus datos. Configura copias de seguridad y limita el acceso al proyecto a las personas responsables de la agencia.

## 2. Configurar Vercel

En **Settings → Environment Variables**, configura estas variables para el entorno que quieras activar:

| Variable | Valor |
| --- | --- |
| `SUPABASE_URL` | URL HTTPS de tu proyecto Supabase, sin rutas adicionales. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta del servidor con rol `service_role`. |
| `ADMIN_PASSWORD` | Tu contraseña de administración: mínimo 12 caracteres, larga y exclusiva. |
| `ADMIN_SESSION_SECRET` | Otra clave aleatoria de al menos 32 caracteres. Puedes generarla con `openssl rand -hex 32`. |
| `PUBLIC_SITE_URL` | `https://jeycee-tech.vercel.app` o el dominio HTTPS oficial que utilices. |
| `PORTAL_ENABLED` | `true`, **después de ejecutar el SQL**. |

Conserva `SMTP_USER` y `SMTP_PASS` ya configurados. Las notificaciones y respuestas usan el mismo servicio SMTP. No compartas contraseñas o claves en el chat y no uses prefijos `VITE_`: esas variables nunca deben publicarse en el navegador. Usa valores distintos en entornos de prueba y producción.

Haz **Redeploy** para que Vercel aplique las variables. El repositorio mantiene el portal desactivado por defecto: mientras `PORTAL_ENABLED` no sea `true`, los formularios conservan el envío por correo actual. Si habilitas el portal con una base incompleta, las nuevas solicitudes fallan de forma explícita y conservan el formulario; no se muestra un pedido guardado ficticio.

## 3. Comprobar el flujo completo

1. Abre `/admin` e inicia sesión con tu contraseña. La sesión dura hasta 8 horas; puedes cerrarla desde el portal. Cambiar la contraseña o `ADMIN_SESSION_SECRET` invalida las sesiones anteriores.
2. Crea un pedido de prueba desde un plan de la web, usando datos propios. Guarda el número y el enlace/clave de seguimiento que aparecen al finalizar. Si indicaste correo, se intenta enviar allí también el acceso.
3. Abre `/seguimiento` en otro navegador y usa número + clave. El número solo no permite consultar el registro.
4. En `/admin`, filtra por pedidos/tickets, abre el registro y actualiza estado, responsable o fecha objetivo. Los estados se cambian manualmente y no verifican pagos.
5. Envía una respuesta pública y una nota interna. Confirma que la respuesta aparece en Seguimiento y que la nota interna solo aparece en administración. La fecha objetivo es visible al cliente; el responsable interno no.
6. Responde como cliente desde Seguimiento y comprueba el mensaje en la bandeja del equipo. La bandeja se actualiza con el botón **Actualizar bandeja**; no hay notificaciones push ni sincronización automática en tiempo real.
7. Si activas **Notificar por correo**, revisa el resultado de la notificación y el buzón. La escritura en el portal se conserva aunque SMTP falle; la interfaz distingue ese caso y no invita a repetir una respuesta ya guardada.

## Qué se puede gestionar

- Bandeja con búsqueda, filtros por tipo/estado, métricas y paginación de 50 registros.
- Brief original, datos de contacto, plan, base estimada, cupón y referencia de un proyecto previo cuando el cliente la indicó.
- Estado: Solicitud recibida, Confirmado, En proceso, Esperando al cliente, En revisión, Finalizado y Cancelado.
- Responsable interno, fecha objetivo y actualizaciones públicas.
- Respuestas públicas, notas internas y últimos 200 mensajes por conversación.
- Notificaciones opcionales por correo; si el pedido no tiene email, se responde desde Seguimiento o se abre WhatsApp para coordinar manualmente.
- Renovación de una clave de seguimiento perdida. La clave anterior se invalida y la nueva se muestra una sola vez; puede enviarse al correo que ya figura en la solicitud. Verifica la identidad del cliente antes de compartirla.

La contraseña es un único acceso de la agencia: no hay cuentas por empleado, permisos diferenciados, edición del catálogo, facturación fiscal, cobros automáticos ni importación de bandejas de correo. Los estados no equivalen a pago verificado. No se envían mensajes de WhatsApp automáticamente.

## Pedidos y consultas anteriores

Las solicitudes previas a la activación se enviaban solo por correo y no tienen registro central ni clave privada. No se importan ni se les atribuye un estado automáticamente. El equipo debe consultarlas en los buzones existentes; si necesitas incorporarlas masivamente será necesaria una importación específica. Indica a esos clientes que contacten al equipo con su referencia.

## Correo e historial

Los pedidos nuevos siguen notificándose a `business@jeycee.shop`. Los tickets mantienen el alias que corresponde a su motivo: soporte, facturación, ventas, RRHH, etc. El cliente recibe una confirmación con acceso privado si indicó email y SMTP acepta el envío.

Las respuestas y estados del administrador se guardan primero. La casilla de correo es una notificación adicional y muestra si falló. Los correos recibidos o respondidos fuera del portal **no se importan** al historial. Registra en el portal las respuestas y acuerdos que quieras que vea el cliente.

## Protección y operación

La sesión de administración usa cookie HttpOnly, SameSite Strict y Secure en producción, con firma del servidor. Las operaciones de escritura verifican el origen. El login y las consultas públicas tienen límites de intentos persistentes en PostgreSQL; si la base falla, el acceso no omite esa protección.

Las claves de seguimiento se verifican mediante SHA-256 y son de alta entropía. En los enlaces se transportan en el fragmento `#`, que el navegador no envía al servidor al solicitar la página; Seguimiento elimina ese fragmento de la barra al cargar. Las consultas se hacen por POST y no se guardan las claves en localStorage, sessionStorage ni en el estado del historial. El usuario debe guardar su acceso antes de salir. Los enlaces de seguimiento siguen siendo credenciales privadas: quien los tenga puede ver la conversación y escribir en ella.

Se usa versión de registro para evitar sobrescribir cambios de otra pestaña. Los formularios tienen identificadores de envío estables durante el intento, y la base evita duplicar la misma solicitud o mensaje por un reintento. El contenido se muestra como texto, sin ejecutar HTML de clientes o administradores.

No incluyas datos sensibles en notas o respuestas. Mantén una política de conservación y atiende solicitudes de acceso/eliminación de datos desde `hello@jeycee.shop`. Las solicitudes públicas solo devuelven servicio, plan, estado, fechas y mensajes públicos; no devuelven datos de contacto, brief original ni notas internas.

## Validación realizada

Pruebas automatizadas de autenticación, expiración/revocación, cookies, origen, límites, separación público/privado, estados, errores SMTP, captura idempotente y rutas de correo. Migración y funciones verificadas en PostgreSQL local mediante PGlite, sin credenciales de producción. Los flujos visuales se revisan con navegador local y datos de prueba. La activación y una prueba con tus buzones reales siguen requiriendo la configuración de Vercel y Supabase descrita arriba.

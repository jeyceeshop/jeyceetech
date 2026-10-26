# Cotizaciones y editor en administración

## Activación en la web existente

1. Abre tu proyecto Supabase → **SQL Editor → New query**.
2. Copia **todo** [database/admin-proposals-content.sql](../database/admin-proposals-content.sql) y pulsa **Run**. Es una actualización del portal actual: conserva pedidos, tickets, mensajes, firmas y numeración. Se puede repetir sin reiniciar contadores.
3. Espera el despliegue de `main` en Vercel y abre **https://www.jeycee.shop/admin** con tu contraseña habitual.

No necesitas otra contraseña ni nuevas variables. Se utilizan la base, la sesión y el correo SMTP que ya tiene el portal. En instalaciones nuevas, `database/portal.sql` ya incluye esta actualización. Si faltan las nuevas tablas, la web conserva el catálogo inicial y el editor indica cómo activarlo; los pedidos siguen funcionando.

## Preparar y enviar una cotización

En **Pedidos y tickets**, completa tu nombre y cargo, selecciona una solicitud y baja a **Cotizaciones → Nueva propuesta**. Para un contacto nuevo, primero debe existir su pedido o ticket.

Añade título, resumen, entregables con cantidades y precios unitarios en USD, impuesto si corresponde (inicia en 0%), plazo, vigencia y condiciones de pago/revisión. **Guardar borrador** asigna un número `COT-0001`, independiente del número `JC-0001` de la solicitud. El total se calcula en el servidor usando centavos. La propuesta conserva una copia del contenido y del contacto; los cambios posteriores de precios no modifican acuerdos anteriores.

Revisa el borrador y pulsa **Enviar al cliente**. Esta acción publica la propuesta en Seguimiento y envía un correo HTML con entregables, importes, plazo, condiciones y enlace para responder. El remitente es el buzón SMTP de la agencia; las respuestas van a **business@jeycee.shop**. El destinatario es exclusivamente el correo de la solicitud. Si no se indicó correo, utiliza **Compartir por WhatsApp** para abrir un mensaje al teléfono registrado; la web no envía mensajes de WhatsApp automáticamente.

Si SMTP falla, la propuesta sigue publicada y el panel informa del fallo. **Reenviar correo** reintenta la notificación sin crear otra propuesta. Un correo aceptado por SMTP no garantiza lectura o entrega en la bandeja principal.

## Respuesta del cliente

El cliente abre **Seguimiento**, indica su número y confirma el correo o teléfono completo que ya proporcionó. No se crea una clave privada. Con el número solo se muestra el estado, sin documentos ni precios de cotizaciones. Las propuestas nunca se incluyen en el catálogo público.

Podrá revisar el desglose y:

- **Aceptar:** indicar su nombre, marcar que leyó y acepta esta versión y responder el antispam.
- **Solicitar ajustes:** indicar su nombre, explicar los cambios y responder el antispam.

La respuesta queda registrada en el historial y en la propuesta. Si la solicitud estaba recién recibida, una aceptación pasa su estado a Confirmado. Las actualizaciones de estado y respuestas del equipo continúan funcionando como antes. Las respuestas a la cotización se consultan en el panel; no se envía automáticamente otro correo al equipo.

Una propuesta enviada no se edita. Para cambiarla, prepara otro borrador: al enviarlo, la propuesta pendiente anterior queda sustituida. Las propuestas retiradas, sustituidas o vencidas no se pueden aceptar. La vigencia termina en la fecha indicada a las 23:59:59 de Panamá. Una propuesta aceptada se conserva sin edición ni retiro; no se pueden crear nuevos acuerdos sobre esa misma solicitud. Un trabajo adicional requiere otra solicitud.

La aceptación es un registro de conformidad; no verifica un pago ni emite una factura fiscal. El pago continúa siendo manual por **Yappy 6827-4965**, coordinado exclusivamente por **WhatsApp +507 6091-3544** o correos **@jeycee.shop**. No solicites claves, códigos, datos de tarjetas o documentos privados.

## Editar la web

En `/admin`, abre **Editar contenido**. Selecciona una sección, cambia sus campos y pulsa **Publicar cambios**:

- **Servicios y precios:** 21 servicios; nombre, descripción, qué es, proceso, requisitos del cliente, resultados, exclusiones, periodo de cobro, título/descripción SEO y los cuatro planes. Cada plan tiene precio base, entregables y exclusiones. Un precio vacío significa a cotización.
- **Presentación de planes:** textos de Básico, Pro, VIP y Business y plan destacado.
- **Página de inicio:** título, segunda línea, frase destacada y presentación.
- **Quiénes somos:** presentación, misión y visión.
- **Vacantes:** crear, editar, cerrar, reabrir o eliminar; funciones, requisitos, estándares y documentación para aplicar. Solo las abiertas aparecen en Trabaja con nosotros; las postulaciones siguen dirigidas a RRHH.

Se admite texto sin HTML. La promoción temporal existente se aplica al precio base de desarrollo web y diseño gráfico: no introduzcas un precio ya rebajado si quieres conservar ese descuento automático.

Publicar actualiza el contenido central, las páginas públicas y los cálculos de pedidos nuevos, sin editar Git ni hacer otro despliegue. Cada sección se publica de forma conjunta. Una edición simultánea rechaza la versión antigua; el formulario conserva tus cambios y permite recargar la versión vigente. La base archiva las versiones anteriores en `site_content_history`; la recuperación de ese historial es una operación técnica, todavía no un botón del editor.

Si un cliente estaba preparando un brief cuando publicaste cambios, el servidor detecta la versión antigua. La web actualiza el resumen y pide revisar precio y entregables antes de reintentar, conservando lo escrito. Los pedidos y cotizaciones ya guardados mantienen sus importes originales.

## Funcionamiento y verificación técnica

Las páginas públicas se renderizan en Vercel desde una instantánea validada del contenido publicado. El HTML inicial contiene los textos, precios y metadatos actuales, también para visitantes sin JavaScript y buscadores. No depende de una recarga del catálogo después del renderizado para actualizar SEO. Las rutas públicas exactas se reescriben a `/api/site`; las rutas desconocidas conservan un 404 real. Las rutas privadas mantienen `noindex`.

`npm run build` genera y audita los 43 documentos, guarda la plantilla compilada para la función y, dentro de Vercel (`VERCEL`), elimina sus 33 copias públicas estáticas para evitar que `cleanUrls` entregue un catálogo desactualizado. Las páginas privadas y los activos siguen siendo estáticos; el checkout consulta la instantánea vigente antes de inicializar el brief. Las páginas públicas usan `Cache-Control: no-store` para que una publicación se refleje en la siguiente carga. Sin conexión a la base no se aceptan pedidos con precios potencialmente antiguos.

Las tablas y funciones nuevas están restringidas a `service_role`, con RLS y permisos revocados para `anon` y `authenticated`. La edición requiere sesión de administrador y origen de la web; las cotizaciones tienen versiones y operaciones transaccionales para resolver aceptación/envío/retiro simultáneos. El HTML público solo incluye el catálogo, nunca contactos, propuestas o credenciales.

`npm test` incluye PostgreSQL local con PGlite para comprobar instalación y repetición del SQL, publicación simultánea, permisos, cotizaciones, caducidad, privacidad, aceptación, correo fallido y precios calculados desde el servidor. Las pruebas no llaman a Supabase ni envían correos reales.

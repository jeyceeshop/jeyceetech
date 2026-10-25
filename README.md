# JeyCee Tech

Sitio en español para una agencia creativa. Vite + HTML, CSS y JavaScript, con función Vercel opcional para reseñas.

## Desarrollo

Requiere Node.js 22.12+ o 24.

```sh
npm ci
npm run dev -- --port 5173
```

## Producción

```sh
npm run build
npm run preview -- --port 4173
```

Publicar `dist/` en un alojamiento estático. La navegación, menú móvil, 21 páginas de servicios y descarga de brief funcionan sin servicios externos. Contáctanos envía directamente mediante la función SMTP de Vercel, sujeta a configurar las credenciales. El brief del checkout abre una solicitud por WhatsApp con mensaje preparado.

El símbolo SVG es una recreación vectorial de la referencia aportada; reemplazar `public/mark.svg` por el archivo oficial cuando esté disponible. Imagen de portada original generada para este diseño. No se incluyen reseñas, cifras ni clientes inventados. Las fuentes de Google son opcionales y tienen alternativas locales.

## Catálogo y páginas

- `/servicios`: catálogo; 21 páginas en `/servicios/<slug>` con definición detallada, metodología, resultados esperados, requisitos y cuatro planes con entregables específicos.
- `/planes`: Básico, Pro, VIP y Business. Básico, Pro y VIP tienen precios por servicio. Business se cotiza mediante Contactar a business@jeycee.shop.
- `/checkout?plan=productos-digitales--vip`: selección de plan/servicio y preparación de solicitud. El resumen no acredita pago ni es factura fiscal.
- `/quienes-somos`, `/facturacion`, `/soporte`, `/resenas`, `/preguntas-frecuentes`, `/terminos`, `/privacidad`.

Los datos generales y niveles se editan en `src/catalog.js`; las descripciones ampliadas y los 84 alcances en `src/premium.js`. Los 63 precios y 21 valores Business a cotización se centralizan en `src/pricing.js`. Cada nivel describe su propio alcance, sin sumar automáticamente los niveles anteriores. Los botones Contactar abren un mailto a business@jeycee.shop con el servicio y nivel seleccionados; el visitante debe confirmar el envío. Los plazos y el alcance se confirman por proyecto. Se muestra el precio base de cada plan en el servicio, el selector de solicitud y el resumen descargable; Business muestra «A cotización». Impuestos aplicables, extras y costos de terceros se confirman antes de contratar. En el inicio y las tarjetas generales, «Desde» es el mínimo del nivel entre los servicios; no promete el mismo precio para todas las especialidades. Falta razón social y RUC/DV del emisor para completar la información fiscal.

La navegación principal contiene Quiénes somos, Servicios (mega menú), Planes premium, Reseñas y el botón Contáctanos. Facturación permanece accesible en el pie de página. El menú se colapsa hasta 1024px y permite cierre con Escape, clic fuera y selección de enlace. La paleta usa naranja melocotón pastel con fondos cálidos y la imagen principal se armoniza mediante un filtro CSS, conservando el archivo original.

## Contacto y Yappy

Ventas y cotizaciones: `business@jeycee.shop`. Soporte: `support@jeycee.shop`. Privacidad y contacto general: `hello@jeycee.shop`. Yappy: `6827-4965`. Contáctanos utiliza la función SMTP de Vercel cuando está configurada. El brief del checkout abre WhatsApp; las postulaciones conservan sus enlaces de correo manuales. Con `PORTAL_ENABLED=true`, pedidos y tickets se registran en Supabase siguiendo la guía del portal al final de este documento; en modo correo no se crea un registro central. El flujo Yappy es manual: confirmar beneficiario, alcance y monto final antes de transferir; la agencia verifica el pago. No hay integración comercial/API de Yappy, lectura bancaria, captura de tarjetas ni emisión fiscal.

## Reseñas compartidas (integración pendiente de credenciales)

En ausencia de base de datos, el modo está identificado como prueba local, no reseñas públicas ni calificación de la agencia. Las cinco estrellas son un objetivo visual y la selección inicial del formulario, no un promedio ni una calificación de clientes.

Para habilitar reseñas públicas en Vercel:

1. Crear un proyecto Supabase y ejecutar `database/reviews.sql`.
2. En las variables del proyecto Vercel, configurar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como secretos solo del servidor, nunca con prefijo VITE_. No compartir la clave en el chat ni subirla a GitHub.
3. Volver a desplegar. La función `api/reviews.js` lista solo reseñas aprobadas y recibe nuevas como `pending`.
4. Moderar desde Supabase cambiando `status` a `approved` o `rejected`. No seleccionar opiniones por su puntuación. Eliminar datos a petición del autor mediante el correo de privacidad.
5. Configurar protección de abuso/rate limiting en Vercel para tráfico público significativo. El honeypot y la validación del servidor son medidas básicas, no verificación de identidad ni de compra.

Los visitantes no escriben directamente en la tabla y RLS está habilitado sin acceso público. `service_role` se usa exclusivamente en la función de servidor. No hay dashboard de administración con autenticación en esta entrega.

Pruebas de contrato/validación de la API (sin llamar servicios reales): `node --test tests/reviews.test.js`. La conexión real a Supabase requiere configuración y no se ha verificado sin credenciales. El servidor Vite no ejecuta funciones Vercel; el modo local sigue operativo.

Vercel detecta Vite: `npm run build`, salida `dist`. `vercel.json` conserva las rutas de la aplicación y las funciones bajo `/api/`.

## Inicio ampliado y mantenimiento de precios

El inicio se construye en `src/home.js`: portada editorial, datos del catálogo, introducción al estudio, orientación por etapa de negocio, catálogo, principios de trabajo, proceso de cuatro etapas, planes, preguntas frecuentes y contacto. Las cifras de especialidades/4/1 describen servicios, niveles y visión; no son datos inventados de clientes o resultados.

Se implementó la opción de precios publicados solicitada. No hay panel administrativo ni credenciales de administrador. Para cambiar tarifas, edita el objeto `pricing` en `src/pricing.js`, conserva `business: null`, valida con `node --test tests/*.test.js` y `npm run build`, y publica el cambio mediante Git. Los precios propuestos corresponden al alcance y no se presentan como investigación de mercado verificada.

## Catálogo de agencia ampliado

21 especialidades en tres familias: diseño y marca, web y desarrollo, y marketing y crecimiento. Las 13 especialidades adicionales, alcances y tarifas se mantienen en `src/agency-services.js`; `src/catalog.js` y `src/pricing.js` las integran sin duplicar datos. Cada especialidad tiene cuatro niveles, para un total de 84 planes (63 tarifas y 21 Business a cotización).

Redes sociales, SEO, publicidad digital y mantenimiento web se cobran por mes (`cadence: 'month'`). Los demás servicios son por proyecto. El periodo se muestra en las tarjetas, tablas, selección y resumen de solicitud. No existen cargos ni renovaciones automáticas. En publicidad, la tarifa es solo gestión: la pauta se paga por separado a la plataforma.

El inicio muestra nueve servicios destacados con acceso al catálogo completo. El mega menú y el catálogo completo agrupan todos los servicios. El formulario de contacto y el selector de planes se generan desde el catálogo para mantenerlos sincronizados.

## Promoción y asesoramiento

- Desarrollo web y Diseño gráfico aparecen primero en los destacados, accesos rápidos del menú, catálogo y comparación de precios. El resto del catálogo se conserva.
- Ambos servicios tienen un 10% de descuento sobre su importe hasta el 30 de noviembre de 2026 inclusive, hora de Panamá. El límite exclusivo es `2026-12-01T05:00:00Z`. `src/offers.js` centraliza vigencia, servicios y porcentaje. Las pantallas calculan la oferta al cargar; después del límite desaparecen las etiquetas y se muestran tarifas regulares. Business incluye la oferta en la propuesta, sin inventar un importe.
- Precios originales y rebajados se muestran en tarjetas, planes, tabla y solicitud. El formateador conserva los centavos (ejemplo: diseño gráfico Básico USD 58.50, antes USD 65).
- Todas las cotizaciones son gratuitas y no requieren contratar una asesoría.
- Asesoramiento opcional: USD 20. Al adquirir un servicio, se acredita íntegramente el pago de la asesoría; no añade costo al servicio. El crédito se usa una vez por asesoría verificada; en servicios mensuales se acredita al primer periodo.
- El checkout permite solicitar el crédito mediante una casilla. El saldo es estimado, se calcula después del descuento promocional y no es comprobante de pago. La agencia debe verificar el pago de asesoría y registrar su aplicación en la propuesta para evitar usar el crédito más de una vez. Sin base de datos de pagos ni verificación bancaria, la web no afirma haber verificado el abono.
- La asesoría se solicita por correo a business@jeycee.shop; no se inventan duración, agenda ni cita confirmada.
- Pruebas: `node --test tests/*.test.js` comprueba el límite temporal en Panamá, precios, centavos y crédito posterior al descuento.

## Página de contacto y envío directo

El botón principal abre `/contacto`. «¿Cómo podemos ayudarte?» es un desplegable con diez áreas; admite `?tipo=soporte&servicio=desarrollo-web` para preselección. Al pulsar Enviar mensaje, se validan campos y antispam y se realiza un POST a `/api/contact`. No se genera un borrador para reenviar ni se abre el correo del cliente.

La función de Vercel usa SMTP con Nodemailer y TLS verificado. Asigna una referencia y usa únicamente destinatarios permitidos por el área. El remitente es el buzón autenticado y Reply-To es el cliente. En modo correo solo devuelve `sent: true` cuando SMTP acepta el destinatario; un error conserva los datos en pantalla y no muestra éxito. En modo correo no hay base de datos de tickets ni seguimiento de estados. El portal activado añade almacenamiento, seguimiento por número y un intento de confirmación al visitante; en ese modo la respuesta exitosa indica que el registro quedó guardado, aunque SMTP falle.

### Configuración obligatoria en Vercel

En Settings → Environment Variables del proyecto:

- `SMTP_USER=hello@jeycee.shop` (buzón real de Namecheap, no un alias con contraseña distinta).
- `SMTP_PASS`: contraseña SMTP/contraseña del buzón, introducida como secreto. No compartir por chat ni subir al repositorio.
- Opcionales: `SMTP_HOST=mail.privateemail.com`, `SMTP_PORT=465` (valores predeterminados). También se admite 587 con STARTTLS obligatorio.
- Opcional: `ANTISPAM_SECRET` para una clave de firma independiente. Sin ella, se usa un contexto separado derivado de SMTP_PASS.

Configurar en los entornos de Vercel que correspondan y volver a desplegar. Nunca prefijar secretos con VITE_. La función necesita conectividad a SMTP. El servidor Vite no ejecuta funciones Vercel; para probar integración real se necesita Vercel o su runtime de desarrollo con variables de servidor.

GET `/api/contact` entrega una pregunta firmada, con caducidad de diez minutos. POST valida consentimiento, campos, destinatario, honeypot y firma/respuesta antispam antes de enviar. La protección de reutilización es por instancia de función, no distribuida. La página no expone credenciales ni usa SMTP en el navegador. No registra el cuerpo del mensaje ni guarda CV/datos en una base de tickets. Los mensajes se conservan en el buzón del destinatario para responder y dar seguimiento.

Sin SMTP configurado, el endpoint devuelve 503 y la interfaz explica que el envío no está disponible; nunca finge entregar. Las pruebas automáticas simulan SMTP y verifican fallos, destinatarios, Reply-To, privacidad y antispam. La entrega real no fue validada durante esta sesión porque las credenciales no están disponibles en el entorno.

## Contacto unificado y marca

El menú y el pie de página usan únicamente Contáctanos como acceso a consultas. Soporte se selecciona dentro de `/contacto?tipo=soporte`; facturación utiliza `/contacto?tipo=facturacion`. La antigua ruta `/soporte` redirige al contacto unificado; el servidor de desarrollo también conserva esa compatibilidad. La página y formulario de soporte separados se eliminaron. En el encabezado y pie, la marca muestra solo el símbolo y JEY CEE, sin Tech.

## Distribución de alias de correo

Configuración central: `src/email-routing.js`. Cotización y asesoría → business@jeycee.shop; marketing y campañas → mercadeo@jeycee.shop; pedidos, pagos y facturación (desde Contáctanos) → orders@jeycee.shop; soporte → support@jeycee.shop; atención VIP y botones de planes VIP → vip@jeycee.shop; colaboraciones → collabs@jeycee.shop; empleo → rrhh@jeycee.shop; gerencia → gerencia@jeycee.shop; general y privacidad → hello@jeycee.shop. Los correos personales angeline y julian quedan fuera de los formularios públicos. Se retiró el alias anterior de ventas de los destinatarios de la web.

Contáctanos envía por SMTP al destinatario según el área cuando está configurado; el checkout y las postulaciones conservan sus enlaces de correo manuales. La aceptación por SMTP no equivale a confirmación de lectura. Los alias fueron proporcionados por el propietario; no se probó entrega real ni se modificó Namecheap. Si pertenecen al buzón hello, normalmente se recibirán en esa misma bandeja. Las reglas de carpetas o buzones independientes se configuran en el proveedor; la web no los crea.

## Trabaja con nosotros

El inicio incluye, al final, las tarjetas de Asistente de mercadeo y Telemarketing. El pie enlaza a `/trabaja-con-nosotros`, con ambas vacantes, funciones, requisitos, estándares de excelencia y proceso de postulación. Datos y plantillas en `src/careers.js`. Las cinco estrellas representan un objetivo de atención, no testimonios o puntuación de clientes.

Cada botón abre un correo a rrhh@jeycee.shop con `[EMPLEO]` y el nombre del cargo en el asunto. El candidato debe adjuntar su CV y confirmar el envío desde su correo. No hay carga de CV en servidor ni confirmación automática de recepción, entrevista o contratación. Modalidad, horario y remuneración no se inventan; deben confirmarse con RRHH.

## Inicio simplificado

La homepage se concentra en portada, Desarrollo web y Diseño gráfico destacados, tres familias de servicios, resumen de cotización/asesoría y enlace a Contáctanos. El contenido ampliado de manifiesto, orientación por etapa, criterios de trabajo y proceso se conserva en `src/studio-sections.js`, mostrado en Quiénes somos. Planes, FAQ, formulario de contacto y todos los servicios continúan en sus páginas respectivas. El enlace de asesoría del pie mantiene su ancla en el inicio.

Trabaja con nosotros se accede únicamente desde el pie de página; las dos vacantes y sus requisitos se mantienen en `/trabaja-con-nosotros`. La homepage no presenta tarjetas de vacantes.

## Antispam sin seguimiento externo

Todos los formularios activos de contacto, checkout y reseñas incluyen una pregunta aleatoria de suma/resta y un campo honeypot oculto, excluido del recorrido de teclado. La pregunta puede renovarse y su texto es accesible para lectores de pantalla. Las respuestas no se guardan en cookies, no se incorporan al correo y no se envían a proveedores de CAPTCHA. El guard de captura bloquea la preparación de solicitudes/reseñas con respuesta incorrecta o honeypot rellenado.

En las reseñas públicas, `/api/reviews` entrega además una pregunta firmada por el servidor (HMAC con separación de propósito, usando la credencial de servidor existente, sin exponerla). La función valida respuesta, firma, honeypot y caducidad de diez minutos antes de escribir en Supabase. Los tokens aceptados no pueden reutilizarse en la misma instancia de la función; ese registro es temporal, no una protección distribuida entre todas las instancias. No se requieren secretos adicionales. Se renueva la pregunta tras cada intento enviado al servidor. Sin Supabase configurado, el modo local de reseñas mantiene la validación del navegador.

Esta barrera matemática es básica y no garantiza bloquear bots capaces de resolverla. Los formularios mailto pueden eludirse desde un cliente modificado y no protegen las direcciones de correo frente al spam enviado directamente. Las reseñas siguen sujetas a moderación; para abuso a gran escala se necesita limitar solicitudes en Vercel o implementar protección distribuida. El envío directo de Contáctanos requiere la configuración SMTP descrita en su sección.

El antispam de Contáctanos también se verifica en servidor. No requiere CAPTCHA de terceros y no añade cookies. Faltas de campos requeridos, correo inválido, mensaje corto y respuesta matemática incorrecta se muestran antes del envío. Las comprobaciones se repiten en el servidor.

### Corrección de carga de antispam y variables en Vercel

Contáctanos nunca muestra una pregunta local si necesita validación del servidor. Mientras carga, o si GET `/api/contact` falla, el campo de respuesta y Enviar permanecen deshabilitados y se ofrece reintentar la validación. Una respuesta correcta no se etiqueta como incorrecta por falta de configuración. Al recuperar la conexión se limpia el aviso de indisponibilidad. Las peticiones de preguntas usan `cache: no-store`.

Las variables que se añaden en Vercel necesitan un nuevo despliegue para estar disponibles. GET `/api/contact` devuelve una pregunta cuando la configuración SMTP es válida; un 503 incluye un código diagnóstico sin valores secretos: SMTP_USER_MISSING, SMTP_PASS_MISSING, SMTP_USER_INVALID o SMTP_PORT_INVALID. Se toleran espacios al pegar el usuario/host; no se recorta la contraseña. La captura del usuario y su respuesta JSON confirmaron que el fallo inicial era de disponibilidad/configuración antes de validar la respuesta matemática, no que 8+5 no fuera 13. La lectura en vivo del dominio desde este entorno fue bloqueada por la política de red; falta comprobar el nuevo despliegue real.

## Diseño de los correos de contacto

`server/contact-email.js` genera una notificación HTML con tablas y estilos inline, marca JEY CEE, acentos naranja pastel, área, referencia, fecha/hora de Panamá, datos del contacto y mensaje. Incluye botón de respuesta y mantiene Reply-To al cliente. El servidor usa el mismo destinatario, credenciales SMTP y antispam que antes.

El logotipo se incorpora como PNG inline mediante CID desde `server/email-logo.js` (render del símbolo SVG existente), sin descargar imágenes externas. No se añaden píxeles de seguimiento ni hojas de estilo externas. Todas las entradas del usuario se escapan antes de insertarse en HTML; los saltos de línea se conservan. El correo también incluye una alternativa de texto para clientes que no muestran HTML.

Las pruebas generan MIME sin envío real, comprueban alternativas HTML/texto, imagen CID, caracteres escapados y Reply-To. La maquetación usa tablas para compatibilidad; la apariencia puede variar según el cliente de correo. Solo cambia el correo automático de Contáctanos; el brief del checkout usa WhatsApp y las postulaciones conservan su envío por correo.

## Planes y brief por WhatsApp

Cada tarjeta de plan muestra primero **Preparar un brief**, con enlace a `/checkout?plan=<servicio>--<nivel>`, y debajo **Cotizar por WhatsApp**. Las tarjetas generales enlazan a `/checkout?nivel=<nivel>` sin asumir un servicio. Los 84 planes conservan alcance y precio. Los botones de cotización de planes, resumen y tabla Business abren el número oficial **+507 6091-3544** mediante `https://wa.me/50760913544` con un texto contextual; no se dirigen por correo.

`src/whatsapp.js` centraliza el número, mensajes y aviso de privacidad/pagos. `src/brief.js` valida y prepara un brief con servicio, nivel, precio vigente, crédito de asesoría solicitado (por verificar), contacto básico y objetivo del proyecto. Tras el antispam, **Solicitar por WhatsApp** abre una ventana con el mensaje; queda un botón visible por si el navegador bloquea la apertura. El cliente confirma el envío en WhatsApp. No hay WhatsApp Business API, envío automático, orden confirmada ni pago verificado. El estado se invalida al editar el formulario.

El brief solicita nombre y objetivo; correo y empresa son opcionales. Se retiraron los campos fiscales y bancarios de ese flujo para no enviarlos a WhatsApp. Si se requieren datos fiscales se coordinan por un canal oficial. El aviso indica no compartir datos confidenciales y que el **único medio de pago es Yappy** (6827-4965), coordinado por el WhatsApp oficial o correos de dominio exacto **@jeycee.shop**. WhatsApp (6091-3544) y Yappy (6827-4965) son números distintos con funciones distintas. El formulario de Contáctanos sigue enviando por SMTP con su diseño HTML y no cambia de destinatarios.

## Pedidos numerados y cupón opcional en el brief

Al solicitar por WhatsApp se muestra **Pedido creado** y un número de solicitud. En el portal con el contador instalado se usa JC-0001, JC-0002…; las referencias largas de versiones anteriores se siguen admitiendo. El mismo número se incluye en el texto de WhatsApp. La interfaz aclara que se creó en el dispositivo y sigue pendiente de enviar/confirmar por la agencia; no acredita recepción, contrato ni pago. Repetir la solicitud sin cambiar el contenido conserva el número durante la sesión. Una nueva combinación de datos/plan genera otro número.

Se guardan como máximo 20 referencias en localStorage, con número, clave del servicio, fecha, precio estimado y cupón; nunca nombre, correo, empresa ni brief. Al recargar se informa la última referencia. Si el almacenamiento está bloqueado, se conserva la solicitud en memoria y se avisa al cliente para que copie el número. El portal activado añade registro central en Supabase y estados manuales. WhatsApp no sincroniza estados automáticamente. Sin el portal, las referencias siguen siendo metadatos locales de la notificación por correo.

Se retiró la casilla de asesoría pagada y el crédito automático de este flujo. La política comercial de asesoría de $20 se mantiene en sus secciones, para confirmar directamente con la agencia.

La campaña autorizada **JEYCEE10** activa un 10% sobre el precio regular del servicio desde `src/coupons.js`. El campo y botón del brief están habilitados. Se admiten descuentos de porcentaje o importe, vigencia y alcance por servicio/nivel. Por defecto no se acumulan con una promoción: se conserva el mejor precio; solo una regla con stackWithPromotion permite aplicarlo sobre la promoción. Business incluye la referencia para revisar su importe en propuesta. Los descuentos son estimaciones del navegador y requieren confirmación de la agencia, no validación de pago ni garantía de uso único.

## Pantalla final del pedido

En modo correo, después de validar y crear el pedido, todo el contenido del checkout (intro, aviso, formulario y resumen) se sustituye por tres elementos: **Pedido creado**, número y **Seguir pedido en WhatsApp**. El botón abre WhatsApp con el mensaje completo; no se abre una ventana automáticamente al crear. Para otro pedido se vuelve al catálogo y se elige de nuevo un servicio/plan.

La confirmación conserva únicamente número, clave de producto y query de origen en el estado del historial de esa página (sin datos personales). Recargar mantiene la pantalla final, sin reabrir el formulario. Tras recargar, el enlace de WhatsApp usa número y servicio para continuar la consulta; no recupera el brief personal, que no se almacena. Los pedidos nuevos se envían a business@jeycee.shop mediante la API descrita a continuación. La confirmación no acredita lectura, contratación ni pago.

## Notificación de pedidos a business@jeycee.shop

La creación de pedidos ahora requiere POST `/api/orders`: valida datos, consentimiento, precio/cupón desde el catálogo del servidor y antispam firmado con contexto separado. GET entrega la pregunta firmada. Usa las mismas variables SMTP que Contáctanos; no requiere configuración nueva. El destinatario está fijo en business@jeycee.shop y no puede reemplazarse mediante campos del navegador. La notificación reutiliza la plantilla HTML, imagen CID y alternativa de texto, con número, servicio, plan, importe y brief; Reply-To se añade solo si el cliente indicó correo.

En modo correo, el número se asigna en el servidor y solo se devuelve `created: true` si SMTP acepta business@jeycee.shop. Después la web conserva la confirmación mínima de tres elementos y el enlace a WhatsApp con ese mismo número. Si SMTP falla, se conserva el formulario, se informa del fallo y se renueva la pregunta; no se muestra Pedido creado. El botón se bloquea durante el envío para evitar doble clic. La entrega SMTP no confirma lectura, contratación ni pago. Sin el portal, la notificación queda en el buzón. Con el portal activado, la escritura en Supabase confirma la creación, el correo es una notificación adicional y se entrega también la enlace de seguimiento.

La creación anterior solo local queda obsoleta para pedidos nuevos. Los metadatos locales continúan sin datos personales. Las confirmaciones antiguas conservadas en el historial no se envían por correo retroactivamente, ni la recarga de una confirmación vuelve a enviar. Las pruebas usan SMTP simulado; las credenciales de producción no están disponibles en esta sesión para enviar una prueba real.

El brief requiere código de país (prefijo internacional con +; Panamá +507 por defecto) y teléfono sin repetir ese prefijo. Ambos se validan en navegador y servidor. El número normalizado se incluye en la notificación HTML/texto a business y en el mensaje preparado para WhatsApp; no se almacena en los metadatos locales del pedido.

## Campaña interactiva «Conecta tu marca»

La homepage incorpora un Brand Lab: al tocar Estrategia, Diseño y Tecnología, las tres piezas del símbolo de Jey Cee se ensamblan y revelan JEYCEE10. Botones nativos con estado, progreso y avisos accesibles; admite teclado y movimiento reducido. El cupón se puede copiar (con selección manual si falla el portapapeles) o aplicar desde el enlace al checkout. Se conserva solo el código en sessionStorage de la pestaña: no hay registro, cookies ni datos personales. Si el almacenamiento está bloqueado, el enlace con `?cupon=JEYCEE10` sigue funcionando.

Código público, reutilizable y sin fecha de caducidad configurada; no hay sorteo ni comprobación de uso único. Aplica 10% al precio regular, conservando la mejor promoción sin acumular descuentos. En planes mensuales aplica al primer periodo; en Business se incluye para calcular en propuesta. Excluye asesoría, impuestos y terceros. El servidor valida el código y recalcula el precio antes de remitir el pedido a business@jeycee.shop; el correo y WhatsApp conservan la referencia y el importe.

## Administración, tickets y seguimiento

Nuevas rutas: `/admin` (contraseña y sesión de servidor), `/admin/demo` (ejemplo aislado con datos ficticios) y `/seguimiento` (número y antispam). El menú incluye Seguimiento. El portal permite consultar pedidos/tickets, responder, escribir notas internas, cambiar estados, asignar responsables y establecer fechas objetivo.

Para activar el almacenamiento real ejecuta `database/portal.sql` y configura los secretos de Vercel siguiendo [la guía completa](docs/portal-administracion.md). El código no contiene una contraseña predeterminada ni credenciales de producción. Mientras `PORTAL_ENABLED` esté desactivado, se conserva el envío por correo existente. Al activarlo, las nuevas solicitudes se guardan en Supabase; la confirmación depende de esa escritura y las notificaciones por correo son adicionales. Los registros anteriores no se importan automáticamente.

El seguimiento del cliente ya no solicita clave. Las referencias largas de la versión anterior mantienen compatibilidad. La numeración actual del portal puede activarse como JC-0001, JC-0002… mediante la actualización descrita abajo. Las referencias antiguas conservan consulta de estado; sus conversaciones previas siguen en administración. Para actualizar una base instalada con la versión anterior, ejecuta `database/portal-number-only.sql`; el modo de compatibilidad mantiene la recepción de formularios antes de esa actualización.

## Numeración secuencial de solicitudes

Ejecuta `database/portal-sequential-numbers.sql` para activar JC-0001, JC-0002… en una base existente; `database/portal.sql` ya lo incluye en instalaciones nuevas. El contador PostgreSQL persiste entre despliegues, admite hasta ocho dígitos y comparte serie entre pedidos y tickets. Reintentar un envío no consume otro número; una operación fallida puede dejar un salto. No se renumeran registros anteriores. Mientras falta esa función SQL, el servidor sigue recibiendo solicitudes con el flujo compatible actual.

El estado puede verse con el número y antispam. Para acceder a la conversación de los números cortos se confirma el correo o teléfono de la solicitud; no hay una clave nueva que recordar. Los datos de contacto y las notas internas no se publican.

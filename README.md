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

Publicar `dist/` en un alojamiento estático. La navegación, menú móvil, 21 páginas de servicios y descarga de brief funcionan sin servicios externos. El formulario genera un resumen local descargable y abre un correo a business@jeycee.shop (o hello@jeycee.shop para soporte); el visitante debe confirmar el envío desde su aplicación de correo.

El símbolo SVG es una recreación vectorial de la referencia aportada; reemplazar `public/mark.svg` por el archivo oficial cuando esté disponible. Imagen de portada original generada para este diseño. No se incluyen reseñas, cifras ni clientes inventados. Las fuentes de Google son opcionales y tienen alternativas locales.

## Catálogo y páginas

- `/servicios`: catálogo; 21 páginas en `/servicios/<slug>` con definición detallada, metodología, resultados esperados, requisitos y cuatro planes con entregables específicos.
- `/planes`: Básico, Pro, VIP y Business. Básico, Pro y VIP tienen precios por servicio. Business se cotiza mediante Contactar a business@jeycee.shop.
- `/checkout?plan=productos-digitales--vip`: selección de plan/servicio y preparación de solicitud. El resumen no acredita pago ni es factura fiscal.
- `/quienes-somos`, `/facturacion`, `/soporte`, `/resenas`, `/preguntas-frecuentes`, `/terminos`, `/privacidad`.

Los datos generales y niveles se editan en `src/catalog.js`; las descripciones ampliadas y los 84 alcances en `src/premium.js`. Los 63 precios y 21 valores Business a cotización se centralizan en `src/pricing.js`. Cada nivel describe su propio alcance, sin sumar automáticamente los niveles anteriores. Los botones Contactar abren un mailto a business@jeycee.shop con el servicio y nivel seleccionados; el visitante debe confirmar el envío. Los plazos y el alcance se confirman por proyecto. Se muestra el precio base de cada plan en el servicio, el selector de solicitud y el resumen descargable; Business muestra «A cotización». Impuestos aplicables, extras y costos de terceros se confirman antes de contratar. En el inicio y las tarjetas generales, «Desde» es el mínimo del nivel entre los servicios; no promete el mismo precio para todas las especialidades. Falta razón social y RUC/DV del emisor para completar la información fiscal.

La navegación principal contiene Quiénes somos, Servicios (mega menú), Planes premium, Reseñas y el botón Contáctanos. Facturación permanece accesible en el pie de página. El menú se colapsa hasta 1024px y permite cierre con Escape, clic fuera y selección de enlace. La paleta usa naranja melocotón pastel con fondos cálidos y la imagen principal se armoniza mediante un filtro CSS, conservando el archivo original.

## Contacto y Yappy

Ventas y cotizaciones: `business@jeycee.shop`. Soporte: `support@jeycee.shop`. Privacidad y contacto general: `hello@jeycee.shop`. Yappy: `6827-4965`. Los formularios preparan una descarga y un enlace mailto; el usuario debe enviar desde su aplicación de correo. No se crea un ticket ni se recibe un correo automáticamente. El flujo Yappy es manual: confirmar beneficiario, alcance y monto final antes de transferir; la agencia verifica el pago. No hay integración comercial/API de Yappy, lectura bancaria, captura de tarjetas ni emisión fiscal.

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

## Página de contacto

El botón principal del menú dice **Contáctanos** y abre `/contacto`. La página permite preparar consultas de cotización, asesoramiento, soporte, facturación y otros temas. Cada tema utiliza el destinatario definido en `src/email-routing.js`: comerciales a business, soporte a support, facturación a orders y general a hello. Admite `?tipo=soporte` o `?tipo=cotizacion&servicio=desarrollo-web` para preseleccionar opciones válidas.

`src/contact.js` construye una referencia de borrador por sesión de página, el resumen descargable y el mailto. La referencia no acredita recepción ni crea un ticket en servidor. Solo el usuario puede confirmar el envío desde su aplicación de correo. La web no cambia el estado a recibido o enviado al pulsar el enlace. Puede copiarse o descargarse el resumen si no hay aplicación configurada. Editar el formulario invalida el resumen anterior; la referencia se conserva hasta recargar.

No hay almacenamiento de consultas, seguimiento de estados ni correo automático. No se guardan datos personales del contacto en localStorage. Un sistema de tickets real requiere un backend, recepción de correo y autenticación para consultar estados; esa integración no se simula. El checkout se mantiene. Soporte está integrado en Contáctanos.

## Contacto unificado y marca

El menú y el pie de página usan únicamente Contáctanos como acceso a consultas. Soporte se selecciona dentro de `/contacto?tipo=soporte`; facturación utiliza `/contacto?tipo=facturacion`. La antigua ruta `/soporte` redirige al contacto unificado; el servidor de desarrollo también conserva esa compatibilidad. La página y formulario de soporte separados se eliminaron. En el encabezado y pie, la marca muestra solo el símbolo y JEY CEE, sin Tech.

## Distribución de alias de correo

Configuración central: `src/email-routing.js`. Cotización y asesoría → business@jeycee.shop; marketing y campañas → mercadeo@jeycee.shop; pedidos, pagos y facturación (incluido checkout) → orders@jeycee.shop; soporte → support@jeycee.shop; atención VIP y botones de planes VIP → vip@jeycee.shop; colaboraciones → collabs@jeycee.shop; empleo → rrhh@jeycee.shop; gerencia → gerencia@jeycee.shop; general y privacidad → hello@jeycee.shop. Los correos personales angeline y julian quedan fuera de los formularios públicos. Se retiró el alias anterior de ventas de los destinatarios de la web.

La web prepara el destinatario y un asunto con área/referencia. No envía automáticamente ni confirma recepción. Los alias fueron proporcionados por el propietario; no se probó entrega real ni se modificó Namecheap. Si pertenecen al buzón hello, normalmente se recibirán en esa misma bandeja. Las reglas de carpetas o buzones independientes se configuran en el proveedor; la web no los crea.

## Trabaja con nosotros

El inicio incluye, al final, las tarjetas de Asistente de mercadeo y Telemarketing. El pie enlaza a `/trabaja-con-nosotros`, con ambas vacantes, funciones, requisitos, estándares de excelencia y proceso de postulación. Datos y plantillas en `src/careers.js`. Las cinco estrellas representan un objetivo de atención, no testimonios o puntuación de clientes.

Cada botón abre un correo a rrhh@jeycee.shop con `[EMPLEO]` y el nombre del cargo en el asunto. El candidato debe adjuntar su CV y confirmar el envío desde su correo. No hay carga de CV en servidor ni confirmación automática de recepción, entrevista o contratación. Modalidad, horario y remuneración no se inventan; deben confirmarse con RRHH.

## Inicio simplificado

La homepage se concentra en portada, Desarrollo web y Diseño gráfico destacados, tres familias de servicios, resumen de cotización/asesoría y enlace a Contáctanos. El contenido ampliado de manifiesto, orientación por etapa, criterios de trabajo y proceso se conserva en `src/studio-sections.js`, mostrado en Quiénes somos. Planes, FAQ, formulario de contacto y todos los servicios continúan en sus páginas respectivas. El enlace de asesoría del pie mantiene su ancla en el inicio.

Trabaja con nosotros se accede únicamente desde el pie de página; las dos vacantes y sus requisitos se mantienen en `/trabaja-con-nosotros`. La homepage no presenta tarjetas de vacantes.

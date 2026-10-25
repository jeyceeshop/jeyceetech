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

Publicar `dist/` en un alojamiento estático. La navegación, menú móvil, ocho páginas de servicios y descarga de brief funcionan sin servicios externos. El formulario genera un resumen local descargable y abre un correo a ventas@jeycee.shop (o hello@jeycee.shop para soporte); el visitante debe confirmar el envío desde su aplicación de correo.

El símbolo SVG es una recreación vectorial de la referencia aportada; reemplazar `public/mark.svg` por el archivo oficial cuando esté disponible. Imagen de portada original generada para este diseño. No se incluyen reseñas, cifras ni clientes inventados. Las fuentes de Google son opcionales y tienen alternativas locales.

## Catálogo y páginas

- `/servicios`: catálogo; ocho páginas en `/servicios/<slug>` con definición detallada, metodología, resultados esperados, requisitos y cuatro planes con entregables específicos.
- `/planes`: Básico, Pro, VIP y Business. Sin importes publicados; cotización personalizada mediante Contactar a ventas@jeycee.shop.
- `/checkout?plan=productos-digitales--vip`: selección de plan/servicio y preparación de solicitud. El resumen no acredita pago ni es factura fiscal.
- `/quienes-somos`, `/facturacion`, `/soporte`, `/resenas`, `/preguntas-frecuentes`, `/terminos`, `/privacidad`.

Los datos generales y niveles se editan en `src/catalog.js`; las descripciones ampliadas y los 32 alcances en `src/premium.js`. Cada nivel describe su propio alcance, sin sumar automáticamente los niveles anteriores. Los botones Contactar abren un mailto a ventas@jeycee.shop con el servicio y nivel seleccionados; el visitante debe confirmar el envío. Los plazos y la inversión se acuerdan por proyecto. No se muestran precios numéricos ni se incluyen en los resúmenes descargables. Falta razón social y RUC/DV del emisor para completar la información fiscal.

La navegación principal contiene Quiénes somos, Servicios (mega menú), Planes premium, Reseñas y Soporte. Facturación permanece accesible en el pie de página. El menú se colapsa hasta 1024px y permite cierre con Escape, clic fuera y selección de enlace. La paleta usa naranja melocotón pastel con fondos cálidos y la imagen principal se armoniza mediante un filtro CSS, conservando el archivo original.

## Contacto y Yappy

Ventas y cotizaciones: `ventas@jeycee.shop`. Soporte y privacidad: `hello@jeycee.shop`. Yappy: `6827-4965`. Los formularios preparan una descarga y un enlace mailto; el usuario debe enviar desde su aplicación de correo. No se crea un ticket ni se recibe un correo automáticamente. El flujo Yappy es manual: confirmar beneficiario, alcance y monto final antes de transferir; la agencia verifica el pago. No hay integración comercial/API de Yappy, lectura bancaria, captura de tarjetas ni emisión fiscal.

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

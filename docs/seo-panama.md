# SEO de Jey Cee para Panamá

## Alcance implementado

Dominio canónico: **https://www.jeycee.shop**. Se conserva el nombre visible Jey Cee y las variantes de marca JeyCee Tech / JeyCee en los datos de la organización. Teléfono oficial: +507 6091-3544; ventas: business@jeycee.shop; soporte: support@jeycee.shop. No se inventa dirección física, presencia en Google Maps, clientes, premios, reseñas ni posiciones en buscadores.

`npm run build` ejecuta Vite y `scripts/generate-site.mjs`. Publica 48 documentos HTML completos: 38 URLs indexables, nueve páginas auxiliares con noindex y el 404. Las páginas públicas se leen sin ejecutar JavaScript; sus interacciones siguen funcionando con el mismo código del sitio. El menú y el pie también aparecen en el HTML inicial. Sin JavaScript, se ocultan los formularios para evitar envíos nativos con datos personales en la URL, y se ofrece contacto directo.

Vercel usa archivos estáticos y `cleanUrls: true`, sin el antiguo rewrite global a index.html. Las rutas desconocidas usan el 404.html con estado HTTP 404 del alojamiento; no se generan páginas vacías con estado 200 para URLs inventadas. Las APIs y los controles de autenticación permanecen separados. Vite preview no reproduce exactamente los estados y redirecciones de Vercel: el verificador de producción local simula las rutas limpias y los errores para revisar el resultado del build.

## Intenciones de búsqueda

- Inicio: agencia digital en Panamá; marca Jey Cee.
- Desarrollo web: desarrollo web en Panamá para negocios, sitios corporativos y formularios.
- Diseño gráfico: diseño gráfico en Panamá, piezas digitales y materiales impresos.
- Diseño web: diseño web en Panamá, pantallas y prototipos.
- Tiendas online: tienda online en Panamá, catálogo y pedidos.
- Marketing digital: marketing digital en Panamá para empresas y pymes.
- Redes sociales: gestión y contenido para redes sociales en Panamá.
- SEO: posicionamiento web en Panamá, revisión técnica y contenido.
- Cada una de las 21 especialidades tiene título, descripción y preguntas propias en `src/service-seo.js`.

La localidad aparece en el contexto del servicio, sin copiar listas de ciudades ni crear páginas repetidas para ubicaciones sin oferta diferenciada. El contenido distingue diseño de desarrollo y evita que varias páginas compitan con el mismo enfoque.

## Contenido editorial

Cuatro guías en `/recursos` con enlaces a servicios y cotización:

1. Precios de páginas web en Panamá: tabla de tarifas regulares de Jey Cee, entregables y costos adicionales. No se presenta como un estudio del mercado.
2. Diseño web o desarrollo web: diferencias, entregables y cómo priorizar una primera versión.
3. Cómo preparar un brief de diseño gráfico: objetivo, público, piezas, formatos, referencias y revisiones.
4. Marketing digital para pymes en Panamá: canales, presupuesto, atención y medición.

Los contenidos están en `src/resources.js`. Las tarifas de la guía se calculan desde el catálogo y no requieren copiar precios en varios archivos. La promoción temporal se explica por separado; al vencer, conviene redeplegar para que el HTML estático refleje el estado actualizado. El navegador también aplica las fechas del catálogo al renderizar.

## Metadatos y rastreo

`src/seo.js` comparte los metadatos entre generación HTML y navegador. Cada página indexable tiene título, descripción, canonical sin query/fragment, idioma es-PA, Open Graph, tarjeta social y JSON-LD. Los enlaces de navegación incluyen migas de pan. El HTML inicial tiene el contenido del servicio correcto; no depende de que el buscador reemplace un título genérico tras ejecutar JavaScript.

Se generan `/sitemap.xml` y `/robots.txt`. El sitemap contiene únicamente las 38 URLs públicas canónicas, con una sola versión por página. No se inventan fechas lastmod para aparentar actualizaciones. Robots permite rastrear el sitio y excluye `/api/`. Admin, checkout, seguimiento, soporte, facturación, reseñas y páginas legales muestran noindex. El noindex no es una medida de seguridad: la administración conserva autenticación y las conversaciones conservan comprobación de contacto.

JSON-LD representa Organization, WebSite, WebPage, BreadcrumbList, Service, ItemList, FAQPage y Article cuando corresponden. Las preguntas y respuestas marcadas son las que se muestran en cada servicio. No se marca un promedio de cinco estrellas ni se prometen resultados enriquecidos. Las referencias de otras marcas no aparecen como clientes ni vínculos sameAs. No se incluye SearchAction porque el sitio no tiene un buscador interno.

## Carga y recursos

- Imagen principal WebP (~56 KB), manteniendo la composición del original PNG (~1,8 MB).
- La portada precarga su imagen principal para adelantar su descarga. Las vistas previas sociales usan un JPEG optimizado de 1200 × 675 (~70 KB).
- DM Sans y Manrope variables se sirven localmente, con font-display swap y licencias OFL. No se solicitan fuentes a Google.
- Los logotipos de referentes siguen locales y con carga diferida.
- No se añade analítica publicitaria ni cookies nuevas.

## Pasos que requieren tu cuenta de Google

1. Abre Google Search Console y añade la propiedad **Dominio: jeycee.shop**.
2. Google entregará un registro TXT de verificación. Agrégalo en Namecheap → Advanced DNS; conserva los registros del sitio y del correo. El valor debe ser el de tu cuenta, no un ejemplo.
3. Verifica la propiedad y envía **https://www.jeycee.shop/sitemap.xml** en Sitemaps.
4. Inspecciona la portada y los servicios prioritarios para solicitar indexación y comprobar la URL canónica reconocida.
5. Revisa impresiones, clics, consultas y páginas en Search Console. Compara periodos equivalentes; publicar las mejoras no significa que Google haya indexado las páginas o asignado una posición específica.

No se puede verificar ni enviar la propiedad sin acceso a la cuenta correspondiente. Esta implementación no afirma haber enviado URLs a Google ni disponer de cifras de tráfico.

Un Perfil de Empresa en Google solo debe crearse si la actividad cumple sus requisitos de atención presencial o área de servicio; no se debe inventar una oficina. Si existe un perfil legítimo, mantén nombre, contacto y URL consistentes. El titular confirmó como único perfil oficial Instagram @jeycee.shop (https://www.instagram.com/jeycee.shop/). Se enlaza en el pie y en Contáctanos, y se declara en sameAs de Organization; no se inventan otras redes ni se incorporan embeds o píxeles. La configuración compartida está en src/social.js.

## Continuidad editorial y marca

Prioriza casos reales de proyectos con autorización del cliente, imágenes propias y resultados medidos con contexto. Actualiza estas guías cuando cambien los alcances y publica nuevas piezas que respondan preguntas de clientes; no generes variantes casi idénticas por palabra clave. Las reseñas deben corresponder a experiencias reales y no se debe filtrar su publicación por puntuación.

Antes de publicar cambios de dominio, actualiza `site.origin` en `src/seo.js` y `PUBLIC_SITE_URL` en Vercel para mantener coherencia entre canonical, sitemap y enlaces de seguimiento por correo. El dominio vigente ya está configurado en el código; no se requieren nuevas variables para este SEO.

## Comprobación

`npm run build` y `node --test tests/*.test.js`. Las pruebas de SEO revisan HTML final sin JavaScript, metadatos únicos, datos estructurados, enlaces internos, rutas del sitemap, exclusión de páginas privadas y recursos existentes. El navegador local revisa páginas y formularios con el HTML generado, tanto con JavaScript como sin él. La inspección de los servidores públicos está limitada si el entorno bloquea las conexiones; Search Console es la fuente para verificar el rastreo real.

## Portafolio conceptual

La colección `/portafolio` y sus cuatro casos tienen HTML completo, títulos, descripciones, breadcrumbs, imágenes sociales y canonical propios. El índice declara ItemList; cada caso declara CreativeWork con estado Conceptual y una descripción de marca ficticia. No se declaran clientes, resultados comerciales, premios o reseñas inventados. Las cinco rutas entran en el sitemap y en el renderizado público de Vercel.

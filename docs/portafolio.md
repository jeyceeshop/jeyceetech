# Portafolio conceptual

La colección está en `/portafolio`, enlazada desde el menú, el pie y una selección de dos proyectos en la homepage. Incluye:

- **MAREA:** diseño web y dirección de arte para un estudio de arquitectura ficticio.
- **SAVIE:** identidad y packaging para una línea ficticia de cuidado personal.
- **BRASA:** identidad, contenido y experiencia web móvil para un restaurante ficticio.
- **ÁUREA:** experiencia de reserva y diseño de producto digital para un estudio de bienestar ficticio.

Cada caso tiene escenario, objetivo, enfoque visual, alcance planteado, paleta, resultados cualitativos del concepto e indicadores que se evaluarían en una futura implementación. Las tarjetas y páginas identifican los proyectos como conceptuales y las marcas como ficticias. Los mockups no representan productos implementados ni encargos de clientes, y no se atribuyen métricas de negocio, testimonios, ventas o premios.

Las cuatro imágenes se generaron para esta colección con la herramienta de generación de imágenes de ChatGPT. Se sirven desde `public/portfolio/`, con WebP de 1536 × 1024, variantes de 768 píxeles para móvil y JPEG para vistas previas sociales. Los originales PNG permanecen en el espacio de generación; no se incluyen en la descarga del sitio. No hay imágenes remotas, rastreadores ni logos de terceros en estos casos.

Contenido y renderizado: `src/portfolio.js`; estilos: `src/portfolio.css`. Los filtros se activan con JavaScript y conservan la categoría en la URL; sin JavaScript se ven los cuatro proyectos. El contenido completo se renderiza en servidor y mantiene títulos, canonical, breadcrumbs, CreativeWork e imágenes sociales individuales. El listado usa ItemList con nombres identificados como conceptos.

**Hagamos tu proyecto** abre Contáctanos con el servicio elegido y un mensaje inicial que identifica el concepto. El visitante completa sus datos y mensaje antes de enviar. El botón alternativo abre el WhatsApp oficial +507 6091-3544 con el contexto del ejemplo; no envía nada automáticamente.

No modifica tablas, contraseñas, el editor ni datos existentes del portal. Este portafolio está definido en código; la edición de proyectos e imágenes desde administración no forma parte de esta versión. No requiere otra actualización SQL ni variables nuevas.

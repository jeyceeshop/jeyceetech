# JeyCee Tech

Sitio en español para una agencia creativa. Vite + HTML, CSS y JavaScript, sin backend.

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

Publicar `dist/` en un alojamiento estático. La navegación, menú móvil, ocho servicios desplegables y descarga de brief funcionan sin servicios externos. El formulario no envía consultas: genera un resumen local descargable. Conectar un canal real de contacto antes de una publicación comercial.

El símbolo SVG es una recreación vectorial de la referencia aportada; reemplazar `public/mark.svg` por el archivo oficial cuando esté disponible. Imagen de portada original generada para este diseño. No se incluyen reseñas, cifras ni clientes inventados. Las fuentes de Google son opcionales y tienen alternativas locales.

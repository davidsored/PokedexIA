# Feature: Frontend estilo Tailwind replicado

## Fecha
2026-05-15

## Resumen
Se rediseñó la home para replicar la estructura visual solicitada con utilidades Tailwind y soporte de tema claro/oscuro mediante variables globales en `styles/globals.css`.

## Cambios principales
- Nueva página `pages/index.tsx` con:
  - Header, buscador y toggle de modo Card/Lista.
  - Render condicional con grid de cards o lista de filas.
  - Clases Tailwind exactas para layout, foco accesible, hover y responsive.
  - Carga SSG con `getStaticProps` desde PokeAPI.
- Nuevo componente `components/PokemonListRow.tsx` para vista de lista.
- Refactor de `components/PokemonCard.tsx` a versión Tailwind sin CSS Modules.
- Nuevo `pages/_app.tsx` para cargar estilos globales y meta tags.
- Nuevo `styles/globals.css` con `@import "tailwindcss"`, variables de color y `@theme inline`.
- Añadidos `tailwind.config.js` y `postcss.config.js`.

## Notas
Se mantuvo el uso de imágenes oficiales desde `raw.githubusercontent.com` con `next/image`, `fill`, `sizes` y `priority` para los primeros elementos.

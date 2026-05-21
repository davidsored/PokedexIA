# Adaptacion de vista detalle estilo Stitch

## Resumen

Se rediseño `pages/pokemon/[name].tsx` para acercar la vista de detalle al mockup generado en Google Stitch, manteniendo la integracion real con PokeAPI y la arquitectura actual basada en `Next.js` con `CSS Modules`.

## Cambios realizados

- Se reemplazo la maqueta simple del detalle por una composicion inspirada en una carcasa de Pokedex con hero, panel de informacion, stats, habilidades y navegacion.
- Se conservaron las imagenes con `next/image` y los datos reales procedentes de PokeAPI.
- Se consultan datos adicionales de `pokemon-species` para obtener la categoria del Pokemon.
- Se consultan los endpoints de `ability` para mostrar descripciones reales de las habilidades.
- Se agrego navegacion al Pokemon anterior y siguiente dentro del rango Kanto actual.
- Se trasladaron los estilos del mockup a `pages/pokemon/[name].module.css` sin introducir Tailwind en el proyecto.

## Archivos afectados

- `pages/pokemon/[name].tsx`
- `pages/pokemon/[name].module.css`
- `types/pokemon.ts`
- `package.json`
- `CHANGELOG.md`

## Notas tecnicas

- La animacion de barras se implementa con transicion CSS para evitar problemas de hidratacion.
- El header y footer del mockup no se migraron porque la recomendacion fue portar solo el cuerpo principal del detalle.
- Las habilidades muestran fallback de texto si alguna peticion individual a PokeAPI falla.

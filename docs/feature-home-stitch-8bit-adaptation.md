# Adaptacion home 8-bit desde Stitch

## Resumen

Se rediseño la pagina principal `pages/index.tsx` para replicar la estetica 8-bit del mockup generado en Google Stitch, manteniendo la integracion real con PokeAPI y la navegacion existente hacia el detalle de cada Pokemon.

## Cambios realizados

- Se sustituyo la home anterior por una interfaz 8-bit con barra superior fija, sidebar en escritorio, buscador, filtros por tipo y rejilla de tarjetas.
- El buscador ahora filtra por nombre o por ID.
- Se agregaron filtros por tipo construidos con los tipos reales de los 151 Pokemon de Kanto.
- Las tarjetas muestran sprite clasico, numero, nombre y tipos reales del Pokemon.
- Se ajusto la vista de detalle para quitar el ultimo punto decorativo de la imagen.
- Se conservaron las rutas actuales a `pages/pokemon/[name].tsx`.

## Archivos afectados

- `pages/index.tsx`
- `pages/index.module.css`
- `components/PokemonCard.tsx`
- `components/PokemonCard.module.css`
- `pages/pokemon/[name].tsx`
- `pages/pokemon/[name].module.css`
- `package.json`
- `CHANGELOG.md`

## Notas tecnicas

- Se usan `next/font/google` con `Press Start 2P` y `Space Mono` para acercar la UI al mockup.
- La home consulta los detalles de cada Pokemon para construir filtros y badges por tipo con datos reales de PokeAPI.
- No se migro el modal del mockup porque el proyecto ya usa pagina de detalle dedicada.

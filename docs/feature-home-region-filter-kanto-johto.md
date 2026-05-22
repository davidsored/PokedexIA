# Filtro de regiones Kanto y Johto en home

## Resumen

Se amplio la home para listar Pokemon de Kanto y Johto, y se agrego un filtro lateral de regiones con botones para `ALL REGIONS`, `KANTO` y `JOHTO`.

## Cambios realizados

- La carga inicial de la home pasa de 151 a 251 Pokemon.
- Cada Pokemon del listado incluye ahora su region (`kanto` o `johto`).
- Se agrego un filtro lateral de regiones en el sidebar desktop.
- El filtrado por region se combina con la busqueda por nombre o ID y con el filtro por tipo.

## Archivos afectados

- `pages/index.tsx`
- `pages/index.module.css`
- `package.json`
- `CHANGELOG.md`

## Notas tecnicas

- Para este alcance, la region se resuelve por rango de IDs:
  - `1-151`: Kanto
  - `152-251`: Johto
- Se mantuvo el consumo de PokeAPI y la navegacion existente a la pagina de detalle.

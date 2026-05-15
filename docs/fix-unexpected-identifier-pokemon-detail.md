# Fix: Unexpected identifier en detalle de Pokemon

## Fecha
2026-05-15

## Problema
Al hacer click en una tarjeta se abria `/pokemon/[name]` y aparecia el error `Unexpected identifier '_tsx_07xvfw'`.

## Solucion aplicada
- Se reescribio `pages/pokemon/[name].tsx` a una version mas simple y estable.
- Se dejo el detalle con nombre, id, tipos y estadisticas base en lista.
- Se mantuvo la carga de datos desde PokeAPI con `getStaticPaths` y `getStaticProps`.

## Resultado
La navegacion desde cada tarjeta al detalle sigue activa y la pagina muestra las estadisticas sin el error reportado.

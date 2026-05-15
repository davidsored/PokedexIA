# Fix: invalid or unexpected token en detalle de Pokemon

## Fecha
2026-05-15

## Problema
Al hacer click en una tarjeta para abrir `/pokemon/[name]` aparecia el error `Invalid or unexpected token`.

## Solucion aplicada
- Se normalizo `pages/pokemon/[name].tsx` para usar texto plano ASCII en etiquetas visibles.
- Se dejo una estructura JSX mas simple y estable para la seccion de estadisticas.
- Se mantuvo la ruta dinamica y la carga de datos desde PokeAPI con `getStaticPaths` y `getStaticProps`.

## Resultado
La pagina de detalle mantiene la navegacion por tarjeta y la vista de estadisticas base del Pokemon sin introducir tokens inesperados en tiempo de ejecucion.

# Estilo 8-bit para detalle Pokemon

## Resumen

Se adapto la pagina `pages/pokemon/[name].tsx` al estilo visual 8-bit de la home, manteniendo la estructura funcional actual del detalle: nombre, tipos, base stats con barras de colores, abilities y botones de navegacion entre Pokemon.

## Cambios realizados

- Se incorporaron las fuentes `Press Start 2P` y `Space Mono` en la pagina de detalle.
- Se reemplazo la estetica anterior por un lenguaje visual retro con bordes duros, sombras pixeladas y paneles tipo consola.
- Se mantuvo sin cambios la estructura del contenido y la logica de datos del detalle.
- Se conservaron las barras de stats con los colores personalizados definidos previamente.

## Archivos afectados

- `pages/pokemon/[name].tsx`
- `pages/pokemon/[name].module.css`
- `package.json`
- `CHANGELOG.md`

## Notas tecnicas

- El estilo 8-bit se aplico solo a nivel visual, sin cambiar la composicion de datos del detalle.
- La pagina sigue usando la misma carga desde PokeAPI para species, abilities y navegacion entre Pokemon.

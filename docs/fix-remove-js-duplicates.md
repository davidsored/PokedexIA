# Fix: eliminación de duplicados `.js` en proyecto TypeScript

## Fecha
2026-05-15

## Problema
Next.js detectaba rutas duplicadas porque coexistían páginas en JavaScript y TypeScript con el mismo path:
- `pages/index.js` y `pages/index.tsx`
- `pages/pokemon/[name].js` y `pages/pokemon/[name].tsx`

También existían duplicados JS/TS en utilidades/componentes.

## Solución aplicada
Se eliminaron todos los archivos `.js` del proyecto para dejar una base 100% TypeScript:
- `pages/index.js`
- `pages/pokemon/[name].js`
- `components/PokemonCard.js`
- `lib/axios.js`

## Resultado esperado
- Desaparecen los warnings/errors de **Duplicate page detected**.
- El proyecto mantiene una única fuente de verdad en TypeScript.

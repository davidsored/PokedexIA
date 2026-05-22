# Correccion de detalle para Pokemon de Johto

## Resumen

Se corrigio la generacion de paginas de detalle para que los Pokemon de Johto tambien tengan ruta estatica y navegacion funcional, igual que los de Kanto.

## Causa

La home ya listaba `251` Pokemon, pero `pages/pokemon/[name].tsx` seguia generando rutas y listados auxiliares con un limite de `151`.

## Cambios realizados

- Se centralizo el limite de Pokemon usado en la pagina de detalle a `251`.
- `getStaticPaths` ahora genera paginas para Kanto y Johto.
- `getStaticProps` usa el mismo limite para calcular navegacion anterior y siguiente de forma consistente.

## Archivos afectados

- `pages/pokemon/[name].tsx`
- `README.md`
- `package.json`
- `CHANGELOG.md`

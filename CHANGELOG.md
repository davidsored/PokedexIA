# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [SemVer](https://semver.org/lang/es/).

## [0.3.3] - 2026-06-04

### Fixed
- Corregida la interfaz `PokemonSprites` en `types/pokemon.ts` para evitar el conflicto de index signature (`TS2411`) que impedia el build en Vercel. La propiedad `"official-artwork"` y la firma de indice generica se unifican ahora en la interfaz `PokemonOther`.

## [0.3.2] - 2026-05-22

### Added
- Integradas en `README.md` las capturas reales de la home y del detalle desde `docs/screenshots/`.
- Documentacion del ajuste en `docs/chore-readme-screenshots.md`.

### Changed
- Limpieza de la seccion visual del README y del roadmap para reflejar que las capturas ya forman parte del repositorio.

## [0.3.1] - 2026-05-22

### Fixed
- Corregida la generacion de paginas de detalle para incluir tambien los Pokemon de Johto.
- Ajustado el listado auxiliar del detalle para que la navegacion anterior/siguiente use los `251` Pokemon disponibles en la home.

### Added
- Documentacion del ajuste en `docs/fix-johto-detail-paths.md`.

### Changed
- `README.md` deja preparado el bloque de capturas y aclara que la imagen adjunta debe guardarse en el repositorio para poder enlazarla.

## [0.3.0] - 2026-05-22

### Added
- Archivo `LICENSE` con licencia MIT.
- Documentacion del ajuste de publicacion en `docs/chore-public-readme-license.md`.

### Changed
- Reescritura completa de `README.md` para describir `PokedexIA` como proyecto de portfolio.
- Actualizacion de `package.json` para usar el nombre `pokedexia` y metadatos de descripcion y licencia.
- Ampliacion de `.gitignore` con exclusiones comunes de editores y archivos temporales.

## [0.2.9] - 2026-05-22

### Added
- Filtro lateral de regiones en la home con botones para `ALL REGIONS`, `KANTO` y `JOHTO`.
- Documentacion del cambio en `docs/feature-home-region-filter-kanto-johto.md`.

### Changed
- La home ahora carga Pokemon de Kanto y Johto para mostrar un total de 251 entradas.
- El filtrado del home combina busqueda por nombre o ID, tipo y region.

## [0.2.8] - 2026-05-22

### Added
- Documentacion del rediseño visual 8-bit del detalle en `docs/feature-pokemon-detail-8bit-style.md`.

### Changed
- La pagina `pages/pokemon/[name].tsx` adopta ahora el mismo lenguaje visual 8-bit de la home con tipografias retro, bordes pixelados y paneles tipo consola.
- Se mantuvo la estructura actual del detalle con nombre, tipos, base stats, abilities y navegacion entre Pokemon.

## [0.2.7] - 2026-05-22

### Added
- Nueva home 8-bit inspirada en el mockup de Google Stitch con barra superior, sidebar desktop, buscador retro, filtros por tipo y rejilla de tarjetas.
- Integracion de fuentes `Press Start 2P` y `Space Mono` mediante `next/font/google` para reforzar la estetica retro.
- Documentacion del rediseño en `docs/feature-home-stitch-8bit-adaptation.md`.

### Changed
- `pages/index.tsx` ahora filtra por nombre o ID y por tipo usando datos reales de PokeAPI.
- `components/PokemonCard.tsx` y su CSS fueron rehechos para mostrar sprites clasicos, nombre y tipos en estilo 8-bit.
- Se elimino el ultimo punto decorativo restante de la imagen en la vista de detalle.

## [0.2.6] - 2026-05-21

### Added
- Nueva vista de detalle inspirada en el mockup de Google Stitch con layout tipo Pokedex, panel principal, seccion de stats, seccion de habilidades y navegacion entre Pokemon.
- Consulta de `pokemon-species` para mostrar la categoria del Pokemon.
- Consulta de `ability` para mostrar descripciones reales de habilidades.
- Documentacion del cambio en `docs/feature-pokemon-detail-stitch-adaptation.md`.

### Changed
- Rediseño completo de `pages/pokemon/[name].tsx` y `pages/pokemon/[name].module.css` para adaptar el detalle al estilo visual solicitado sin introducir Tailwind en el proyecto.
- Extension de `types/pokemon.ts` para cubrir habilidades, species y respuestas de abilities.

## [0.2.5] - 2026-05-15

### Fixed
- Reescrita la pagina `pages/pokemon/[name].tsx` con estructura mas simple para evitar el error `Unexpected identifier '_tsx_07xvfw'` al entrar desde una tarjeta.
- Eliminada la logica de barras dinamicas en stats para reducir riesgo de errores de compilacion/hidratacion.

### Changed
- Se mantiene la navegacion por click en tarjeta hacia detalle y la visualizacion de estadisticas base en formato de lista estable.

### Added
- Documentacion del ajuste en `docs/fix-unexpected-identifier-pokemon-detail.md`.

## [0.2.4] - 2026-05-15

### Fixed
- Ajustada la pagina `pages/pokemon/[name].tsx` para eliminar caracteres especiales conflictivos que podian provocar `Invalid or unexpected token` al abrir el detalle desde una tarjeta.
- Se simplifico el render de la barra de estadisticas para evitar atributos innecesarios durante la hidratacion.

### Added
- Documentacion del fix en `docs/fix-invalid-token-pokemon-detail.md`.

## [0.2.3] - 2026-05-15

### Added
- CTA "Ver estadísticas" en cada tarjeta para reforzar la navegación al detalle de cada Pokémon.
- Documentación de la mejora en `docs/feature-pokemon-stats-navigation.md`.

### Changed
- Rediseño de `pages/pokemon/[name].tsx` para mostrar tipos y estadísticas base en formato visual con barras.
- Mejoras de estilos en la vista de detalle para una lectura más clara y responsive.

## [0.2.2] - 2026-05-15

### Added
- Buscador en la home para filtrar Pokémon por nombre en tiempo real mientras se escribe.
- Indicador de resultados visibles con el formato `Mostrando X de 151 Pokémon`.
- Documentación de la feature en `docs/feature-home-search-filter.md`.

## [0.2.1] - 2026-05-15

### Fixed
- Eliminados los archivos JavaScript duplicados de páginas (`pages/index.js` y `pages/pokemon/[name].js`) que provocaban `Duplicate page detected` en Next.js.
- Eliminados duplicados JS restantes (`components/PokemonCard.js` y `lib/axios.js`) para mantener el proyecto en TypeScript de forma consistente.

### Added
- Documentación del ajuste en `docs/fix-remove-js-duplicates.md`.

## [0.2.0] - 2026-05-15

### Added
- Selector de visualización en home para alternar entre **Modo Card** (rejilla) y **Modo Lista** (lista vertical).
- Nuevo documento `docs/feature-home-theme-view-modes.md` con el detalle técnico de la mejora.

### Changed
- Rediseño de la página principal con una estética más alineada a la temática Pokémon (fondo, tipografía visual y controles).
- Adaptación del componente `PokemonCard` para soportar visualización en formato lista horizontal.

### Fixed
- Mitigación de errores recurrentes `TimeoutError` y `upstream image response timed out` al desactivar la optimización proxy de `next/image` (`images.unoptimized = true`).

## [0.1.3] - 2026-05-14

### Fixed
- Se eliminó la carpeta `app/` incompleta para evitar conflicto interno de enrutado y corregir el `Unhandled Rejection: The "to" argument must be of type string. Received undefined` al iniciar con `next dev`.

## [0.1.2] - 2026-05-14

### Fixed
- Se eliminó `app/page.tsx` para resolver el conflicto de rutas `/` entre App Router y Pages Router en Next.js.

## [0.1.1] - 2026-05-14

### Fixed
- Migración de etiquetas `<img>` a `next/image` en tarjeta y detalle para corregir advertencias de optimización de Next.js.
- Configuración de `images.remotePatterns` en `next.config.ts` para permitir imágenes desde `raw.githubusercontent.com` y evitar el error de hostname no configurado.

## [0.1.0] - 2026-05-14

### Added
- Configuración centralizada de Axios para consumir la PokeAPI en `lib/axios.js`.
- Componente `PokemonCard` para mostrar nombre, ID e imagen oficial.
- Página principal con `getStaticProps` para listar los primeros 151 Pokémon.
- Ruta dinámica `pages/pokemon/[name].js` con `getStaticPaths` y `getStaticProps` para detalle de Pokémon.
- Estilos modulares para listado y vista detalle.
- Documentación de la feature en `docs/feature-pokedex-core.md`.

# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [SemVer](https://semver.org/lang/es/).

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

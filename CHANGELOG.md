# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [SemVer](https://semver.org/lang/es/).

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

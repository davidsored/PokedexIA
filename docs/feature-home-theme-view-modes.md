# Feature: Home con tema Pokémon + modos de visualización + mitigación de timeout de imágenes

## Fecha
2026-05-15

## Resumen
Se actualizó la home para que tenga una estética más alineada con Pokémon (fondo, colores y controles visuales).

También se agregó un selector para cambiar entre:
- **Modo Card** (cuadrícula actual)
- **Modo Lista** (lista vertical)

Adicionalmente, se mitigó el ruido de errores de timeout de `next/image` al cargar sprites remotos desde `raw.githubusercontent.com` en desarrollo.

## Cambios técnicos

### 1) Toggle de visualización
- Estado local `viewMode` en `pages/index.tsx`.
- Botones accesibles con `aria-pressed`.
- Cambio dinámico de layout entre `grid` y `list`.

### 2) Adaptación de `PokemonCard`
- Nuevo prop opcional `viewMode`.
- Clase condicional `listItem` para render horizontal cuando se activa modo lista.

### 3) Estética de la home
- Fondo degradado y paleta inspirada en Pokémon.
- Encabezado y subtítulo con mejor jerarquía visual.
- Botones estilo "pill" con estado activo.

### 4) Mitigación de timeout en imágenes
- Se habilitó `images.unoptimized = true` en `next.config.ts`.
- Resultado: el navegador descarga las imágenes directamente, evitando que el optimizador de Next.js actúe como proxy y dispare errores `upstream image response timed out` / `TimeoutError` cuando el host remoto responde lento.

## Impacto esperado
- Menos ruido de errores en consola de desarrollo por timeouts de imágenes remotas.
- Mejor experiencia visual y de navegación en la lista de Pokémon.

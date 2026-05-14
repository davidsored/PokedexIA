# Fix: Unhandled Rejection al ejecutar `npm run dev`

## Problema
Al iniciar el proyecto con Next.js 16.2.6 y Turbopack aparecía este error:

- `TypeError: The "to" argument must be of type string. Received undefined`

## Causa
El proyecto tenía una carpeta `app/` incompleta (sin `app/page.tsx`) mientras la app real estaba en `pages/`. Esta mezcla provocaba un estado inconsistente del enrutador durante el arranque en modo desarrollo.

## Solución aplicada
- Se eliminó la carpeta `app/` (layout/estilos del App Router) para dejar una sola estrategia de enrutado: **Pages Router**.
- Se incrementó la versión del proyecto a `0.1.3` (SemVer patch).
- Se documentó el cambio en `CHANGELOG.md`.

## Validación
- `npm run dev` inicia correctamente sin el `Unhandled Rejection`.

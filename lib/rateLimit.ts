/**
 * Rate limiting en memoria, por IP.
 *
 * Es deliberadamente "best-effort": las funciones serverless son efimeras y no
 * comparten memoria, asi que el contador no es consistente entre instancias.
 * Sirve como barrera contra el abuso trivial del endpoint, no como sistema de
 * cuotas. Evitar Redis o cualquier servicio externo es intencionado: este
 * proyecto no justifica esa infraestructura.
 */

/** Peticiones permitidas por IP dentro de la ventana. */
export const RATE_LIMIT_MAX_REQUESTS = 8;

/** Duracion de la ventana deslizante, en milisegundos. */
export const RATE_LIMIT_WINDOW_MS = 60_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Peticiones que aun se pueden hacer en la ventana actual. */
  remaining: number;
  /** Segundos que faltan para poder reintentar. Solo util si `allowed` es false. */
  retryAfterSeconds: number;
}

/**
 * Registra una peticion de `key` e indica si debe permitirse.
 *
 * `now` es inyectable para poder testear el paso del tiempo sin esperas reales.
 */
export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    hits.set(key, timestamps);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((timestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000),
    };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** Vacia el estado acumulado. Pensado para aislar los tests entre si. */
export function resetRateLimit() {
  hits.clear();
}

/**
 * Deduce la IP del cliente. En Vercel la cabecera fiable es `x-forwarded-for`,
 * cuyo primer valor es la IP original.
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  if (raw) {
    return raw.split(",")[0].trim();
  }

  const realIp = headers["x-real-ip"];
  const fallback = Array.isArray(realIp) ? realIp[0] : realIp;

  return fallback?.trim() || "desconocida";
}

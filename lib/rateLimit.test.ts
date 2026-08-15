import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  resetRateLimit,
} from "./rateLimit";

beforeEach(() => {
  resetRateLimit();
});

test("permite peticiones hasta agotar el limite de la ventana", () => {
  const now = 1_000_000;

  for (let index = 0; index < RATE_LIMIT_MAX_REQUESTS; index += 1) {
    const result = checkRateLimit("1.1.1.1", now);
    assert.equal(result.allowed, true, `la peticion ${index + 1} deberia permitirse`);
  }

  assert.equal(checkRateLimit("1.1.1.1", now).allowed, false);
});

test("informa de cuantas peticiones quedan en la ventana", () => {
  const now = 1_000_000;

  assert.equal(checkRateLimit("1.1.1.1", now).remaining, RATE_LIMIT_MAX_REQUESTS - 1);
  assert.equal(checkRateLimit("1.1.1.1", now).remaining, RATE_LIMIT_MAX_REQUESTS - 2);
});

test("al bloquear indica los segundos que faltan para reintentar", () => {
  const now = 1_000_000;

  for (let index = 0; index < RATE_LIMIT_MAX_REQUESTS; index += 1) {
    checkRateLimit("1.1.1.1", now);
  }

  // A mitad de ventana debe faltar aproximadamente la otra mitad.
  const blocked = checkRateLimit("1.1.1.1", now + RATE_LIMIT_WINDOW_MS / 2);

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterSeconds, RATE_LIMIT_WINDOW_MS / 2 / 1000);
});

test("la ventana es deslizante: al expirar vuelve a permitir", () => {
  const now = 1_000_000;

  for (let index = 0; index < RATE_LIMIT_MAX_REQUESTS; index += 1) {
    checkRateLimit("1.1.1.1", now);
  }

  assert.equal(checkRateLimit("1.1.1.1", now).allowed, false);
  assert.equal(checkRateLimit("1.1.1.1", now + RATE_LIMIT_WINDOW_MS + 1).allowed, true);
});

test("cada IP tiene su propio contador", () => {
  const now = 1_000_000;

  for (let index = 0; index < RATE_LIMIT_MAX_REQUESTS; index += 1) {
    checkRateLimit("1.1.1.1", now);
  }

  assert.equal(checkRateLimit("1.1.1.1", now).allowed, false);
  assert.equal(checkRateLimit("2.2.2.2", now).allowed, true);
});

test("getClientIp usa el primer valor de x-forwarded-for", () => {
  assert.equal(getClientIp({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" }), "203.0.113.5");
});

test("getClientIp acepta x-forwarded-for como array", () => {
  assert.equal(getClientIp({ "x-forwarded-for": ["203.0.113.5"] }), "203.0.113.5");
});

test("getClientIp recurre a x-real-ip si no hay x-forwarded-for", () => {
  assert.equal(getClientIp({ "x-real-ip": "198.51.100.7" }), "198.51.100.7");
});

test("getClientIp devuelve un valor estable si no hay cabeceras de IP", () => {
  assert.equal(getClientIp({}), "desconocida");
});

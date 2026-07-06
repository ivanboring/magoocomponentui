export const DAY_MS = 86_400_000;
/** @param {number} mtimeMs @param {number} nowMs @param {number} [ttlMs] */
export function isStale(mtimeMs, nowMs, ttlMs = DAY_MS) { return nowMs - mtimeMs > ttlMs; }

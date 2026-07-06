import { test } from "node:test";
import assert from "node:assert/strict";
import { isStale } from "./cache.mjs";

test("cache older than 1 day is stale", () => {
  const now = 1_000_000_000_000;
  assert.equal(isStale(now - 86_400_001, now), true);
  assert.equal(isStale(now - 1000, now), false);
});

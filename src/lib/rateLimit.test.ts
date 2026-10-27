import { test } from "node:test";
import assert from "node:assert/strict";
import { getClientIp } from "./rateLimit";

test("prefers Cloudflare's client IP over a spoofable x-forwarded-for", () => {
  const request = new Request("https://example.test", {
    headers: { "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" }
  });
  assert.equal(getClientIp(request), "203.0.113.7");
  assert.equal(getClientIp(new Request("https://example.test", { headers: { "x-forwarded-for": "198.51.100.1, 10.0.0.1" } })), "198.51.100.1");
});

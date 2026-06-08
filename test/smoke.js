// Offline smoke test: verifies key-gating without hitting the network.
const assert = require("assert");
const { EnCarAPI, EnCarAPIError } = require("../src/index.js");

// 1) No key -> throws, message points to encarapi.com
let threw = false;
try {
  // ensure env key does not leak into the test
  delete process.env.ENCARAPI_KEY;
  new EnCarAPI();
} catch (e) {
  threw = true;
  assert.ok(e instanceof EnCarAPIError, "should be EnCarAPIError");
  assert.ok(/encarapi\.com/.test(e.message), "message should link encarapi.com");
}
assert.ok(threw, "constructor without key must throw");

// 2) With a key -> constructs and exposes methods
const client = new EnCarAPI("test_key_123");
assert.strictEqual(typeof client.catalog, "function");
assert.strictEqual(typeof client.nav, "function");
assert.strictEqual(typeof client.vehicle, "function");

console.log("encarapi-node smoke test: OK");

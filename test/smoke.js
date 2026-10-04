// Offline test: key gating, URL building and request shape via a fake fetch.
// Set ENCARAPI_KEY (and optionally CHINACARAPI_KEY) and run with --live for a
// few real read-only calls.
const assert = require("assert");
const { EnCarAPI, ChinaCarAPI, EnCarAPIError } = require("../src/index.js");

const saved = { k: process.env.ENCARAPI_KEY, c: process.env.CHINACARAPI_KEY };
delete process.env.ENCARAPI_KEY;
delete process.env.CHINACARAPI_KEY;

// 1) No key -> clear error pointing to the signup page
assert.throws(() => new EnCarAPI(), (e) => e instanceof EnCarAPIError && /encarapi\.com/.test(e.message));
assert.throws(() => new ChinaCarAPI(), (e) => e instanceof EnCarAPIError && /chinacarapi\.com/.test(e.message));

// 2) Fake fetch records every request
const calls = [];
function fakeFetch(status, payload) {
  return async (url, init) => {
    calls.push({ url: new URL(url), init });
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    return { status, ok: status < 400, text: async () => raw };
  };
}

(async () => {
  const client = new EnCarAPI("kr_key", { fetch: fakeFetch(200, { Count: 1, SearchResults: [{ Id: "1" }] }), chinaKey: "cn_key" });

  await client.korea.catalog({ manufacturer: "BMW", frame_clean: true, options: ["a", "b"], page: undefined });
  let c = calls.pop();
  assert.strictEqual(c.url.origin + c.url.pathname, "https://api.encarapi.com/api/catalog");
  assert.strictEqual(c.url.searchParams.get("manufacturer"), "BMW");
  assert.strictEqual(c.url.searchParams.get("frame_clean"), "true");
  assert.strictEqual(c.url.searchParams.get("options"), "a,b");
  assert.ok(!c.url.searchParams.has("page"), "undefined params are dropped");
  assert.strictEqual(c.init.headers["x-api-key"], "kr_key");

  await client.korea.vehicle("kbc:123");
  c = calls.pop();
  assert.strictEqual(c.url.pathname, "/api/vehicle/kbc%3A123");

  await client.korea.bulkVehicles(["1", "2"]);
  c = calls.pop();
  assert.strictEqual(c.init.method, "POST");
  assert.deepStrictEqual(JSON.parse(c.init.body), { ids: ["1", "2"] });

  await client.china.catalog({ make: "BYD" });
  c = calls.pop();
  assert.strictEqual(c.url.origin, "https://api.chinacarapi.com");
  assert.strictEqual(c.init.headers["x-api-key"], "cn_key");

  // 0.x shortcuts still work
  const r = await client.catalog({});
  assert.strictEqual(r.Count, 1);
  calls.pop();

  // iterateCatalog stops on a short page
  const items = [];
  for await (const it of client.korea.iterateCatalog({ limit: 5 })) items.push(it);
  assert.strictEqual(items.length, 1);
  calls.length = 0;

  // iterateChanges flattens groups and follows the cursor
  const pages = [
    { nextCursor: 10, hasMore: true, added: [{ Id: "a" }], removed: [{ Id: "b" }] },
    { nextCursor: 12, hasMore: false, updated: [{ Id: "c", changedFields: ["price"] }] },
  ];
  const feed = new EnCarAPI("kr_key", {
    fetch: async (url) => {
      calls.push({ url: new URL(url) });
      return { status: 200, ok: true, text: async () => JSON.stringify(pages.shift()) };
    },
  });
  const evs = [];
  for await (const ev of feed.korea.iterateChanges({ since: "2026-10-01T00:00:00Z" })) evs.push(ev);
  assert.deepStrictEqual(evs.map((e) => `${e.type}:${e.Id}`), ["added:a", "removed:b", "updated:c"]);
  assert.strictEqual(calls[1].url.searchParams.get("cursor"), "10");
  assert.ok(!calls[1].url.searchParams.has("since"), "since only on the first call");
  assert.strictEqual(feed.korea.lastCursor, 12);

  // 403 carries status + body (upgrade hint)
  const denied = new EnCarAPI("kr_key", { fetch: fakeFetch(403, { error: "Upgrade to Business" }) });
  await assert.rejects(denied.korea.changes({ cursor: 0 }), (e) => e.status === 403 && /Upgrade to Business/.test(e.body));

  console.log("encarapi offline tests: OK");

  if (process.argv.includes("--live")) {
    process.env.ENCARAPI_KEY = saved.k || "";
    process.env.CHINACARAPI_KEY = saved.c || "";
    const live = new EnCarAPI(saved.k, { chinaKey: saved.c || saved.k });
    if (saved.k) {
      const kr = await live.korea.catalog({ limit: 1, count: true, lang: "en" });
      console.log("live korea count:", kr.Count);
    }
    if (saved.c || saved.k) {
      const cn = await live.china.catalog({ limit: 1 });
      console.log("live china total:", cn.total);
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

// exportToFile() and friends against a local stub HTTP server (real fetch, no API):
// generated-at header, streaming to disk before the response has ended, errors,
// no leftover files, and the new China lang params.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { EnCarAPI, ChinaCarAPI, EnCarAPIError } = require("../src/index.js");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "encarapi-export-"));
test.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

// Starts a stub server; `handler(req, res)` answers. Resolves to { url, requests, close }.
function stub(handler) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, url: new URL(req.url, "http://stub"), headers: req.headers });
    handler(req, res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        requests,
        close: () => new Promise((r) => { server.closeAllConnections(); server.close(r); }),
      });
    });
  });
}

const waitFor = async (cond, ms = 5000) => {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error("timed out waiting for the client to write to disk");
    await new Promise((r) => setTimeout(r, 10));
  }
};

const ROW = "1,Hyundai,Grandeur,2022,28900000\n";

test("korea.exportToFile streams to disk before the response ends and returns the generated-at header", async () => {
  const dest = path.join(tmpDir, "korea.csv");
  const head = "listing_id,manufacturer,model,year,price\n" + ROW.repeat(2000);
  const tail = ROW.repeat(3000);
  let sawPartFile = false;
  const srv = await stub(async (req, res) => {
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "X-Encarapi-Generated-At": "2026-10-22T08:55:00.000Z" });
    res.write(head);
    // Hold the rest back until the client has written the first part to <dest>.part:
    // a client that buffers the whole body would never get there (and time out).
    await waitFor(() => fs.existsSync(`${dest}.part`) && fs.statSync(`${dest}.part`).size >= head.length);
    sawPartFile = true;
    res.end(tail);
  });
  try {
    const client = new EnCarAPI("kr_key", { baseUrl: srv.url });
    const out = await client.korea.exportToFile(dest, { source: "kbc", lang: "ru", sell_type: undefined });
    assert.equal(sawPartFile, true);
    assert.deepEqual(out, { path: dest, bytes: head.length + tail.length, generatedAt: "2026-10-22T08:55:00.000Z" });
    assert.equal(fs.readFileSync(dest, "utf8"), head + tail);
    assert.equal(fs.existsSync(`${dest}.part`), false);
    const req = srv.requests[0];
    assert.equal(req.url.pathname, "/api/catalog/export");
    assert.equal(req.url.searchParams.get("source"), "kbc");
    assert.equal(req.url.searchParams.get("lang"), "ru");
    assert.equal(req.url.searchParams.has("sell_type"), false);
    assert.equal(req.headers["x-api-key"], "kr_key");
    assert.equal(req.headers.accept, "text/csv");
  } finally {
    await srv.close();
  }
});

test("korea.exportToFile with compress=true writes the decompressed CSV", async () => {
  const dest = path.join(tmpDir, "korea-gz.csv");
  const csv = "listing_id\n" + ROW.repeat(500);
  const srv = await stub((req, res) => {
    res.writeHead(200, { "Content-Type": "text/csv", "Content-Encoding": "gzip", "X-Encarapi-Generated-At": "2026-10-22T09:00:00.000Z" });
    res.end(zlib.gzipSync(csv));
  });
  try {
    const out = await new EnCarAPI("kr_key", { baseUrl: srv.url }).korea.exportToFile(dest, { compress: true });
    assert.equal(srv.requests[0].url.searchParams.get("compress"), "true");
    assert.equal(out.bytes, Buffer.byteLength(csv));
    assert.equal(fs.readFileSync(dest, "utf8"), csv);
  } finally {
    await srv.close();
  }
});

test("korea truck and equipment exports go to their endpoints", async () => {
  const srv = await stub((req, res) => {
    res.writeHead(200, { "Content-Type": "text/csv", "X-Encarapi-Generated-At": "2026-10-22T10:00:00.000Z" });
    res.end("listing_id\n1\n");
  });
  try {
    const korea = new EnCarAPI("kr_key", { baseUrl: srv.url }).korea;
    const t = await korea.exportTrucksToFile(path.join(tmpDir, "trucks.csv"));
    const e = await korea.exportEquipmentToFile(path.join(tmpDir, "equipment.csv"), { compress: false });
    assert.deepEqual(srv.requests.map((r) => r.url.pathname), ["/api/catalog/trucks/export", "/api/catalog/equipment/export"]);
    assert.equal(srv.requests[1].url.searchParams.get("compress"), "false");
    assert.equal(t.generatedAt, "2026-10-22T10:00:00.000Z");
    assert.equal(e.bytes, Buffer.byteLength("listing_id\n1\n"));
  } finally {
    await srv.close();
  }
});

test("china.exportToFile reads x-generated-at and passes lang=ru", async () => {
  const dest = path.join(tmpDir, "china-ru.csv");
  const csv = "source,id,make,city\ndongchedi,357018451,Audi,Чжэнчжоу\n";
  const srv = await stub((req, res) => {
    res.writeHead(200, { "Content-Type": "text/csv", "x-generated-at": "2026-10-22T07:40:00.000Z", "Content-Disposition": 'attachment; filename="china-catalog-ru.csv"' });
    res.end(csv);
  });
  try {
    const out = await new ChinaCarAPI("cn_key", { baseUrl: srv.url }).exportToFile(dest, { lang: "ru" });
    assert.deepEqual(out, { path: dest, bytes: Buffer.byteLength(csv), generatedAt: "2026-10-22T07:40:00.000Z" });
    assert.equal(fs.readFileSync(dest, "utf8"), csv);
    assert.equal(srv.requests[0].url.pathname, "/api/catalog/export");
    assert.equal(srv.requests[0].url.searchParams.get("lang"), "ru");
    assert.equal(srv.requests[0].headers["x-api-key"], "cn_key");
  } finally {
    await srv.close();
  }
});

test("missing generated-at header gives generatedAt null", async () => {
  const srv = await stub((req, res) => res.end("a\n"));
  try {
    const out = await new ChinaCarAPI("cn_key", { baseUrl: srv.url }).exportToFile(path.join(tmpDir, "nohdr.csv"));
    assert.equal(out.generatedAt, null);
  } finally {
    await srv.close();
  }
});

test("403 throws EnCarAPIError and leaves no file behind", async () => {
  const dest = path.join(tmpDir, "denied.csv");
  const srv = await stub((req, res) => {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "The full catalog export requires a Business or Scale plan." }));
  });
  try {
    await assert.rejects(
      new ChinaCarAPI("cn_key", { baseUrl: srv.url }).exportToFile(dest),
      (e) => e instanceof EnCarAPIError && e.status === 403 && /Business or Scale/.test(e.body)
    );
    assert.equal(fs.existsSync(dest), false);
    assert.equal(fs.existsSync(`${dest}.part`), false);
  } finally {
    await srv.close();
  }
});

test("a download aborted mid-stream rejects, removes the .part file and keeps an existing file", async () => {
  const dest = path.join(tmpDir, "aborted.csv");
  fs.writeFileSync(dest, "previous export\n");
  const srv = await stub((req, res) => {
    res.writeHead(200, { "Content-Type": "text/csv", "Content-Length": "100000", "x-generated-at": "2026-10-22T07:40:00.000Z" });
    res.write("source,id\n" + "dongchedi,1\n".repeat(100));
    setTimeout(() => res.destroy(), 50);
  });
  try {
    await assert.rejects(new ChinaCarAPI("cn_key", { baseUrl: srv.url }).exportToFile(dest));
    assert.equal(fs.readFileSync(dest, "utf8"), "previous export\n");
    assert.equal(fs.existsSync(`${dest}.part`), false);
  } finally {
    await srv.close();
  }
});

test("fetch stand-ins without a body stream still work (text fallback)", async () => {
  const dest = path.join(tmpDir, "fake.csv");
  const fake = async () => ({ status: 200, ok: true, headers: new Headers({ "x-generated-at": "2026-10-22T07:40:00.000Z" }), text: async () => "a,b\n1,2\n" });
  const out = await new ChinaCarAPI("cn_key", { fetch: fake }).exportToFile(dest);
  assert.deepEqual(out, { path: dest, bytes: 8, generatedAt: "2026-10-22T07:40:00.000Z" });
});

test("China lang=ru reaches catalog, vehicle, by-url, bulk, specs and enums; exportCsv stays text", async () => {
  const calls = [];
  const fake = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return { status: 200, ok: true, text: async () => (String(url).includes("/export") ? "a,b\n" : "{}") };
  };
  const cn = new ChinaCarAPI("cn_key", { fetch: fake });
  await cn.catalog({ make: "BYD", lang: "ru" });
  await cn.vehicle("357018451", { lang: "ru" });
  await cn.vehicleByUrl("https://www.dongchedi.com/usedcar/20984385", { lang: "ru" });
  await cn.bulkVehicles(["1"], { lang: "ru" });
  await cn.specs(62342, { lang: "ru" });
  await cn.enums({ lang: "ru" });
  assert.deepEqual(
    calls.map((c) => `${c.url.pathname}?lang=${c.url.searchParams.get("lang")}`),
    ["/api/catalog", "/api/vehicle/357018451", "/api/vehicle/by-url", "/api/vehicle/bulk", "/api/specs/62342", "/api/enums"].map((p) => `${p}?lang=ru`)
  );
  await cn.specs(62342);
  assert.equal(calls.at(-1).url.search, "", "specs without params sends no query");
  assert.equal(await cn.exportCsv({ lang: "ru" }), "a,b\n");
  assert.equal(calls.at(-1).url.searchParams.get("lang"), "ru");
});

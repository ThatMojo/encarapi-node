"use strict";

const fs = require("fs");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");

class EnCarAPIError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "EnCarAPIError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Minimal fetch wrapper shared by the Korea and China clients. Sends the API key
 * as `x-api-key`, drops undefined/null params, and turns 401/403 into an error
 * that carries the server message (which includes upgrade hints for plan-gated
 * endpoints) plus a link to the signup page.
 */
class HttpClient {
  constructor({ apiKey, baseUrl, signupUrl, product, fetchImpl }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.signupUrl = signupUrl;
    this.product = product;
    this.fetch = fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (!this.fetch) {
      throw new EnCarAPIError("Global fetch is not available: Node.js 18+ is required (or pass options.fetch).");
    }
  }

  async _fetch(method, path, { params, body, accept }) {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params || {})) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
    return this.fetch(url, {
      method,
      headers: {
        "x-api-key": this.apiKey,
        Accept: accept,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  _check(res, raw) {
    if (res.status === 401 || res.status === 403) {
      throw new EnCarAPIError(
        `${this.product} rejected the request (${res.status}). Check your key or plan at ${this.signupUrl}. Body: ${raw.slice(0, 300)}`,
        res.status,
        raw
      );
    }
    if (!res.ok) {
      throw new EnCarAPIError(`${this.product} error ${res.status}: ${raw.slice(0, 300)}`, res.status, raw);
    }
  }

  async request(method, path, { params, body, text } = {}) {
    const res = await this._fetch(method, path, { params, body, accept: text ? "text/csv" : "application/json" });
    const raw = await res.text();
    this._check(res, raw);
    if (text) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  /**
   * Streams a GET response (a CSV export) to the file `dest` without holding it in
   * memory. The data goes to `<dest>.part` first and is renamed when complete, so an
   * aborted download never leaves a truncated file under the final name. Resolves to
   * { path, bytes, generatedAt }: bytes written (after any transfer decompression) and
   * the value of the `generatedAtHeader` response header (null if absent).
   */
  async download(path, dest, { params, generatedAtHeader } = {}) {
    const res = await this._fetch("GET", path, { params, accept: "text/csv" });
    if (!res.ok) this._check(res, await res.text());
    let source;
    if (res.body && typeof res.body.getReader === "function") source = Readable.fromWeb(res.body);
    else if (res.body && typeof res.body.pipe === "function") source = res.body; // e.g. node-fetch
    else source = Readable.from([Buffer.from(await res.text())]); // fetch stand-ins without a body stream
    let bytes = 0;
    const count = new Transform({
      transform(chunk, _encoding, done) {
        bytes += chunk.length;
        done(null, chunk);
      },
    });
    const tmp = `${dest}.part`;
    try {
      await pipeline(source, count, fs.createWriteStream(tmp));
      await fs.promises.rename(tmp, dest);
    } catch (e) {
      await fs.promises.unlink(tmp).catch(() => {});
      throw e;
    }
    const generatedAt = (res.headers && typeof res.headers.get === "function" && res.headers.get(generatedAtHeader)) || null;
    return { path: dest, bytes, generatedAt };
  }
}

module.exports = { HttpClient, EnCarAPIError };

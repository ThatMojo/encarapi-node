"use strict";

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

  async request(method, path, { params, body, text } = {}) {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params || {})) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
    const res = await this.fetch(url, {
      method,
      headers: {
        "x-api-key": this.apiKey,
        Accept: text ? "text/csv" : "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await res.text();
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
    if (text) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}

module.exports = { HttpClient, EnCarAPIError };

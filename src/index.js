"use strict";

const DEFAULT_BASE_URL = "https://api.encarapi.com";
const SIGNUP_URL = "https://encarapi.com";

class EnCarAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = "EnCarAPIError";
  }
}

/**
 * Official Node.js client for the EnCarAPI — Korean car data API (Encar.com).
 *
 * An EnCarAPI key is REQUIRED. Get one (5-day trial) at https://encarapi.com.
 *
 *   const { EnCarAPI } = require("encarapi");
 *   const client = new EnCarAPI(process.env.ENCARAPI_KEY);
 *   const cars = await client.catalog({ count: true });
 *   const detail = await client.vehicle("12345678");
 */
class EnCarAPI {
  constructor(apiKey, options = {}) {
    apiKey = apiKey || process.env.ENCARAPI_KEY;
    if (!apiKey) {
      throw new EnCarAPIError(
        "An EnCarAPI key is required. Pass new EnCarAPI('YOUR_KEY') or set the " +
          `ENCARAPI_KEY environment variable. Get a key at ${SIGNUP_URL}`
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    if (typeof fetch !== "function") {
      throw new EnCarAPIError(
        "global fetch is not available — Node.js 18+ is required (or provide a fetch polyfill)."
      );
    }
  }

  async _get(path, params) {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url, {
      headers: { "x-api-key": this.apiKey, Accept: "application/json" },
    });
    const body = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new EnCarAPIError(
        `EnCarAPI rejected the request (${res.status}). Check your key or subscription ` +
          `at ${SIGNUP_URL}. Body: ${body.slice(0, 300)}`
      );
    }
    if (!res.ok) {
      throw new EnCarAPIError(`EnCarAPI error ${res.status}: ${body.slice(0, 300)}`);
    }
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  /** Search & filter the Korean car catalog (Encar.com listings). */
  catalog(params) {
    return this._get("/api/catalog", params);
  }

  /** Filter facets / navigation metadata (brands, models, counts). */
  nav(params) {
    return this._get("/api/nav", params);
  }

  /** Full detail for one vehicle: specs, options, inspection, price. */
  vehicle(vehicleId) {
    return this._get(`/api/vehicle/${encodeURIComponent(vehicleId)}`);
  }
}

module.exports = { EnCarAPI, EnCarAPIError };

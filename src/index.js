"use strict";

const { EnCarAPIError } = require("./http");
const { KoreaClient } = require("./korea");
const { ChinaClient } = require("./china");

/**
 * Official Node.js client for EnCarAPI: Korean used-car data (Encar, KB Chachacha,
 * K Car) and Chinese used-car data (Dongchedi, Che168) through one package.
 *
 * An API key is REQUIRED. Get one at https://encarapi.com (Korea) or
 * https://chinacarapi.com (China). EnCarAPI keys with the China add-on work for both.
 *
 *   const { EnCarAPI } = require("encarapi");
 *   const client = new EnCarAPI(process.env.ENCARAPI_KEY);
 *   const kr = await client.korea.catalog({ manufacturer: "Hyundai", lang: "en", count: true });
 *   const cn = await client.china.catalog({ make: "BYD", limit: 25 });
 */
class EnCarAPI {
  constructor(apiKey, options = {}) {
    apiKey = apiKey || process.env.ENCARAPI_KEY;
    const chinaKey = options.chinaKey || process.env.CHINACARAPI_KEY || apiKey;
    if (!apiKey && !chinaKey) {
      throw new EnCarAPIError(
        "An API key is required. Pass new EnCarAPI('YOUR_KEY') or set ENCARAPI_KEY " +
          "(Korea) / CHINACARAPI_KEY (China). Get a key at https://encarapi.com/?utm_source=sdk&utm_medium=encarapi-node&utm_content=error"
      );
    }
    this._apiKey = apiKey;
    this._chinaKey = chinaKey;
    this._options = options;
  }

  /** Korean data: Encar (default), KB Chachacha (source "kbc"), K Car (source "kcar"). */
  get korea() {
    if (!this._korea) {
      if (!this._apiKey) {
        throw new EnCarAPIError("An EnCarAPI key is required for Korean data. Get one at https://encarapi.com/?utm_source=sdk&utm_medium=encarapi-node&utm_content=error");
      }
      this._korea = new KoreaClient(this._apiKey, { baseUrl: this._options.baseUrl, fetch: this._options.fetch });
    }
    return this._korea;
  }

  /** Chinese data: Dongchedi and Che168 (ChinaCarAPI key or EnCarAPI key with the China add-on). */
  get china() {
    if (!this._china) {
      this._china = new ChinaClient(this._chinaKey, { baseUrl: this._options.chinaBaseUrl, fetch: this._options.fetch });
    }
    return this._china;
  }

  // Backwards compatible shortcuts from 0.x (Korean catalog).
  catalog(params) { return this.korea.catalog(params); }
  nav(params) { return this.korea.nav(params); }
  vehicle(id, params) { return this.korea.vehicle(id, params); }
}

/**
 * China-only entry point (also published as the `chinacarapi` package).
 *
 *   const { ChinaCarAPI } = require("encarapi");
 *   const client = new ChinaCarAPI(process.env.CHINACARAPI_KEY);
 */
class ChinaCarAPI extends ChinaClient {
  constructor(apiKey, options = {}) {
    apiKey = apiKey || process.env.CHINACARAPI_KEY;
    if (!apiKey) {
      throw new EnCarAPIError(
        "A ChinaCarAPI key is required. Pass new ChinaCarAPI('YOUR_KEY') or set CHINACARAPI_KEY. " +
          "Get a key at https://chinacarapi.com/?utm_source=sdk&utm_medium=encarapi-node&utm_content=error"
      );
    }
    super(apiKey, options);
  }
}

module.exports = {
  EnCarAPI,
  ChinaCarAPI,
  KoreaClient,
  ChinaClient,
  EnCarAPIError,
  ChinaCarAPIError: EnCarAPIError,
};

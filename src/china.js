"use strict";

const { HttpClient } = require("./http");

const enc = encodeURIComponent;

// /api/catalog serves at most this many results per query (page * limit).
const CATALOG_DEPTH = 10000;

/**
 * Chinese used-car data (Dongchedi and Che168) in English. Works with a
 * ChinaCarAPI key or an EnCarAPI key that has the China add-on.
 */
class ChinaClient {
  constructor(apiKey, options = {}) {
    this.http = new HttpClient({
      apiKey,
      baseUrl: options.baseUrl || "https://api.chinacarapi.com",
      signupUrl: "https://chinacarapi.com",
      product: "ChinaCarAPI",
      fetchImpl: options.fetch,
    });
  }

  /** Search listings. Filters: source, make, model, year_min/max, price_min/max (CNY), mileage_max, city, fuel, has_report, export_ready, sort, page, limit, lang. */
  catalog(params) { return this.http.request("GET", "/api/catalog", { params }); }

  /**
   * Async iterator over all catalog pages: for await (const car of china.iterateCatalog({...})) {}
   * Stops at the API's 10,000-result depth limit; for the whole catalog use
   * exportCsv() plus iterateChanges().
   */
  async *iterateCatalog(params = {}) {
    const limit = Math.min(params.limit || 100, 100);
    for (let page = params.page || 1; ; page++) {
      const res = await this.catalog({ ...params, limit, page });
      const items = res.results || [];
      for (const item of items) yield item;
      if (items.length < limit || (page + 1) * limit > CATALOG_DEPTH) return;
    }
  }

  /** Full record for one car: price history, photos, seller, export status, alsoListedOn. */
  vehicle(id, params) { return this.http.request("GET", `/api/vehicle/${enc(id)}`, { params }); }

  /** Inspection report: accident, flood and fire checks, battery data for EVs. */
  inspection(id, params) { return this.http.request("GET", `/api/inspection/${enc(id)}`, { params }); }

  /** Up to 500 full records in one call (Business/Scale). */
  bulkVehicles(ids, params) { return this.http.request("POST", "/api/vehicle/bulk", { params, body: { ids } }); }

  /** Alias of bulkVehicles (name used by the standalone chinacarapi 0.x client). */
  bulk(ids, params) { return this.bulkVehicles(ids, params); }

  /** Change feed: { since } once, then { cursor: nextCursor } (Business/Scale). */
  changes(params) { return this.http.request("GET", "/api/catalog/changes", { params }); }

  /**
   * Follows the change feed until it is drained and yields every event once:
   * { id, source, vehicleId, type: "new" | "price" | "removed" | "relisted", oldPrice, newPrice, at }.
   * Pass { since } (right after an export) or { cursor } to start; after the loop,
   * `china.lastCursor` holds the cursor to resume from next time.
   */
  async *iterateChanges(params = {}) {
    let query = { ...params };
    for (;;) {
      const res = await this.changes(query);
      for (const item of res.changes || []) yield item;
      if (res.nextCursor !== undefined) this.lastCursor = res.nextCursor;
      if (!res.hasMore || res.nextCursor === undefined) return;
      query = { ...params, since: undefined, cursor: res.nextCursor };
    }
  }

  /** Full catalog as CSV text (Business/Scale). */
  exportCsv(params) { return this.http.request("GET", "/api/catalog/export", { params, text: true }); }

  /** Filter values with counts: makes, fuels, cities, sources, sorts. */
  enums(params) { return this.http.request("GET", "/api/enums", { params }); }

  /** Models of one make (id or English name) with counts. */
  models(make) { return this.http.request("GET", "/api/models", { params: { make } }); }
}

module.exports = { ChinaClient };

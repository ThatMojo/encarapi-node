"use strict";

const { HttpClient } = require("./http");

const enc = encodeURIComponent;

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

  /** Full record for one car: price history, photos, seller, export status, alsoListedOn. */
  vehicle(id, params) { return this.http.request("GET", `/api/vehicle/${enc(id)}`, { params }); }

  /** Inspection report: accident, flood and fire checks, battery data for EVs. */
  inspection(id, params) { return this.http.request("GET", `/api/inspection/${enc(id)}`, { params }); }

  /** Up to 500 full records in one call (Business/Scale). */
  bulkVehicles(ids, params) { return this.http.request("POST", "/api/vehicle/bulk", { params, body: { ids } }); }

  /** Change feed: { since } once, then { cursor: nextCursor } (Business/Scale). */
  changes(params) { return this.http.request("GET", "/api/catalog/changes", { params }); }

  /** Full catalog as CSV text (Business/Scale). */
  exportCsv(params) { return this.http.request("GET", "/api/catalog/export", { params, text: true }); }

  /** Filter values with counts: makes, fuels, cities, sources, sorts. */
  enums(params) { return this.http.request("GET", "/api/enums", { params }); }

  /** Models of one make (id or English name) with counts. */
  models(make) { return this.http.request("GET", "/api/models", { params: { make } }); }
}

module.exports = { ChinaClient };

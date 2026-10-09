"use strict";

const { HttpClient } = require("./http");

const enc = encodeURIComponent;

/**
 * Korean used-car data: Encar plus KB Chachacha (`source: "kbc"`) and K Car
 * (`source: "kcar"`). Encar is the default source; pass `source: "all"` for the
 * deduplicated union. Endpoints marked Business/Scale return 403 with an upgrade
 * hint on smaller plans.
 */
class KoreaClient {
  constructor(apiKey, options = {}) {
    this.http = new HttpClient({
      apiKey,
      baseUrl: options.baseUrl || "https://api.encarapi.com",
      signupUrl: "https://encarapi.com/?utm_source=sdk&utm_medium=encarapi-node&utm_content=error#pricing",
      product: "EnCarAPI",
      fetchImpl: options.fetch,
    });
  }

  // -- search ----------------------------------------------------------------

  /** Search & list vehicles. Flat English filters, e.g. { manufacturer: "BMW", max_mileage: 50000, lang: "en" }. */
  catalog(params) { return this.http.request("GET", "/api/catalog", { params }); }

  /** Lease-takeover and rental listings (same filters as catalog). */
  leasing(params) { return this.http.request("GET", "/api/catalog/leasing", { params }); }

  /** Filter facets with counts (the navigation tree). */
  nav(params) { return this.http.request("GET", "/api/nav", { params }); }

  /** Valid filter values for the flat parameters. */
  enums(params) { return this.http.request("GET", "/api/enums", { params }); }

  /** Model autocomplete across brands. */
  modelSearch(search, params) { return this.http.request("GET", "/api/model-search", { params: { ...params, search } }); }

  /** Async iterator over all catalog pages: for await (const car of korea.iterateCatalog({...})) {} */
  async *iterateCatalog(params = {}) {
    const limit = params.limit || 100;
    for (let page = params.page || 1; ; page++) {
      const res = await this.catalog({ ...params, limit, page });
      const items = res.SearchResults || [];
      for (const item of items) yield item;
      if (items.length < limit) return;
    }
  }

  // -- one vehicle -------------------------------------------------------------

  /** Full vehicle detail. Ids: Encar id, "kbc:<id>" or "kcar:<id>". */
  vehicle(id, params) { return this.http.request("GET", `/api/vehicle/${enc(id)}`, { params }); }

  /** Official inspection report (성능점검). */
  inspection(id) { return this.http.request("GET", `/api/inspection/${enc(id)}`); }

  /** Insurance accident & ownership record. */
  record(id) { return this.http.request("GET", `/api/record/${enc(id)}`); }

  /** Ask for a fresh copy of one listing (daily quota per plan). */
  refresh(id) { return this.http.request("POST", `/api/vehicle/${enc(id)}/refresh`); }

  /** Price check (beta, Scale): below / in line with / above the market. */
  priceCheck(id) { return this.http.request("GET", `/api/price-check/${enc(id)}`); }

  /** Inspection report versions (Business/Scale). */
  inspectionVersions(id) { return this.http.request("GET", `/api/inspection/${enc(id)}/versions`); }

  /** Insurance record versions (Business/Scale). */
  recordVersions(id) { return this.http.request("GET", `/api/record/${enc(id)}/versions`); }

  // -- bulk & sync (Business/Scale) ---------------------------------------------

  /** Up to 500 vehicle details in one call. */
  bulkVehicles(ids) { return this.http.request("POST", "/api/vehicle/bulk", { body: { ids } }); }

  /** Up to 500 inspection reports in one call. */
  bulkInspections(ids) { return this.http.request("POST", "/api/inspection/bulk", { body: { ids } }); }

  /** Up to 500 insurance records in one call. */
  bulkRecords(ids) { return this.http.request("POST", "/api/record/bulk", { body: { ids } }); }

  /** Incremental change feed: { cursor } from the previous call, or { since } right after an export. */
  changes(params) { return this.http.request("GET", "/api/catalog/changes", { params }); }

  /**
   * Follows the change feed until it is drained and yields every change once as
   * { type: "added" | "updated" | "reappeared" | "removed", ...item }. Pass
   * { since } (right after an export) or { cursor } to start; after the loop,
   * `korea.lastCursor` holds the cursor to resume from next time.
   */
  async *iterateChanges(params = {}) {
    let query = { ...params };
    for (;;) {
      const res = await this.changes(query);
      for (const type of ["added", "updated", "reappeared", "removed"]) {
        for (const item of res[type] || []) yield { type, ...item };
      }
      if (res.nextCursor !== undefined) this.lastCursor = res.nextCursor;
      if (!(res.hasMore || res.truncated) || res.nextCursor === undefined) return;
      query = { ...params, since: undefined, cursor: res.nextCursor };
    }
  }

  /** Full catalog as CSV text. */
  exportCsv(params) { return this.http.request("GET", "/api/catalog/export", { params, text: true }); }

  // -- reference data -------------------------------------------------------------

  /** All makes as CSV. */
  makesCsv(params) { return this.http.request("GET", "/api/taxonomy/makes.csv", { params, text: true }); }

  /** All models as CSV. */
  modelsCsv(params) { return this.http.request("GET", "/api/taxonomy/models.csv", { params, text: true }); }

  /** All badges (trims) as CSV. */
  badgesCsv(params) { return this.http.request("GET", "/api/taxonomy/badges.csv", { params, text: true }); }
}

module.exports = { KoreaClient };

# Changelog

## 1.2.0

- `korea.iterateCatalogById(params)` / `korea.iterateLeasingById(params)`: complete, stable
  traversal via `sort=id` + `after` (keyset cursor). Listings never shift between pages while
  the catalog changes, so nothing is repeated or skipped.
- Types: `region`, `city`, `after` and `sort: "id"` on `KoreaCatalogParams`; `nextAfter` and
  `hasMore` on `KoreaCatalogResponse`; `sell_type` on `korea.exportCsv()` (lease and rental
  inventory: `{ sell_type: "lease,rental" }`).
- Catalog items now carry `Region` and `City`; `removed` change events carry `removalReason`
  (API release October 2026, no SDK change needed to receive them).

## 1.1.0

- `china.iterateCatalog(params)`: async iterator over all China catalog pages. Stops at the
  API's 10,000-result depth limit; use `exportCsv()` plus `iterateChanges()` for the full catalog.
- `china.iterateChanges(params)`: follows the China change feed until it is drained and yields
  every event once. `china.lastCursor` holds the cursor to resume from.
- Types: `ChinaChangesParams`, `ChinaChange`, `ChinaChangesResponse`; `source` on
  `china.vehicle()` and `china.inspection()`.

## 1.0.0

- One client for Korea (Encar, KB Chachacha, K Car) and China (Dongchedi, Che168), all endpoints.

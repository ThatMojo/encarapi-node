# Changelog

## 1.1.0

- `china.iterateCatalog(params)`: async iterator over all China catalog pages. Stops at the
  API's 10,000-result depth limit; use `exportCsv()` plus `iterateChanges()` for the full catalog.
- `china.iterateChanges(params)`: follows the China change feed until it is drained and yields
  every event once. `china.lastCursor` holds the cursor to resume from.
- Types: `ChinaChangesParams`, `ChinaChange`, `ChinaChangesResponse`; `source` on
  `china.vehicle()` and `china.inspection()`.

## 1.0.0

- One client for Korea (Encar, KB Chachacha, K Car) and China (Dongchedi, Che168), all endpoints.

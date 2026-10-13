# Changelog

## 1.3.0

- Trucks, buses and special vehicles (Encar Truck, Business/Scale): `korea.trucks(params)`,
  `korea.truckEnums()`, `korea.trucksCsv()`, `korea.iterateTrucksById(params)`; type `KoreaTruckParams`.
- Used excavators (굴삭기나라, Business/Scale): `korea.equipment(params)`, `korea.equipmentEnums()`,
  `korea.equipmentCsv()`, `korea.iterateEquipmentById(params)`; type `KoreaEquipmentParams`.
- `korea.vehicleByVin(vin)`: every Encar / K Car listing of one VIN, active and removed (Business/Scale).
- The catalog `region` filter now also works with a single other source (`source: "kbc"` or `"kcar"`).

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

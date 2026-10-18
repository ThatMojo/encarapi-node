# Changelog

## 1.5.0

- China: `china.vehicleByUrl(url)` (`GET /api/vehicle/by-url`) returns the full record for a Che168 or
  Dongchedi listing link - desktop, mobile site (e.g. `m.che168.com/cardetail/index?infoid=...`) or app,
  also inside a pasted share text. Short links are not resolved.
- China: `catalog()` accepts `power_min` / `power_max` (hp). With either set, cars without a known power
  figure are left out.

## 1.4.2

- Types and docs only, no runtime change: `KoreaChange` now declares `IsDuplicate` and `DuplicateOf`.
  KB Chachacha listings that duplicate an active Encar listing (matched by the Korean plate number or,
  when KB Chachacha publishes no plate, by first registration month, mileage and price; recomputed once a
  day) are not served by the catalog endpoints, with or without `source` (also not with
  `source: "kbc"` alone). In `korea.changes({ source: "kbc" })` and `korea.vehicle("kbc:...")` they carry
  `IsDuplicate: true` and `DuplicateOf` (the Encar listing id); setting or clearing the flag arrives as an
  `updated` event with `duplicate` in `changedFields`. To keep a local copy consistent with the catalog,
  drop KB Chachacha items that arrive with `IsDuplicate: true` and add them back when an update arrives
  without it.
- API release 18 October 2026: the matching was improved (plate-based). The KB Chachacha feed carries one
  `updated` event with `duplicate` for every currently flagged listing.

## 1.4.1

- Korea change feed: every entry now carries `eventId` (its position in the log, same scale as `nextCursor`)
  and `occurredAt`. `iterateChanges()` yields the entries of a page in event order across the groups, so a
  later event for the same listing always comes last (e.g. `removed` after `updated`).

## 1.4.0

- `china.specs(trimId)`: Autohome specification sheet of a Che168 trim (displacement in cc, power in kW
  and hp also for EVs, torque, emission standard, wheelbase, weights, tank, gears, drive type, EV battery).
- China vehicle records now carry `manufactureDate` (Che168, month of manufacture where published) and a
  `specs` object with the key figures of the trim sheet; the CSV export gained `manufacture_date`,
  `displacement_cc` and `power_kw`.

## 1.3.1

- `korea.truck(id)`: one truck with detail page, inspection report, cargo box dimensions, VIN and plate.

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

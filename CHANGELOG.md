# Changelog

## 1.7.1

- Types and docs only, no runtime change: `KoreaChange` now declares `InsuranceClaims` (KB Chachacha only;
  `null` = not known yet): the number of insurance accident records KB Chachacha shows for the car. The same
  number is on KB Chachacha items of `korea.catalog({ source })`, in `korea.vehicle("kbc:...")` /
  `bulkVehicles()`, and in the new last column `insurance_claims` of `exportCsv({ source })` (empty for
  Encar and K Car rows).
- API release 26 October 2026: a change of the count arrives as an `updated` event with `accident` in
  `changedFields`. Listings that already existed got the count without an event - pull
  `exportCsv({ source: "kbc" })` once to fill it in a local copy.

## 1.7.0

- New: `korea.exportToFile(path, params)` and `china.exportToFile(path, params)` stream the full catalog
  export to a file without holding it in memory and resolve to `{ path, bytes, generatedAt }`. `generatedAt`
  is the export's timestamp header (Korea `X-Encarapi-Generated-At`, China `x-generated-at`): pass it as
  `since` to `changes()` / `iterateChanges()` for the first sync, then continue with the cursor. The file is
  written to `<path>.part` and renamed when complete. Same for the Korea truck and equipment exports:
  `korea.exportTrucksToFile()` and `korea.exportEquipmentToFile()`. `exportCsv()`, `trucksCsv()` and
  `equipmentCsv()` are unchanged.
- China: Russian values (API release 22 October 2026). `catalog`, `vehicle`, `vehicleByUrl`,
  `bulkVehicles` and `specs` take `lang: "ru"` (new type `ChinaLang` = `"en" | "zh" | "ru"`): fuel,
  transmission, drivetrain, colours, seller type, condition, vehicle class, city names and equipment names
  in Russian; make, model and trim names stay Latin. `enums({ lang: "ru" })` adds `nameRu` to fuels and
  cities, `exportCsv({ lang: "ru" })` returns the label columns in Russian.
- `china.specs(trimId, params)` now passes params (`lang`); before, it took none.
- Types: `KoreaExportParams` (adds `compress`), `ChinaExportParams`, `ExportFileResult`.

## 1.6.0

- Russian and German values (API release 22 October 2026): every Korea call that takes `lang: "en"` now also
  takes `lang: "ru"` or `lang: "de"` (new type `KoreaLang`). Display values (fuel, transmission, colors, body
  class, sell type, regions, options; with `"de"` also model and trim names) come in Russian or German, ids and
  codes stay the same, and the filters accept these values as well.
- `korea.bulkVehicles(ids, { lang })` passes `lang` like `vehicle()` (before, it took no options).
- Types: `enums()`, `exportCsv()`, `makesCsv()`, `modelsCsv()` and `badgesCsv()` accept `lang: "ru" | "de"`
  (`nameRu` / `nameDe` in the enums, an extra `*_ru` / `*_de` column in the reference CSVs, the label columns
  of the export in Russian / German).

## 1.5.1

- Types and docs only, no runtime change: `KoreaChange` now declares `Accident`, `SimpleRepair` and
  `InspectionAvailable` (Encar only; `null` = not known yet). They carry the accident status from Encar's
  performance inspection; `exportCsv()` has the same data in the new last columns `accident`,
  `simple_repair` and `inspection_available` (empty = not known, `inspection_available=false` = no
  inspection report at our last detail fetch).
- API release 22 October 2026: when a listing's detail is collected for the first time, the change feed
  sends one extra `updated` event with `inspection` in `changedFields` (about one per new listing), so a
  local copy learns the accident status. A change to the simple-repair flag alone now arrives with
  `accident`. Existing local copies: pull `exportCsv()` once to fill the new columns for listings that
  get no event.

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

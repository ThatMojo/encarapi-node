# EnCarAPI: Node.js client for Korean and Chinese used car data

Official **Node.js / TypeScript client** for [EnCarAPI](https://encarapi.com/?utm_source=readme&utm_medium=encarapi-node), the REST
**Encar API** and **Korean Car API**. One package for:

- **Korea:** Encar.com, KB Chachacha (`source: "kbc"`) and K Car (`source: "kcar"`), with
  photos, specs, options, inspection reports, accident and ownership records, condition
  reports, price history, a change feed and full catalog export.
- **China:** Dongchedi and Che168 in English via [ChinaCarAPI](https://chinacarapi.com/?utm_source=readme&utm_medium=encarapi-node)
  (separate key or the China add-on for EnCarAPI keys).

Built for car exporters, dealers and marketplaces that need reliable used car data without
scraping, proxies or geo-blocks.

> **An API key is required.** The data is a paid service. Get a key (5-day trial) at
> **[encarapi.com](https://encarapi.com/?utm_source=readme&utm_medium=encarapi-node)**.

## Install

```bash
npm install encarapi
```

Requires Node.js 18+ (uses the global `fetch`). No dependencies. TypeScript types included.

## Quick start

```js
const { EnCarAPI } = require("encarapi");

const client = new EnCarAPI("YOUR_API_KEY"); // or set ENCARAPI_KEY

// Search Korean listings with flat English filters
const cars = await client.korea.catalog({
  manufacturer: "Hyundai",
  max_mileage: 60000,
  frame_clean: true,   // accident-free chassis only
  lang: "en",
  count: true,
});
console.log(cars.Count, cars.SearchResults[0]);

// Full detail, inspection report and insurance record for one car
const detail = await client.korea.vehicle("12345678");
const inspection = await client.korea.inspection("12345678");
const record = await client.korea.record("12345678");

// KB Chachacha and K Car listings, or all three marketplaces deduplicated
const kbc = await client.korea.catalog({ source: "kbc", limit: 20 });
const all = await client.korea.catalog({ source: "all", count: true });

// Chinese listings (Dongchedi + Che168)
const byd = await client.china.catalog({ make: "BYD", export_ready: true, limit: 25 });
```

### Russian and German values

Every Korea call that takes `lang: "en"` also takes `lang: "ru"` or `lang: "de"`: fuel, transmission, colors,
body class, sell type, regions and options come in Russian or German (with `"de"` also model and trim names,
e.g. `C-Klasse`, `5er`). Ids, codes and numbers stay the same, and the filters accept these values too.

```js
const ru = await client.korea.catalog({ fuel: "дизель", lang: "ru", limit: 10 });
const de = await client.korea.catalog({ model_group: "C-Klasse", fuel: "Benzin", lang: "de", limit: 10 });
const enumsDe = await client.korea.enums({ lang: "de" }); // nameDe per value
```

China calls take `lang: "zh"` (original Chinese values) or `lang: "ru"`: Russian values for the fixed fields
(fuel, transmission, drivetrain, colours, seller type, condition, vehicle class), city names and equipment
names on `catalog`, `vehicle`, `vehicleByUrl`, `bulkVehicles` and `specs`. Make, model and trim names stay
Latin. `enums({ lang: "ru" })` adds `nameRu` to fuels and cities, `exportCsv({ lang: "ru" })` /
`exportToFile(path, { lang: "ru" })` return the label columns in Russian.

```js
const cn = await client.china.catalog({ make: "BYD", lang: "ru", limit: 10 });
```

## Keep a local copy in sync (Business / Scale)

Three steps: export to a file, start the change feed at the export's timestamp, then keep the cursor.

```js
// 1) Baseline: stream the full catalog to a file (not held in memory)
const { path, bytes, generatedAt } = await client.korea.exportToFile("catalog.csv");
importCsv(path); // your import: upsert by listing_id

// 2) First sync: start the change feed at the export's generatedAt
//    (X-Encarapi-Generated-At, not the time of your download)
for await (const change of client.korea.iterateChanges({ since: generatedAt })) {
  // change.type: "added" | "updated" | "reappeared" | "removed"; apply idempotently
}
saveCursor(client.korea.lastCursor);

// 3) Every later sync: continue from the saved cursor
for await (const change of client.korea.iterateChanges({ cursor: loadCursor() })) { /* ... */ }
saveCursor(client.korea.lastCursor);
```

`generatedAt` lies a few minutes before the file's data snapshot, so the first feed page can repeat a few
events that are already in the file: apply them as upserts. Use the same `source` / `sell_type` for the
export and the feed (e.g. `exportToFile("kbc.csv", { source: "kbc" })`, then
`iterateChanges({ source: "kbc", since: generatedAt })`). `exportCsv()` still returns the CSV as one string,
but without the timestamp; for large catalogs use `exportToFile()`. Trucks and excavators work the same way
with `exportTrucksToFile()` / `exportEquipmentToFile()` and `source: "truck"` / `"equipment"` on the feed.
The file is written to `<path>.part` first and renamed when complete, so an aborted download never leaves
a truncated file under the final name.

The China API works the same way (`client.china`, header `x-generated-at`); its events are
`{ id, source, vehicleId, type: "new" | "price" | "removed" | "relisted", oldPrice, newPrice, at }`:

```js
const { generatedAt } = await client.china.exportToFile("china-catalog.csv");
for await (const change of client.china.iterateChanges({ since: generatedAt })) {
  // change.type: "new" | "price" | "removed" | "relisted"
}
saveCursor(client.china.lastCursor); // later: iterateChanges({ cursor: loadCursor() })
```

## Korea API (`client.korea`)

| Method | Endpoint | Notes |
|---|---|---|
| `catalog(params)` | `GET /api/catalog` | Search & list. `source`: `encar` (default), `kbc`, `kcar`, `all` |
| `iterateCatalog(params)` | `GET /api/catalog` | Async iterator over all pages |
| `iterateCatalogById(params)` | `GET /api/catalog?sort=id` | Complete, stable traversal (keyset cursor, nothing repeated or skipped) |
| `leasing(params)` | `GET /api/catalog/leasing` | Lease takeovers and rentals |
| `iterateLeasingById(params)` | `GET /api/catalog/leasing?sort=id` | Complete, stable traversal of lease/rental listings |
| `vehicleByVin(vin)` | `GET /api/vehicle/by-vin/{vin}` | All listings of one VIN incl. removed ones (Business/Scale) |
| `trucks(params)` | `GET /api/catalog/trucks` | Trucks, buses and special vehicles (Business/Scale) |
| `truck(id)` | `GET /api/catalog/trucks/{id}` | One truck with detail, inspection report, cargo box, VIN and plate |
| `truckEnums()` | `GET /api/catalog/trucks/enums` | Truck filter values with counts |
| `trucksCsv()` | `GET /api/catalog/trucks/export` | Full truck inventory CSV (Business/Scale) |
| `exportTrucksToFile(path, params)` | `GET /api/catalog/trucks/export` | Same, streamed to a file: `{ path, bytes, generatedAt }` |
| `iterateTrucksById(params)` | `GET /api/catalog/trucks?sort=id` | Complete, stable traversal of the truck catalog |
| `equipment(params)` | `GET /api/catalog/equipment` | Used excavators (Business/Scale) |
| `equipmentEnums()` | `GET /api/catalog/equipment/enums` | Equipment filter values with counts |
| `equipmentCsv()` | `GET /api/catalog/equipment/export` | Full equipment inventory CSV (Business/Scale) |
| `exportEquipmentToFile(path, params)` | `GET /api/catalog/equipment/export` | Same, streamed to a file: `{ path, bytes, generatedAt }` |
| `iterateEquipmentById(params)` | `GET /api/catalog/equipment?sort=id` | Complete, stable traversal of the equipment catalog |
| `nav(params)` | `GET /api/nav` | Filter facets with counts |
| `enums(params)` | `GET /api/enums` | Valid values for the flat filters |
| `modelSearch(search, params)` | `GET /api/model-search` | Model autocomplete |
| `vehicle(id)` | `GET /api/vehicle/:id` | Ids: Encar id, `kbc:<id>`, `kcar:<id>` |
| `inspection(id)` | `GET /api/inspection/:id` | Official inspection report |
| `record(id)` | `GET /api/record/:id` | Accident & ownership record |
| `refresh(id)` | `POST /api/vehicle/:id/refresh` | On-demand refresh (daily quota) |
| `priceCheck(id)` | `GET /api/price-check/:id` | Market estimate (beta, Scale) |
| `bulkVehicles(ids)` / `bulkInspections(ids)` / `bulkRecords(ids)` | `POST /api/.../bulk` | Up to 500 ids (Business/Scale) |
| `inspectionVersions(id)` / `recordVersions(id)` | `GET /api/.../versions` | Report history (Business/Scale) |
| `changes(params)` / `iterateChanges(params)` | `GET /api/catalog/changes` | Incremental sync (Business/Scale) |
| `exportCsv(params)` | `GET /api/catalog/export` | Full catalog CSV (Business/Scale); `{ sell_type: "lease,rental" }` for lease/rental |
| `exportToFile(path, params)` | `GET /api/catalog/export` | Same export streamed to a file: `{ path, bytes, generatedAt }` (start of the change feed) |
| `makesCsv()` / `modelsCsv()` / `badgesCsv()` | `GET /api/taxonomy/*.csv` | Reference data |

## China API (`client.china`)

| Method | Endpoint | Notes |
|---|---|---|
| `catalog(params)` | `GET /api/catalog` | `make`, `price_min/max` (CNY), `power_min/max` (hp), `export_ready`, `sort`, `lang` (`zh`, `ru`), ... |
| `iterateCatalog(params)` | `GET /api/catalog` | Async iterator over all pages (up to the 10,000-result depth limit) |
| `vehicle(id)` | `GET /api/vehicle/:id` | Price history, photos, seller, export status |
| `vehicleByUrl(url)` | `GET /api/vehicle/by-url` | Same record by Che168/Dongchedi listing link (desktop, mobile or app) |
| `inspection(id)` | `GET /api/inspection/:id` | Accident, flood and fire checks, EV battery data |
| `specs(trimId, params)` | `GET /api/specs/:trimId` | Autohome trim sheet of a Che168 car: cc, kW, hp, torque, emission standard, weights, EV battery |
| `bulkVehicles(ids)` | `POST /api/vehicle/bulk` | Up to 500 ids |
| `changes(params)` / `iterateChanges(params)` | `GET /api/catalog/changes` | Change feed (Business/Scale) |
| `exportCsv(params)` | `GET /api/catalog/export` | Full catalog CSV; `{ lang: "ru" }` for Russian label columns |
| `exportToFile(path, params)` | `GET /api/catalog/export` | Same export streamed to a file: `{ path, bytes, generatedAt }` (start of the change feed) |
| `enums(params)` / `models(make)` | `GET /api/enums`, `/api/models` | Filter values (`{ lang: "ru" }` adds `nameRu`), models per make |

China only? `const { ChinaCarAPI } = require("encarapi")` (also available as the
[`chinacarapi`](https://www.npmjs.com/package/chinacarapi) package).

## Errors

Every failed request throws `EnCarAPIError` with `status` and the raw `body`. A `403` on a
plan-gated endpoint includes an upgrade hint from the API.

```js
try {
  await client.korea.changes({ cursor: 0 });
} catch (e) {
  if (e.status === 403) console.log("Plan does not include this endpoint:", e.body);
}
```

## Links

- Website and pricing: [encarapi.com](https://encarapi.com/?utm_source=readme&utm_medium=encarapi-node)
- Documentation: [encarapi.com/documentation](https://encarapi.com/documentation?utm_source=readme&utm_medium=encarapi-node)
- OpenAPI reference: https://api.encarapi.com/reference
- China data: [chinacarapi.com](https://chinacarapi.com/?utm_source=readme&utm_medium=encarapi-node)
- Python client: https://github.com/ThatMojo/encarapi-python

EnCarAPI is an independent service and not affiliated with Encar, KB Chachacha, K Car,
Dongchedi or Che168.

## License

MIT

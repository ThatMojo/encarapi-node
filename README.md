# EnCarAPI: Node.js client for Korean and Chinese used car data

Official **Node.js / TypeScript client** for [EnCarAPI](https://encarapi.com), the REST
**Encar API** and **Korean Car API**. One package for:

- **Korea:** Encar.com, KB Chachacha (`source: "kbc"`) and K Car (`source: "kcar"`), with
  photos, specs, options, inspection reports, accident and ownership records, condition
  reports, price history, a change feed and full catalog export.
- **China:** Dongchedi and Che168 in English via [ChinaCarAPI](https://chinacarapi.com)
  (separate key or the China add-on for EnCarAPI keys).

Built for car exporters, dealers and marketplaces that need reliable used car data without
scraping, proxies or geo-blocks.

> **An API key is required.** The data is a paid service. Get a key (5-day trial) at
> **[encarapi.com](https://encarapi.com)**.

## Install

```bash
npm install github:ThatMojo/encarapi-node
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

## Keep a local copy in sync (Business / Scale)

```js
// 1) Baseline: full catalog as CSV
const csv = await client.korea.exportCsv();

// 2) Then follow the change feed; every event arrives exactly once
for await (const change of client.korea.iterateChanges({ cursor: savedCursor ?? 0 })) {
  // change.type: "added" | "updated" | "reappeared" | "removed"
}
saveCursor(client.korea.lastCursor);
```

## Korea API (`client.korea`)

| Method | Endpoint | Notes |
|---|---|---|
| `catalog(params)` | `GET /api/catalog` | Search & list. `source`: `encar` (default), `kbc`, `kcar`, `all` |
| `iterateCatalog(params)` | `GET /api/catalog` | Async iterator over all pages |
| `leasing(params)` | `GET /api/catalog/leasing` | Lease takeovers and rentals |
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
| `exportCsv()` | `GET /api/catalog/export` | Full catalog CSV (Business/Scale) |
| `makesCsv()` / `modelsCsv()` / `badgesCsv()` | `GET /api/taxonomy/*.csv` | Reference data |

## China API (`client.china`)

| Method | Endpoint | Notes |
|---|---|---|
| `catalog(params)` | `GET /api/catalog` | `make`, `price_min/max` (CNY), `export_ready`, `sort`, ... |
| `vehicle(id)` | `GET /api/vehicle/:id` | Price history, photos, seller, export status |
| `inspection(id)` | `GET /api/inspection/:id` | Accident, flood and fire checks, EV battery data |
| `bulkVehicles(ids)` | `POST /api/vehicle/bulk` | Up to 500 ids |
| `changes(params)` | `GET /api/catalog/changes` | Change feed |
| `exportCsv()` | `GET /api/catalog/export` | Full catalog CSV |
| `enums()` / `models(make)` | `GET /api/enums`, `/api/models` | Filter values, models per make |

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

- Website and pricing: https://encarapi.com
- Documentation: https://encarapi.com/documentation
- OpenAPI reference: https://api.encarapi.com/reference
- China data: https://chinacarapi.com
- Python client: https://github.com/ThatMojo/encarapi-python

EnCarAPI is an independent service and not affiliated with Encar, KB Chachacha, K Car,
Dongchedi or Che168.

## License

MIT

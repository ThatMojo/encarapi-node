export interface ClientOptions {
  /** Override the Korea API base URL (default https://api.encarapi.com). */
  baseUrl?: string;
  /** Override the China API base URL (default https://api.chinacarapi.com). */
  chinaBaseUrl?: string;
  /** Separate key for China data. Defaults to CHINACARAPI_KEY, then the main key. */
  chinaKey?: string;
  /** Custom fetch implementation (defaults to global fetch, Node.js 18+). */
  fetch?: typeof fetch;
}

export class EnCarAPIError extends Error {
  /** HTTP status code, if the error came from an API response. */
  status?: number;
  /** Raw response body, if any. */
  body?: string;
}
export { EnCarAPIError as ChinaCarAPIError };

type Bool = boolean | "true" | "false";
type Json = Record<string, any>;

/** Korean data source. Encar is the default; "all" is the deduplicated union. */
export type KoreaSource = "encar" | "kbc" | "kcar" | "all" | (string & {});
/** Response language: "en" English, "ru" Russian, "de" German display values (ids and codes unchanged). */
export type KoreaLang = "en" | "ru" | "de";

/** Result of exportToFile() and the other *ToFile() methods. */
export interface ExportFileResult {
  /** The path the export was written to (as passed in). */
  path: string;
  /** Bytes written to the file (after any transfer decompression). */
  bytes: number;
  /**
   * The export's generated-at response header (Korea: X-Encarapi-Generated-At, China: x-generated-at),
   * a few minutes before the file's data snapshot. Pass it as `since` to changes() / iterateChanges();
   * the first page can repeat a few events, so apply them idempotently. null if the header was missing.
   */
  generatedAt: string | null;
}

/** Params of korea.exportCsv() / korea.exportToFile(). */
export interface KoreaExportParams {
  source?: KoreaSource;
  /** "sale" (default), "lease", "rental", a comma list or "all". */
  sell_type?: string;
  /** "ru" / "de": the label columns in Russian / German, every other column unchanged. */
  lang?: "ru" | "de";
  /** true = compressed transfer (gzip or brotli); fetch decompresses it, the file holds plain CSV. */
  compress?: Bool;
}

/** Flat English filters for /api/catalog, /api/nav and /api/catalog/leasing. Values from korea.enums() / korea.nav(). */
export interface KoreaCatalogParams {
  source?: KoreaSource;
  manufacturer?: string;
  model_group?: string;
  model?: string;
  badge_group?: string;
  badge?: string;
  model_search?: string;
  fuel?: "gasoline" | "diesel" | "hybrid" | "diesel-hybrid" | "lpg-hybrid" | "gasoline-lpg" | "cng" | "electric" | "lpg" | "hydrogen" | "other";
  transmission?: "automatic" | "manual" | "cvt" | "semi-automatic" | "other";
  drivetrain?: string;
  color?: string;
  seat_color?: string;
  category?: "suv" | "rv" | "large" | "midsize" | "compact" | "small" | "kei" | "van" | "light-van" | "truck" | "sports" | "other";
  seats?: string | number;
  min_seats?: number;
  max_seats?: number;
  /** Equipment codes; the car must have all of them. */
  options?: string | string[];
  /** Price in 만원 (1 = 10,000 KRW). */
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  min_mileage?: number;
  max_mileage?: number;
  min_ps?: number;
  max_ps?: number;
  max_owners?: number;
  frame_clean?: Bool;
  no_damage_cost?: Bool;
  max_damage_eur?: number;
  no_repairs?: Bool;
  has_record?: Bool;
  has_inspection?: Bool;
  has_photos?: Bool;
  usage_change?: string;
  no_usage_change?: Bool;
  exclude_prices?: string;
  exclude_duplicates?: Bool;
  min_first_seen?: string;
  /** Region codes, comma = OR (seoul, gyeonggi, busan, ...). Encar listings only for now. */
  region?: string;
  /** Cities, comma = OR: value from korea.enums().city (e.g. "suwon"), English or Korean name. Encar only. */
  city?: string;
  /** Keyset cursor for sort "id": nextAfter of the previous response. */
  after?: string;
  /** Raw Encar q-grammar (alternative to the flat filters). */
  q?: string;
  lang?: KoreaLang;
  /** "id" = stable listing-id order; page with `after` (see iterateCatalogById). */
  sort?: "newest" | "price_asc" | "price_desc" | "mileage_asc" | "mileage_desc" | "year_desc" | "year_asc" | "id";
  page?: number;
  limit?: number;
  count?: Bool;
}

/** Filters for /api/catalog/trucks. Values from korea.truckEnums(). */
export interface KoreaTruckParams {
  form?: "cargo" | "wing_body" | "bus" | "dump_construction" | "crane" | "tank" | "camper" | "waste_transport" | "live_fish" | "tow_transport" | "tractor" | "trailer" | (string & {});
  manufacturer?: string;
  /** Substring of the Korean model name, e.g. "포터". */
  model?: string;
  min_tons?: number;
  max_tons?: number;
  use?: "private" | "commercial" | "other";
  fuel?: string;
  transmission?: string;
  color?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  min_mileage?: number;
  max_mileage?: number;
  region?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "mileage_asc" | "mileage_desc" | "year_desc" | "year_asc" | "id";
  after?: string;
  page?: number;
  limit?: number;
  count?: Bool;
  lang?: KoreaLang;
}

/** Filters for /api/catalog/equipment. Values from korea.equipmentEnums(). */
export interface KoreaEquipmentParams {
  maker?: string;
  model?: string;
  sub_type?: "crawler" | "wheel" | (string & {});
  /** e.g. "EXC_CR_LE_6_5" (02 class crawler). */
  weight_class?: string;
  min_year?: number;
  max_year?: number;
  min_hours?: number;
  max_hours?: number;
  /** Price in 만원 (10,000 KRW). */
  min_price?: number;
  max_price?: number;
  has_price?: Bool;
  /** "sell" (default), "buy", "rent", a comma list or "all". */
  deal_type?: string;
  region?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "hours_asc" | "year_desc" | "year_asc" | "id";
  after?: string;
  page?: number;
  limit?: number;
  count?: Bool;
}

export interface KoreaCatalogResponse {
  Count?: number;
  SearchResults: Json[];
  /** Only with sort "id": pass as `after` for the next page; null on the last page. */
  nextAfter?: string | null;
  /** Only with sort "id": true while more pages follow. */
  hasMore?: boolean;
  [key: string]: any;
}

export interface KoreaChangesParams {
  cursor?: number;
  since?: string;
  source?: KoreaSource;
  sell_type?: string;
  limit?: number;
  lang?: KoreaLang;
}

export interface KoreaChangesResponse {
  /** Position to resume from (numeric string; pass it back as `cursor`). */
  nextCursor?: number | string;
  hasMore?: boolean;
  truncated?: boolean;
  added?: Json[];
  updated?: Json[];
  reappeared?: Json[];
  removed?: Json[];
  [key: string]: any;
}

export interface KoreaChange extends Json {
  type: "added" | "updated" | "reappeared" | "removed";
  /** Position of the event in the log (numeric string, same scale as nextCursor). Highest = latest. */
  eventId?: string;
  /** When the change was recorded (ISO 8601). */
  occurredAt?: string;
  /**
   * Only present when true. On KB Chachacha (source "kbc"): the listing duplicates an active Encar
   * listing and is not served by korea.catalog() / exportCsv(); setting or clearing the flag arrives as
   * an "updated" event with "duplicate" in changedFields. To stay consistent with the catalog, drop such
   * items and add them back when an update arrives without the flag.
   */
  IsDuplicate?: boolean;
  /** Only present together with IsDuplicate: the listing id of the original (Encar id for KB Chachacha), numeric string. */
  DuplicateOf?: string;
  /**
   * Encar only: accident damage according to Encar's performance inspection. null = not known
   * (detail not collected yet, or no inspection report - see InspectionAvailable).
   */
  Accident?: boolean | null;
  /** Encar only: only simple repairs (e.g. panel or paint work) according to the inspection. null = not known. */
  SimpleRepair?: boolean | null;
  /**
   * Encar only: null = detail not collected yet; false = no inspection report at our last detail fetch
   * (can still turn true later); true = Accident and SimpleRepair are filled. The first collected detail
   * arrives as an "updated" event with "inspection" in changedFields.
   */
  InspectionAvailable?: boolean | null;
  /**
   * KB Chachacha only: number of insurance accident records KB Chachacha shows for the car ("보험이력 N건"
   * on the listing page). null = not known yet. A change arrives as an "updated" event with "accident" in
   * changedFields; listings that already existed on 26 October 2026 got the count without an event.
   */
  InsuranceClaims?: number | null;
}

/** Korean used-car data: Encar, KB Chachacha ("kbc") and K Car ("kcar"). */
export class KoreaClient {
  constructor(apiKey: string, options?: Pick<ClientOptions, "baseUrl" | "fetch">);
  /** Cursor to resume from after iterateChanges() finished. */
  lastCursor?: number | string;
  catalog(params?: KoreaCatalogParams): Promise<KoreaCatalogResponse>;
  leasing(params?: KoreaCatalogParams): Promise<KoreaCatalogResponse>;
  nav(params?: KoreaCatalogParams): Promise<Json>;
  /** lang "ru" / "de" adds nameRu / nameDe to every value and lists drivetrain and sell_type. */
  enums(params?: { source?: KoreaSource; lang?: "ru" | "de" }): Promise<Json>;
  modelSearch(search: string, params?: { limit?: number; source?: KoreaSource; exclude_duplicates?: Bool; has_photos?: Bool; exclude_prices?: string; min_price?: number }): Promise<Json>;
  iterateCatalog(params?: KoreaCatalogParams): AsyncGenerator<Json, void, unknown>;
  /** Complete, stable traversal (sort=id + after): nothing repeated or skipped while the catalog changes. */
  iterateCatalogById(params?: KoreaCatalogParams): AsyncGenerator<Json, void, unknown>;
  /** iterateCatalogById() for lease-takeover and rental listings. */
  iterateLeasingById(params?: KoreaCatalogParams): AsyncGenerator<Json, void, unknown>;
  /** Encar trucks, buses and special vehicles (Business/Scale). */
  trucks(params?: KoreaTruckParams): Promise<KoreaCatalogResponse>;
  /** Every Encar / K Car listing of one VIN, active and removed (Business/Scale). */
  vehicleByVin(vin: string): Promise<Json>;
  /** One truck with detail page, inspection report, cargo box, VIN and plate (Business/Scale). */
  truck(id: string, params?: { lang?: KoreaLang }): Promise<Json>;
  /** Valid truck filter values with counts. */
  truckEnums(): Promise<Json>;
  /** Full truck inventory as CSV text (Business/Scale). */
  trucksCsv(params?: { compress?: Bool }): Promise<string>;
  /** Streams the truck export to a file; continue with changes({ source: "truck", since: generatedAt }). */
  exportTrucksToFile(path: string, params?: { compress?: Bool }): Promise<ExportFileResult>;
  /** Complete, stable traversal of the truck catalog (sort=id + after). */
  iterateTrucksById(params?: KoreaTruckParams): AsyncGenerator<Json, void, unknown>;
  /** Used excavators from 굴삭기나라 (Business/Scale). */
  equipment(params?: KoreaEquipmentParams): Promise<KoreaCatalogResponse>;
  /** Valid equipment filter values with counts. */
  equipmentEnums(): Promise<Json>;
  /** Full equipment inventory as CSV text (Business/Scale). */
  equipmentCsv(params?: { compress?: Bool }): Promise<string>;
  /** Streams the equipment export to a file; continue with changes({ source: "equipment", since: generatedAt }). */
  exportEquipmentToFile(path: string, params?: { compress?: Bool }): Promise<ExportFileResult>;
  /** Complete, stable traversal of the equipment catalog (sort=id + after). */
  iterateEquipmentById(params?: KoreaEquipmentParams): AsyncGenerator<Json, void, unknown>;
  /** Ids: Encar id, "kbc:<id>" or "kcar:<id>". */
  vehicle(id: string, params?: { lang?: KoreaLang }): Promise<Json>;
  inspection(id: string): Promise<Json>;
  record(id: string): Promise<Json>;
  refresh(id: string): Promise<Json>;
  /** Beta, Scale plan. */
  priceCheck(id: string): Promise<Json>;
  inspectionVersions(id: string): Promise<Json>;
  recordVersions(id: string): Promise<Json>;
  /** lang: "en" (KB Chachacha payloads), "ru" / "de" (KB Chachacha and Encar payloads). */
  bulkVehicles(ids: string[], params?: { lang?: KoreaLang }): Promise<Json>;
  bulkInspections(ids: string[]): Promise<Json>;
  bulkRecords(ids: string[]): Promise<Json>;
  changes(params: KoreaChangesParams): Promise<KoreaChangesResponse>;
  iterateChanges(params: KoreaChangesParams): AsyncGenerator<KoreaChange, void, unknown>;
  /** Full catalog as CSV text (Business/Scale). */
  exportCsv(params?: KoreaExportParams): Promise<string>;
  /**
   * Streams the full catalog export to a file without holding it in memory. Then start the change
   * feed with { since: result.generatedAt } (same source / sell_type as the export).
   */
  exportToFile(path: string, params?: KoreaExportParams): Promise<ExportFileResult>;
  makesCsv(params?: { source?: KoreaSource; lang?: "ru" | "de" }): Promise<string>;
  modelsCsv(params?: { source?: KoreaSource; lang?: "ru" | "de" }): Promise<string>;
  badgesCsv(params?: { source?: KoreaSource; lang?: "ru" | "de" }): Promise<string>;
}

/**
 * China response language: "en" English (default), "zh" the original Chinese values, "ru" Russian values
 * for the fixed fields (fuel, transmission, drivetrain, colours, seller type, condition, vehicle class),
 * city names and equipment names. Make, model and trim names stay Latin with "ru".
 */
export type ChinaLang = "en" | "zh" | "ru";

/** Params of china.exportCsv() / china.exportToFile(). */
export interface ChinaExportParams {
  /** "ru": the label columns (city, fuel, transmission, drivetrain, color, seller_city, condition, vehicle_class) in Russian, every other column unchanged. */
  lang?: "ru";
}

export interface ChinaCatalogParams {
  source?: "dongchedi" | "che168" | (string & {});
  duplicates?: "include" | (string & {});
  make?: string;
  model?: string;
  year_min?: number;
  year_max?: number;
  reg_year_min?: number;
  reg_year_max?: number;
  /** Price in CNY. */
  price_min?: number;
  price_max?: number;
  mileage_max?: number;
  /** Minimum power in hp; cars without a known power figure are left out. */
  power_min?: number;
  /** Maximum power in hp. */
  power_max?: number;
  city?: string;
  fuel?: string;
  has_report?: Bool;
  export_ready?: Bool;
  updated_since?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "mileage_asc" | "year_desc";
  page?: number;
  limit?: number;
  /** "zh" = original Chinese values, "ru" = Russian values (see ChinaLang). */
  lang?: ChinaLang;
}

export interface ChinaCatalogResponse {
  total: number;
  page: number;
  limit: number;
  sort?: string;
  results: Json[];
}

export interface ChinaChangesParams {
  /** ISO timestamp for the first call. */
  since?: string;
  /** nextCursor from the previous call. */
  cursor?: number;
  source?: "dongchedi" | "che168" | (string & {});
  limit?: number;
}

export interface ChinaChange extends Json {
  id: number;
  source: string;
  vehicleId: string;
  type: "new" | "price" | "removed" | "relisted";
  at: string;
}

export interface ChinaChangesResponse {
  cursor: number;
  nextCursor: number;
  hasMore: boolean;
  changes: ChinaChange[];
}

/** Chinese used-car data: Dongchedi and Che168. */
export class ChinaClient {
  constructor(apiKey: string, options?: Pick<ClientOptions, "fetch"> & { baseUrl?: string });
  /** Cursor to resume from after iterateChanges() finished. */
  lastCursor?: number;
  catalog(params?: ChinaCatalogParams): Promise<ChinaCatalogResponse>;
  /** All pages up to the API's 10,000-result depth limit. */
  iterateCatalog(params?: ChinaCatalogParams): AsyncGenerator<Json, void, unknown>;
  vehicle(id: string, params?: { source?: "dongchedi" | "che168"; lang?: ChinaLang }): Promise<Json>;
  /** Full record by Che168/Dongchedi listing link (desktop, mobile or app). */
  vehicleByUrl(url: string, params?: { lang?: ChinaLang }): Promise<Json>;
  /** lang "zh": original Chinese report; "ru" is accepted, the report stays English. */
  inspection(id: string, params?: { source?: "dongchedi" | "che168"; lang?: ChinaLang }): Promise<Json>;
  /** Autohome specification sheet of a Che168 trim (trim.id of a vehicle record). lang "zh" / "ru" for the equipment names. */
  specs(trimId: string | number, params?: { lang?: ChinaLang }): Promise<Json>;
  bulkVehicles(ids: string[], params?: { source?: "dongchedi" | "che168"; lang?: ChinaLang }): Promise<Json>;
  /** Alias of bulkVehicles. */
  bulk(ids: string[], params?: { source?: "dongchedi" | "che168"; lang?: ChinaLang }): Promise<Json>;
  changes(params: ChinaChangesParams): Promise<ChinaChangesResponse>;
  iterateChanges(params: ChinaChangesParams): AsyncGenerator<ChinaChange, void, unknown>;
  /** Full catalog as CSV text (Business/Scale). */
  exportCsv(params?: ChinaExportParams & Json): Promise<string>;
  /**
   * Streams the full catalog export to a file without holding it in memory. Then start the change
   * feed with { since: result.generatedAt }.
   */
  exportToFile(path: string, params?: ChinaExportParams): Promise<ExportFileResult>;
  /** lang "ru" adds nameRu to fuels and cities (also valid filter input). */
  enums(params?: { lang?: "ru" } & Json): Promise<Json>;
  models(make: string | number): Promise<Json>;
}

/** One client for both markets. */
export class EnCarAPI {
  constructor(apiKey?: string, options?: ClientOptions);
  readonly korea: KoreaClient;
  readonly china: ChinaClient;
  /** Shortcut for korea.catalog (0.x compatible). */
  catalog(params?: KoreaCatalogParams): Promise<KoreaCatalogResponse>;
  /** Shortcut for korea.nav (0.x compatible). */
  nav(params?: KoreaCatalogParams): Promise<Json>;
  /** Shortcut for korea.vehicle (0.x compatible). */
  vehicle(id: string, params?: { lang?: KoreaLang }): Promise<Json>;
}

/** China-only client (also published as the `chinacarapi` package). */
export class ChinaCarAPI extends ChinaClient {
  constructor(apiKey?: string, options?: Pick<ClientOptions, "fetch"> & { baseUrl?: string });
}

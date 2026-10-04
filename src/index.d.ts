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
  /** Raw Encar q-grammar (alternative to the flat filters). */
  q?: string;
  lang?: "en";
  sort?: "newest" | "price_asc" | "price_desc" | "mileage_asc" | "mileage_desc" | "year_desc" | "year_asc";
  page?: number;
  limit?: number;
  count?: Bool;
}

export interface KoreaCatalogResponse {
  Count?: number;
  SearchResults: Json[];
  [key: string]: any;
}

export interface KoreaChangesParams {
  cursor?: number;
  since?: string;
  source?: KoreaSource;
  sell_type?: string;
  limit?: number;
  lang?: "en";
}

export interface KoreaChangesResponse {
  nextCursor?: number;
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
}

/** Korean used-car data: Encar, KB Chachacha ("kbc") and K Car ("kcar"). */
export class KoreaClient {
  constructor(apiKey: string, options?: Pick<ClientOptions, "baseUrl" | "fetch">);
  /** Cursor to resume from after iterateChanges() finished. */
  lastCursor?: number;
  catalog(params?: KoreaCatalogParams): Promise<KoreaCatalogResponse>;
  leasing(params?: KoreaCatalogParams): Promise<KoreaCatalogResponse>;
  nav(params?: KoreaCatalogParams): Promise<Json>;
  enums(params?: { source?: KoreaSource }): Promise<Json>;
  modelSearch(search: string, params?: { limit?: number; source?: KoreaSource; exclude_duplicates?: Bool; has_photos?: Bool; exclude_prices?: string; min_price?: number }): Promise<Json>;
  iterateCatalog(params?: KoreaCatalogParams): AsyncGenerator<Json, void, unknown>;
  /** Ids: Encar id, "kbc:<id>" or "kcar:<id>". */
  vehicle(id: string, params?: { lang?: "en" }): Promise<Json>;
  inspection(id: string): Promise<Json>;
  record(id: string): Promise<Json>;
  refresh(id: string): Promise<Json>;
  /** Beta, Scale plan. */
  priceCheck(id: string): Promise<Json>;
  inspectionVersions(id: string): Promise<Json>;
  recordVersions(id: string): Promise<Json>;
  bulkVehicles(ids: string[]): Promise<Json>;
  bulkInspections(ids: string[]): Promise<Json>;
  bulkRecords(ids: string[]): Promise<Json>;
  changes(params: KoreaChangesParams): Promise<KoreaChangesResponse>;
  iterateChanges(params: KoreaChangesParams): AsyncGenerator<KoreaChange, void, unknown>;
  /** CSV text. */
  exportCsv(params?: { source?: KoreaSource }): Promise<string>;
  makesCsv(params?: { source?: KoreaSource }): Promise<string>;
  modelsCsv(params?: { source?: KoreaSource }): Promise<string>;
  badgesCsv(params?: { source?: KoreaSource }): Promise<string>;
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
  city?: string;
  fuel?: string;
  has_report?: Bool;
  export_ready?: Bool;
  updated_since?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "mileage_asc" | "year_desc";
  page?: number;
  limit?: number;
  /** "zh" = original Chinese values. */
  lang?: "en" | "zh";
}

export interface ChinaCatalogResponse {
  total: number;
  page: number;
  limit: number;
  sort?: string;
  results: Json[];
}

/** Chinese used-car data: Dongchedi and Che168. */
export class ChinaClient {
  constructor(apiKey: string, options?: Pick<ClientOptions, "fetch"> & { baseUrl?: string });
  catalog(params?: ChinaCatalogParams): Promise<ChinaCatalogResponse>;
  vehicle(id: string, params?: { lang?: "en" | "zh" }): Promise<Json>;
  inspection(id: string, params?: { lang?: "en" | "zh" }): Promise<Json>;
  bulkVehicles(ids: string[], params?: { lang?: "en" | "zh" }): Promise<Json>;
  /** Alias of bulkVehicles. */
  bulk(ids: string[], params?: { lang?: "en" | "zh" }): Promise<Json>;
  changes(params: { since?: string; cursor?: number; source?: string; limit?: number }): Promise<Json>;
  exportCsv(params?: Json): Promise<string>;
  enums(params?: Json): Promise<Json>;
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
  vehicle(id: string, params?: { lang?: "en" }): Promise<Json>;
}

/** China-only client (also published as the `chinacarapi` package). */
export class ChinaCarAPI extends ChinaClient {
  constructor(apiKey?: string, options?: Pick<ClientOptions, "fetch"> & { baseUrl?: string });
}

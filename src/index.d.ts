export interface EnCarAPIOptions {
  baseUrl?: string;
}

export class EnCarAPIError extends Error {}

/** Official Node.js client for the EnCarAPI — Korean car data API (Encar.com). */
export class EnCarAPI {
  constructor(apiKey?: string, options?: EnCarAPIOptions);
  /** Search & filter the Korean car catalog (Encar.com listings). */
  catalog(params?: Record<string, string | number | boolean>): Promise<unknown>;
  /** Filter facets / navigation metadata (brands, models, counts). */
  nav(params?: Record<string, string | number | boolean>): Promise<unknown>;
  /** Full detail for one vehicle: specs, options, inspection, price. */
  vehicle(vehicleId: string): Promise<unknown>;
}

import "server-only";

import { parseMoneyField } from "@/lib/seller-financials";

/** Raw listing shape varies; normalizer accepts loose records. */
export type FlippaListingRaw = Record<string, unknown>;

export interface FetchFlippaListingsOptions {
  types?: string[];
  minPrice?: number;
  maxPrice?: number;
  pages?: number;
  pageSize?: number;
}

function buildSearchUrl(page: number, options: Required<FetchFlippaListingsOptions>): string {
  const params = new URLSearchParams();
  params.set("filter[property_type]", options.types.join(","));
  params.set("filter[status]", "open");
  params.set("page[number]", String(page));
  params.set("page[size]", String(options.pageSize));
  if (options.minPrice > 0) params.set("filter[min_price]", String(options.minPrice));
  if (options.maxPrice > 0) params.set("filter[max_price]", String(options.maxPrice));
  return `https://flippa.com/search.json?${params.toString()}`;
}

function unwrapJsonApiRow(node: unknown): FlippaListingRaw {
  if (!node || typeof node !== "object") return {};
  const n = node as { id?: unknown; attributes?: unknown };
  const attrs =
    n.attributes && typeof n.attributes === "object" && !Array.isArray(n.attributes)
      ? (n.attributes as FlippaListingRaw)
      : {};
  const id = n.id != null ? String(n.id) : undefined;
  return id != null ? { ...attrs, id } : { ...attrs };
}

/** Extract array of listing-like objects from Flippa JSON payloads. */
export function extractFlippaListingsFromResponse(data: unknown): FlippaListingRaw[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as FlippaListingRaw[];

  if (typeof data !== "object") return [];
  const root = data as Record<string, unknown>;

  const candidates = [root.data, root.results, root.listings, root.search_results, root.items];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      const first = c[0];
      if (first && typeof first === "object" && "attributes" in (first as object)) {
        return (c as unknown[]).map(unwrapJsonApiRow);
      }
      return c as FlippaListingRaw[];
    }
  }

  const inner = root.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const d = inner as Record<string, unknown>;
    if (Array.isArray(d.data)) {
      const arr = d.data as unknown[];
      if (arr[0] && typeof arr[0] === "object" && "attributes" in (arr[0] as object)) {
        return arr.map(unwrapJsonApiRow);
      }
      return arr as FlippaListingRaw[];
    }
  }

  return [];
}

/**
 * Fetches open listings from Flippa's public search JSON endpoint.
 * Note: Flippa may return HTML/5xx for non-browser clients; if empty, check logs and User-Agent / IP.
 */
export async function fetchFlippaListings(
  options: FetchFlippaListingsOptions = {}
): Promise<{ listings: FlippaListingRaw[]; errors: string[] }> {
  const opts: Required<FetchFlippaListingsOptions> = {
    types: options.types ?? ["saas", "website", "app", "ecommerce_store", "established_website"],
    minPrice: options.minPrice ?? 5000,
    maxPrice: options.maxPrice ?? 500_000,
    pages: options.pages ?? 1,
    pageSize: options.pageSize ?? 50,
  };

  const all: FlippaListingRaw[] = [];
  const errors: string[] = [];

  for (let page = 1; page <= opts.pages; page++) {
    const url = buildSearchUrl(page, opts);
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; Aquira/1.0; +https://aquira.io)",
        },
        next: { revalidate: 0 },
      });

      const text = await res.text();
      if (!res.ok) {
        errors.push(`Flippa HTTP ${res.status} page ${page}: ${text.slice(0, 200)}`);
        break;
      }

      let data: unknown;
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        errors.push(`Flippa page ${page}: response was not JSON (starts with ${text.slice(0, 80)})`);
        break;
      }

      if (process.env.FLIPPA_DEBUG_RESPONSE === "1" || process.env.FLIPPA_DEBUG_RESPONSE === "true") {
        console.log("Flippa raw slice:", JSON.stringify(data, null, 2).slice(0, 3000));
      }

      const listings = extractFlippaListingsFromResponse(data);
      if (listings.length === 0) {
        errors.push(`Flippa page ${page}: no listings array found in payload keys=${Object.keys(data as object).join(",")}`);
        break;
      }
      all.push(...listings);
    } catch (e) {
      errors.push(`Flippa page ${page}: ${e instanceof Error ? e.message : String(e)}`);
      break;
    }
  }

  return { listings: all, errors };
}

export function flippaListingId(listing: FlippaListingRaw): string | null {
  const id =
    listing.id ??
    listing.listing_id ??
    listing.listingId ??
    (listing.slug as string | undefined);
  if (id == null) return null;
  const s = String(id).trim();
  return s.length ? s : null;
}

export function flippaNumeric(listing: FlippaListingRaw, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = listing[k];
    const n = parseMoneyField(v);
    if (n != null && !Number.isNaN(n)) return n;
  }
  return null;
}

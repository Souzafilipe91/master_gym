/**
 * Google Maps API — usa GOOGLE_MAPS_API_KEY direto (sem proxy Manus).
 * Configure a variável de ambiente GOOGLE_MAPS_API_KEY.
 */

const MAPS_BASE = "https://maps.googleapis.com";

function getApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY não está configurada.");
  return key;
}

export async function makeRequest<T = unknown>(
  endpoint: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const apiKey = getApiKey();
  const url = new URL(`${MAPS_BASE}${endpoint}`);
  url.searchParams.set("key", apiKey);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Maps API error (${res.status}): ${err}`);
  }
  return res.json() as Promise<T>;
}

export type LatLng = { lat: number; lng: number };
export type TravelMode = "driving" | "walking" | "bicycling" | "transit";
export type MapType = "roadmap" | "satellite" | "terrain" | "hybrid";
export type SpeedUnit = "KPH" | "MPH";
export type GeocodingResult = { results: Array<{ geometry: { location: LatLng }; formatted_address: string }>; status: string };
export type DirectionsResult = { routes: unknown[]; status: string };
export type DistanceMatrixResult = { rows: unknown[]; status: string };
export type PlacesSearchResult = { results: unknown[]; status: string };
export type PlaceDetailsResult = { result: unknown; status: string };
export type ElevationResult = { results: Array<{ elevation: number; location: LatLng }>; status: string };
export type TimeZoneResult = { timeZoneId: string; timeZoneName: string; status: string };
export type RoadsResult = { snappedPoints: unknown[] };

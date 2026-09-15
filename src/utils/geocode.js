import * as Location from 'expo-location';

// expo-location's geocodeAsync uses the OS's native geocoding service
// (Apple's on iOS, Google's on Android) — no API key needed, unlike the
// Google Places/Geocoding HTTP APIs. Good enough for "search by
// place/locality/pincode"; it won't do fuzzy autocomplete-as-you-type,
// but a plain address or pincode resolves reliably.
export async function geocodePlace(query) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const results = await Location.geocodeAsync(trimmed);
  if (!results || results.length === 0) return null;

  const { latitude, longitude } = results[0];
  return { latitude, longitude };
}

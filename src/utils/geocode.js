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

export async function searchAddressSuggestions(query) {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const response = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5`
  );
  if (!response.ok) return [];
  const data = await response.json();

  return (data.features || []).map((feature) => ({
    label: feature.properties?.name
      ? [feature.properties.name, feature.properties.city, feature.properties.country]
        .filter(Boolean)
        .join(', ')
      : feature.properties?.label || trimmed,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
  }));
}

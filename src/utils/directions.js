import { Linking } from 'react-native';

// Google Maps' universal URL scheme (maps.google.com/...) works on both
// platforms without needing platform-specific deep-link schemes: iOS
// opens it in the Google Maps app if installed, else Safari; Android
// opens it in the Google Maps app if installed, else Chrome. This avoids
// needing separate geo: (Android) and maps://  (iOS/Apple Maps) URLs and
// the "which map app does this user even have" branching that comes
// with them.
export async function openDirections(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    // Extremely unlikely (this URL works in any browser), but fail
    // loudly rather than silently doing nothing if it ever happens.
    throw new Error('Could not open maps');
  }
}

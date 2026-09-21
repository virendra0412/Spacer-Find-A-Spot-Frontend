import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

// Wraps the permission dance + a single location fetch. Returns
// { coords, error, loading } so screens don't each re-implement this.
export function useLocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied — showing a default area instead.');
          // Fallback so search still works without permission. This matches
          // the Samau/Motavas seed data used for testing.
          setCoords({ latitude: 22.9099163, longitude: 72.9329566 });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (e) {
        setError(e.message);
        setCoords({ latitude: 22.9099163, longitude: 72.9329566 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { coords, error, loading };
}

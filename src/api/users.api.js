import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { registerDevice } from '../api/devices.api';

// Wraps the permission dance + Expo push token fetch + backend
// registration behind a single `register()` call, so Profile.js can
// trigger it from a button tap without knowing any of this plumbing.
//
// IMPORTANT: expo-notifications and expo-constants are required lazily,
// INSIDE register(), not imported at the top of this file. Since
// SDK 53, Expo Go on Android has no native push-notification module —
// touching that native binding at all (even just importing the
// package) throws immediately. If this file imported it statically,
// that import would execute the moment Profile.js gets pulled into the
// navigation tree at app boot (Profile is always reachable from
// AppTabs), crashing the app on launch before the user ever taps
// anything — regardless of the try/catch below. A lazy require()
// defers touching the native module until register() actually runs,
// so the try/catch here can do its job.
export function usePushRegistration() {
  const [status, setStatus] = useState('idle'); // idle | registering | registered | denied | not-configured | error
  const [error, setError] = useState(null);

  const register = useCallback(async () => {
    setStatus('registering');
    setError(null);
    try {
      const Notifications = require('expo-notifications');
      const Constants = require('expo-constants').default;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        setStatus('not-configured');
        return;
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status: requested } = await Notifications.requestPermissionsAsync();
        finalStatus = requested;
      }
      if (finalStatus !== 'granted') {
        setStatus('denied');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
      await registerDevice(expoPushToken);
      setStatus('registered');
    } catch (e) {
      // This is exactly the case SDK 53+ Expo Go on Android hits —
      // caught cleanly now instead of crashing the app.
      setError(e.message);
      setStatus('error');
    }
  }, []);

  return { status, error, register };
}
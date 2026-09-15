import { useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerDevice } from '../api/devices.api';

// Wraps the permission dance + Expo push token fetch + backend
// registration behind a single `register()` call, so Profile.js can
// trigger it from a button tap without knowing any of this plumbing.
//
// This needs an EAS project id (app.json -> extra.eas.projectId) to get
// a real token. Until this project is linked with `eas init`, register()
// will surface that clearly instead of silently doing nothing — see the
// 'not-configured' status below.
export function usePushRegistration() {
  const [status, setStatus] = useState('idle'); // idle | registering | registered | denied | not-configured | error
  const [error, setError] = useState(null);

  const register = useCallback(async () => {
    setStatus('registering');
    setError(null);
    try {
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
      setError(e.message);
      setStatus('error');
    }
  }, []);

  return { status, error, register };
}

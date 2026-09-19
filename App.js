import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Oswald_500Medium } from '@expo-google-fonts/oswald/500Medium';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold';
import { Oswald_700Bold } from '@expo-google-fonts/oswald/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(() => {}, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

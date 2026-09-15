import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import Profile from '../screens/profile/Profile';

const Stack = createNativeStackNavigator();

// A one-screen stack today, but wrapped the same way as SearchStack /
// HostStack so adding e.g. "Booking history" or "Payment methods" later
// is just another Stack.Screen here, not a navigator rewrite.
export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.bodySemibold },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import HostDashboard from '../screens/host/HostDashboard';
import CreateListing from '../screens/host/CreateListing';
import EditAvailability from '../screens/host/EditAvailability';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.bodySemibold },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.paper },
};

export default function HostStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="HostDashboard" component={HostDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="CreateListing" component={CreateListing} options={{ title: 'List a spot' }} />
      <Stack.Screen name="EditAvailability" component={EditAvailability} options={{ title: 'Availability' }} />
    </Stack.Navigator>
  );
}

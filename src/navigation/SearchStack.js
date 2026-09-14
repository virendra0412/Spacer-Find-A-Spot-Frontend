import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import Search from '../screens/search/Search';
import ListingDetail from '../screens/search/ListingDetail';
import ConfirmBooking from '../screens/search/ConfirmBooking';
import MyBookings from '../screens/search/MyBookings';
import ActiveSession from '../screens/session/ActiveSession';
import BookingReceipt from '../screens/session/BookingReceipt';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.bodySemibold },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.paper },
};

export default function SearchStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Search" component={Search} options={{ headerShown: false }} />
      <Stack.Screen name="ListingDetail" component={ListingDetail} options={{ title: '' }} />
      <Stack.Screen name="ConfirmBooking" component={ConfirmBooking} options={{ title: 'Confirm' }} />
      <Stack.Screen name="MyBookings" component={MyBookings} options={{ headerShown: false }} />
      <Stack.Screen
        name="ActiveSession"
        component={ActiveSession}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="BookingReceipt" component={BookingReceipt} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

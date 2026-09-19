import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminDisputes from '../screens/admin/AdminDisputes';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="AdminDisputes" component={AdminDisputes} options={{ headerShown: true, title: 'Disputes' }} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminDisputes from '../screens/admin/AdminDisputes';
import AdminUsers from '../screens/admin/AdminUsers';
import AdminVerifications from '../screens/admin/AdminVerifications';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="AdminDisputes" component={AdminDisputes} options={{ headerShown: true, title: 'Disputes' }} />
      <Stack.Screen name="AdminUsers" component={AdminUsers} options={{ headerShown: true, title: 'Users' }} />
      <Stack.Screen name="AdminVerifications" component={AdminVerifications} options={{ headerShown: true, title: 'Verification' }} />
    </Stack.Navigator>
  );
}

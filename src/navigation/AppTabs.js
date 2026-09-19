import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import SearchStack from './SearchStack';
import HostStack from './HostStack';
import ProfileStack from './ProfileStack';
import AdminStack from './AdminStack';

const Tab = createBottomTabNavigator();

// v1 shows Search/Host/Profile to everyone (the backend schema defaults
// every user's role to 'both'). Admin is the one tab that IS gated —
// only rendered when user.is_admin is true, checked fresh from
// GET /users/me on every relaunch via AuthContext.
export default function AppTabs() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const iconName = {
            SearchStack: 'search',
            HostStack: 'business',
            ProfileStack: 'person-circle-outline',
            AdminStack: 'shield-checkmark-outline',
          }[route.name];
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="SearchStack" component={SearchStack} options={{ title: 'Find a spot' }} />
      <Tab.Screen name="HostStack" component={HostStack} options={{ title: 'Host' }} />
      <Tab.Screen name="ProfileStack" component={ProfileStack} options={{ title: 'Profile' }} />
      {user?.is_admin && (
        <Tab.Screen name="AdminStack" component={AdminStack} options={{ title: 'Admin' }} />
      )}
    </Tab.Navigator>
  );
}

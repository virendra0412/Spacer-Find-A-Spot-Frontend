import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import SearchStack from './SearchStack';
import HostStack from './HostStack';

const Tab = createBottomTabNavigator();

// v1 shows both tabs to everyone (the backend schema defaults every user's
// role to 'both' — see frontend plan, section 4). If role-gating is added
// later, read `user.role` from AuthContext here and conditionally omit a tab.
export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'SearchStack' ? 'search' : 'business';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="SearchStack" component={SearchStack} options={{ title: 'Find a spot' }} />
      <Tab.Screen name="HostStack" component={HostStack} options={{ title: 'Host' }} />
    </Tab.Navigator>
  );
}

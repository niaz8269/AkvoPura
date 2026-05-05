/**
 * Customer-portal navigator — 4 bottom tabs.
 *
 *   Home / Order / History / Complaints
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { CustomerHomeScreen } from './screens/CustomerHomeScreen';
import { CustomerOrderScreen } from './screens/CustomerOrderScreen';
import { CustomerHistoryScreen } from './screens/CustomerHistoryScreen';
import { CustomerComplaintsScreen } from './screens/CustomerComplaintsScreen';

const Tab = createBottomTabNavigator();

function HeaderRight() {
  const { logout } = useAuth();
  return (
    <Pressable
      onPress={logout}
      style={({ pressed }) => [styles.logoutBtn, pressed ? styles.logoutPressed : null]}
      accessibilityLabel="Logout"
    >
      <Ionicons name="log-out-outline" size={20} color={colors.primaryDark} />
      <Text style={styles.logoutText}>Logout</Text>
    </Pressable>
  );
}

export function CustomerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' },
        headerRight: () => <HeaderRight />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Order: focused ? 'cart' : 'cart-outline',
            History: focused ? 'time' : 'time-outline',
            Complaints: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeScreen}
        options={{ title: 'Home', headerTitle: 'My account' }}
      />
      <Tab.Screen
        name="Order"
        component={CustomerOrderScreen}
        options={{ title: 'Order', headerTitle: 'Place order' }}
      />
      <Tab.Screen
        name="History"
        component={CustomerHistoryScreen}
        options={{ title: 'History', headerTitle: 'Orders & bills' }}
      />
      <Tab.Screen
        name="Complaints"
        component={CustomerComplaintsScreen}
        options={{ title: 'Complaints', headerTitle: 'Complaints' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  logoutPressed: { opacity: 0.6 },
  logoutText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

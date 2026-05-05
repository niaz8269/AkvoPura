/**
 * Manager navigator — 5 bottom tabs.
 *
 *   Home / Van Load / Customers / Trips / Expenses
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { ManagerHomeScreen } from './screens/ManagerHomeScreen';
import { ManagerVanLoadScreen } from './screens/ManagerVanLoadScreen';
import { ManagerCustomersScreen } from './screens/ManagerCustomersScreen';
import { ManagerTripsScreen } from './screens/ManagerTripsScreen';
import { ManagerExpensesScreen } from './screens/ManagerExpensesScreen';
import { useManager } from './state';

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

function ExpensesTabBadge() {
  const { pendingExpenses } = useManager();
  const count = pendingExpenses.length;
  if (count === 0) return null;
  return (
    <Text style={styles.badge}>{count}</Text>
  );
}

export function ManagerNavigator() {
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
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            VanLoad: 'cube-outline',
            Customers: 'people-outline',
            Trips: 'map-outline',
            Expenses: 'wallet-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={ManagerHomeScreen}
        options={{ title: 'Home', headerTitle: 'Branch overview' }}
      />
      <Tab.Screen
        name="VanLoad"
        component={ManagerVanLoadScreen}
        options={{ title: 'Van Load', headerTitle: 'Van loading' }}
      />
      <Tab.Screen
        name="Customers"
        component={ManagerCustomersScreen}
        options={{ title: 'Customers', headerTitle: 'All customers' }}
      />
      <Tab.Screen
        name="Trips"
        component={ManagerTripsScreen}
        options={{ title: 'Trips', headerTitle: "Today's trips" }}
      />
      <Tab.Screen
        name="Expenses"
        component={ManagerExpensesScreen}
        options={{
          title: 'Expenses',
          headerTitle: 'Expense approvals',
          tabBarBadge: undefined, // dynamic badge below
          tabBarIcon: ({ color, size, focused }) => (
            <>
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={size}
                color={color}
              />
              <ExpensesTabBadge />
            </>
          ),
        }}
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.danger,
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    textAlign: 'center',
    overflow: 'hidden',
  },
});

/**
 * Manager navigator — 5 bottom tabs.
 *
 *   Home / Customers / Trips / Expenses / Team
 *
 * Home is a stack so the legacy "Van Load" screen is still reachable
 * (the assignments card on Home navigates there). Team is a stack with
 * Today's Attendance as the landing screen + Employees list + detail.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { ManagerHomeScreen } from './screens/ManagerHomeScreen';
import { ManagerVanLoadScreen } from './screens/ManagerVanLoadScreen';
import { ManagerCustomersScreen } from './screens/ManagerCustomersScreen';
import { ManagerTripsScreen } from './screens/ManagerTripsScreen';
import { ManagerExpensesScreen } from './screens/ManagerExpensesScreen';
import { ManagerEmployeesScreen } from './screens/ManagerEmployeesScreen';
import { ManagerAttendanceScreen } from './screens/ManagerAttendanceScreen';
import { ManagerEmployeeDetailScreen } from './screens/ManagerEmployeeDetailScreen';
import { ManagerOrdersScreen } from './screens/ManagerOrdersScreen';
import { ManagerComplaintsScreen } from './screens/ManagerComplaintsScreen';
import { ManagerProductionScreen } from './screens/ManagerProductionScreen';
import { useManager } from './state';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
  return <Text style={styles.badge}>{count}</Text>;
}

const baseStackOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' as const },
  headerTintColor: colors.primaryDark,
  headerRight: () => <HeaderRight />,
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerHomeScreen}
        options={{ title: 'Branch overview' }}
      />
      <Stack.Screen
        name="VanLoad"
        component={ManagerVanLoadScreen}
        options={{ title: 'Van loading' }}
      />
      <Stack.Screen
        name="Orders"
        component={ManagerOrdersScreen}
        options={{ title: 'Customer orders' }}
      />
      <Stack.Screen
        name="Complaints"
        component={ManagerComplaintsScreen}
        options={{ title: 'Complaints' }}
      />
      <Stack.Screen
        name="Production"
        component={ManagerProductionScreen}
        options={{ title: 'Production' }}
      />
    </Stack.Navigator>
  );
}

function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerCustomersScreen}
        options={{ title: 'All customers' }}
      />
    </Stack.Navigator>
  );
}

function TripsStack() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerTripsScreen}
        options={{ title: "Today's trips" }}
      />
    </Stack.Navigator>
  );
}

function ExpensesStack() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerExpensesScreen}
        options={{ title: 'Expense approvals' }}
      />
    </Stack.Navigator>
  );
}

function TeamStack() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Attendance"
        component={ManagerAttendanceScreen}
        options={({ navigation }) => ({
          title: "Today's attendance",
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('Employees')}
              style={({ pressed }) => [styles.headerLink, pressed ? styles.logoutPressed : null]}
              accessibilityLabel="All employees"
            >
              <Ionicons name="people-outline" size={20} color={colors.primaryDark} />
              <Text style={styles.headerLinkText}>All</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="Employees"
        component={ManagerEmployeesScreen}
        options={{ title: 'All employees' }}
      />
      <Stack.Screen
        name="EmployeeDetail"
        component={ManagerEmployeeDetailScreen}
        options={{ title: 'Employee' }}
      />
    </Stack.Navigator>
  );
}

export function ManagerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Customers: focused ? 'people' : 'people-outline',
            Trips: focused ? 'map' : 'map-outline',
            Expenses: focused ? 'wallet' : 'wallet-outline',
            Team: focused ? 'briefcase' : 'briefcase-outline',
          };
          if (route.name === 'Expenses') {
            return (
              <>
                <Ionicons
                  name={map[route.name] ?? 'ellipse-outline'}
                  size={size}
                  color={color}
                />
                <ExpensesTabBadge />
              </>
            );
          }
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen
        name="Customers"
        component={CustomersStack}
        options={{ title: 'Customers' }}
      />
      <Tab.Screen name="Trips" component={TripsStack} options={{ title: 'Trips' }} />
      <Tab.Screen name="Expenses" component={ExpensesStack} options={{ title: 'Expenses' }} />
      <Tab.Screen name="Team" component={TeamStack} options={{ title: 'Team' }} />
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
  headerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerLinkText: {
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

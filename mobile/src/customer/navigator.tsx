/**
 * Customer-portal navigator — 4 bottom tabs.
 *
 *   Home / Order / History / Complaints
 *
 * Home is a stack so Subscriptions is reachable from the Home card.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { CustomerHomeScreen } from './screens/CustomerHomeScreen';
import { CustomerOrderScreen } from './screens/CustomerOrderScreen';
import { CustomerHistoryScreen } from './screens/CustomerHistoryScreen';
import { CustomerComplaintsScreen } from './screens/CustomerComplaintsScreen';
import { CustomerSubscriptionsScreen } from './screens/CustomerSubscriptionsScreen';
import { ComplaintDetailScreen } from '../complaints/ComplaintDetailScreen';

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
        component={CustomerHomeScreen}
        options={{ title: 'My account' }}
      />
      <Stack.Screen
        name="Subscriptions"
        component={CustomerSubscriptionsScreen}
        options={{ title: 'My subscriptions' }}
      />
    </Stack.Navigator>
  );
}

export function CustomerNavigator() {
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
            Order: focused ? 'cart' : 'cart-outline',
            History: focused ? 'time' : 'time-outline',
            Complaints: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen
        name="Order"
        component={WrappedOrder}
        options={{ title: 'Order' }}
      />
      <Tab.Screen
        name="History"
        component={WrappedHistory}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Complaints"
        component={WrappedComplaints}
        options={{ title: 'Complaints' }}
      />
    </Tab.Navigator>
  );
}

function WrappedOrder() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Landing"
        component={CustomerOrderScreen}
        options={{ title: 'Place order' }}
      />
    </Stack.Navigator>
  );
}
function WrappedHistory() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Landing"
        component={CustomerHistoryScreen}
        options={{ title: 'Orders & bills' }}
      />
    </Stack.Navigator>
  );
}
function WrappedComplaints() {
  return (
    <Stack.Navigator screenOptions={baseStackOptions}>
      <Stack.Screen
        name="Landing"
        component={CustomerComplaintsScreen}
        options={{ title: 'Complaints' }}
      />
      <Stack.Screen
        name="ComplaintDetail"
        component={ComplaintDetailScreen}
        options={{ title: 'Complaint' }}
      />
    </Stack.Navigator>
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

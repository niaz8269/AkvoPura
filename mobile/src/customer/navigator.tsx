/**
 * Customer-portal navigator — left drawer.
 *
 *   Home / Order / History / Complaints
 *
 * Home wraps its own Stack so Subscriptions is reachable from the Home card.
 * Hamburger button in each screen's header opens the drawer.
 */

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { CustomerHomeScreen } from './screens/CustomerHomeScreen';
import { CustomerOrderScreen } from './screens/CustomerOrderScreen';
import { CustomerHistoryScreen } from './screens/CustomerHistoryScreen';
import { CustomerComplaintsScreen } from './screens/CustomerComplaintsScreen';
import { CustomerSubscriptionsScreen } from './screens/CustomerSubscriptionsScreen';
import { ComplaintDetailScreen } from '../complaints/ComplaintDetailScreen';
import { useCustomerPortal } from './state';
import { RoleDrawerContent } from '../drawer/RoleDrawerContent';
import { roleStackScreenOptions, roleRootHeader } from '../drawer/headerOptions';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={CustomerHomeScreen}
        options={{ title: 'My account', ...roleRootHeader }}
      />
      <Stack.Screen
        name="Subscriptions"
        component={CustomerSubscriptionsScreen}
        options={{ title: 'My subscriptions' }}
      />
    </Stack.Navigator>
  );
}

function WrappedOrder() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={CustomerOrderScreen}
        options={{ title: 'Place order', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

function WrappedHistory() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={CustomerHistoryScreen}
        options={{ title: 'Orders & bills', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

function WrappedComplaints() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={CustomerComplaintsScreen}
        options={{ title: 'Complaints', ...roleRootHeader }}
      />
      <Stack.Screen
        name="ComplaintDetail"
        component={ComplaintDetailScreen}
        options={{ title: 'Complaint' }}
      />
    </Stack.Navigator>
  );
}

function ComplaintsDrawerLabel({ color, focused }: { color: string; focused: boolean }) {
  const { user } = useAuth();
  const portal = useCustomerPortal();
  const openCount = user
    ? portal
        .complaintsForUser(user.id)
        .filter((c) => c.status === 'open' || c.status === 'in_review').length
    : 0;
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.labelText, { color }, focused ? styles.labelTextFocused : null]}>
        Complaints
      </Text>
      {openCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{openCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function CustomerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textMuted,
        drawerActiveBackgroundColor: colors.primary + '15',
        drawerLabelStyle: { fontWeight: '700' },
        drawerType: 'front',
      }}
      drawerContent={(props) => <RoleDrawerContent {...props} roleLabel="Customer" />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Order"
        component={WrappedOrder}
        options={{
          title: 'Order',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="History"
        component={WrappedHistory}
        options={{
          title: 'History',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Complaints"
        component={WrappedComplaints}
        options={{
          title: 'Complaints',
          drawerLabel: (p) => <ComplaintsDrawerLabel {...p} />,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelText: { fontSize: fontSizes.body, fontWeight: '700' },
  labelTextFocused: { fontWeight: '800' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.textInverse, fontSize: 11, fontWeight: '900' },
});

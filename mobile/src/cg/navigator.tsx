/**
 * Cans/Gallons Salesman navigator.
 *
 *   CGStack (native stack)
 *   ├── Tabs (bottom tab navigator)
 *   │     ├── Today
 *   │     ├── Deliver
 *   │     ├── Collect
 *   │     └── EndOfDay
 *   └── CustomerDetail (pushed on top with back button)
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { CGTodayScreen } from './screens/CGTodayScreen';
import { CGDeliveryScreen } from './screens/CGDeliveryScreen';
import { CGCollectionScreen } from './screens/CGCollectionScreen';
import { CGEndOfDayScreen } from './screens/CGEndOfDayScreen';
import { CGCustomerDetailScreen } from './screens/CGCustomerDetailScreen';
import { CGAddCustomerScreen } from './screens/CGAddCustomerScreen';
import { SubmitExpenseScreen } from '../expenses/SubmitExpenseScreen';
import { SalesmanExpensesScreen } from '../expenses/SalesmanExpensesScreen';

export type CGStackParamList = {
  Tabs: undefined;
  CustomerDetail: { customerId: string };
  AddCustomer: undefined;
  SubmitExpense: undefined;
};

const Stack = createNativeStackNavigator<CGStackParamList>();
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

function Tabs() {
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
            Today: 'today-outline',
            Deliver: 'cube-outline',
            Collect: 'archive-outline',
            Expenses: 'wallet-outline',
            EndOfDay: 'checkmark-done-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Today"
        component={CGTodayScreen}
        options={{ title: 'Today', headerTitle: "Today's Trip" }}
      />
      <Tab.Screen
        name="Deliver"
        component={CGDeliveryScreen}
        options={{ title: 'Deliver', headerTitle: 'Delivery sheet' }}
      />
      <Tab.Screen
        name="Collect"
        component={CGCollectionScreen}
        options={{ title: 'Collect', headerTitle: 'Empty collection' }}
      />
      <Tab.Screen
        name="Expenses"
        component={SalesmanExpensesScreen}
        options={{ title: 'Expenses', headerTitle: 'My expenses' }}
      />
      <Tab.Screen
        name="EndOfDay"
        component={CGEndOfDayScreen}
        options={{ title: 'End Day', headerTitle: 'End of day' }}
      />
    </Tab.Navigator>
  );
}

export function CGSalesmanNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' },
        headerTintColor: colors.primaryDark,
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CGCustomerDetailScreen}
        options={{ title: 'Customer' }}
      />
      <Stack.Screen
        name="AddCustomer"
        component={CGAddCustomerScreen}
        options={{ title: 'New customer' }}
      />
      <Stack.Screen
        name="SubmitExpense"
        component={SubmitExpenseScreen}
        options={{ title: 'New expense' }}
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

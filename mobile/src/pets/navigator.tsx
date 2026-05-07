/**
 * Pets Salesman navigator.
 *
 *   PetsStack (native stack)
 *   ├── Tabs (bottom tab navigator)
 *   │     ├── Customers
 *   │     ├── Sell
 *   │     ├── Returns
 *   │     └── EndOfDay
 *   └── PetCustomerDetail
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { PetsCustomersScreen } from './screens/PetsCustomersScreen';
import { PetsSellScreen } from './screens/PetsSellScreen';
import { PetsReturnsScreen } from './screens/PetsReturnsScreen';
import { PetsEndOfDayScreen } from './screens/PetsEndOfDayScreen';
import { PetsCustomerDetailScreen } from './screens/PetsCustomerDetailScreen';
import { PetsAddCustomerScreen } from './screens/PetsAddCustomerScreen';
import { SubmitExpenseScreen } from '../expenses/SubmitExpenseScreen';
import { SalesmanExpensesScreen } from '../expenses/SalesmanExpensesScreen';

export type PetsStackParamList = {
  Tabs: undefined;
  PetCustomerDetail: { customerId: string };
  AddCustomer: undefined;
  SubmitExpense: undefined;
};

const Stack = createNativeStackNavigator<PetsStackParamList>();
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
            Customers: 'people-outline',
            Sell: 'cash-outline',
            Returns: 'return-down-back-outline',
            Expenses: 'wallet-outline',
            EndOfDay: 'checkmark-done-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Customers"
        component={PetsCustomersScreen}
        options={{ title: 'Customers', headerTitle: 'Customers' }}
      />
      <Tab.Screen
        name="Sell"
        component={PetsSellScreen}
        options={{ title: 'Sell', headerTitle: 'Generate bill' }}
      />
      <Tab.Screen
        name="Returns"
        component={PetsReturnsScreen}
        options={{ title: 'Returns', headerTitle: 'Customer returns' }}
      />
      <Tab.Screen
        name="Expenses"
        component={SalesmanExpensesScreen}
        options={{ title: 'Expenses', headerTitle: 'My expenses' }}
      />
      <Tab.Screen
        name="EndOfDay"
        component={PetsEndOfDayScreen}
        options={{ title: 'End Day', headerTitle: 'End of day' }}
      />
    </Tab.Navigator>
  );
}

export function PetsSalesmanNavigator() {
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
        name="PetCustomerDetail"
        component={PetsCustomerDetailScreen}
        options={{ title: 'Customer' }}
      />
      <Stack.Screen
        name="AddCustomer"
        component={PetsAddCustomerScreen}
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

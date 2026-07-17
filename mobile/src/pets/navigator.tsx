/**
 * Pets Salesman navigator — left drawer.
 *
 *   Customers / Sell / Returns / Orders / Expenses / End Day
 *
 * Each drawer entry wraps its own Stack; shared push screens
 * (PetCustomerDetail, AddCustomer, SubmitExpense, OrderFulfillment) live
 * inside the stack they're reached from.
 */

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { PetsCustomersScreen } from './screens/PetsCustomersScreen';
import { PetsSellScreen } from './screens/PetsSellScreen';
import { PetsReturnsScreen } from './screens/PetsReturnsScreen';
import { PetsEndOfDayScreen } from './screens/PetsEndOfDayScreen';
import { PetsCustomerDetailScreen } from './screens/PetsCustomerDetailScreen';
import { PetsAddCustomerScreen } from './screens/PetsAddCustomerScreen';
import { SubmitExpenseScreen } from '../expenses/SubmitExpenseScreen';
import { SalesmanExpensesScreen } from '../expenses/SalesmanExpensesScreen';
import { SalesmanOrdersScreen } from '../orders/SalesmanOrdersScreen';
import { OrderFulfillmentScreen } from '../orders/OrderFulfillmentScreen';
import { RoleDrawerContent } from '../drawer/RoleDrawerContent';
import { roleStackScreenOptions, roleRootHeader } from '../drawer/headerOptions';
import { EndTripScreen } from '../trips/EndTripScreen';
import { SalesmanAssignmentsScreen } from '../trips/SalesmanAssignmentsScreen';

export type PetsStackParamList = {
  Landing: undefined;
  PetCustomerDetail: { customerId: string };
  AddCustomer: undefined;
  SubmitExpense: undefined;
  OrderFulfillment: { orderId: string };
};

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator<PetsStackParamList>();

function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={PetsCustomersScreen}
        options={{ title: 'Customers', ...roleRootHeader }}
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
    </Stack.Navigator>
  );
}

function SellStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={PetsSellScreen}
        options={{ title: 'Generate bill', ...roleRootHeader }}
      />
      <Stack.Screen
        name="PetCustomerDetail"
        component={PetsCustomerDetailScreen}
        options={{ title: 'Customer' }}
      />
    </Stack.Navigator>
  );
}

function ReturnsStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={PetsReturnsScreen}
        options={{ title: 'Customer returns', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={SalesmanOrdersScreen}
        options={{ title: 'My orders', ...roleRootHeader }}
      />
      <Stack.Screen
        name="OrderFulfillment"
        component={OrderFulfillmentScreen}
        options={{ title: 'Confirm delivery' }}
      />
    </Stack.Navigator>
  );
}

function ExpensesStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={SalesmanExpensesScreen}
        options={{ title: 'My expenses', ...roleRootHeader }}
      />
      <Stack.Screen
        name="SubmitExpense"
        component={SubmitExpenseScreen}
        options={{ title: 'New expense' }}
      />
    </Stack.Navigator>
  );
}

function EndOfDayStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={PetsEndOfDayScreen}
        options={{ title: 'End of day', ...roleRootHeader }}
      />
      <Stack.Screen
        name="SubmitExpense"
        component={SubmitExpenseScreen}
        options={{ title: 'New expense' }}
      />
    </Stack.Navigator>
  );
}

function AssignmentsStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={SalesmanAssignmentsScreen}
        options={{ title: 'My trips', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

export function PetsSalesmanNavigator() {
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
      drawerContent={(props) => <RoleDrawerContent {...props} roleLabel="Pets Salesman" />}
    >
      <Drawer.Screen
        name="Customers"
        component={CustomersStack}
        options={{
          title: 'Customers',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Sell"
        component={SellStack}
        options={{
          title: 'Sell',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Returns"
        component={ReturnsStack}
        options={{
          title: 'Returns',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="return-down-back-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          title: 'Orders',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Expenses"
        component={ExpensesStack}
        options={{
          title: 'Expenses',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="EndOfDay"
        component={EndOfDayStack}
        options={{
          title: 'End Day',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Assignments"
        component={AssignmentsStack}
        options={{
          title: 'My trips',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="EndTrip"
        component={EndTripScreen}
        options={{ title: 'End trip', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

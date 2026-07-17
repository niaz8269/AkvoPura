/**
 * Cans/Gallons Salesman navigator — left drawer.
 *
 *   Today / Deliver / Collect / Orders / Expenses / End Day
 *
 * Each drawer entry wraps its own Stack; shared push screens
 * (CustomerDetail, AddCustomer, SubmitExpense, OrderFulfillment) live
 * inside the stack they're reached from.
 */

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { CGTodayScreen } from './screens/CGTodayScreen';
import { CGDeliveryScreen } from './screens/CGDeliveryScreen';
import { CGCollectionScreen } from './screens/CGCollectionScreen';
import { CGEndOfDayScreen } from './screens/CGEndOfDayScreen';
import { CGCustomerDetailScreen } from './screens/CGCustomerDetailScreen';
import { CGAddCustomerScreen } from './screens/CGAddCustomerScreen';
import { SubmitExpenseScreen } from '../expenses/SubmitExpenseScreen';
import { SalesmanExpensesScreen } from '../expenses/SalesmanExpensesScreen';
import { SalesmanOrdersScreen } from '../orders/SalesmanOrdersScreen';
import { OrderFulfillmentScreen } from '../orders/OrderFulfillmentScreen';
import { RoleDrawerContent } from '../drawer/RoleDrawerContent';
import { roleStackScreenOptions, roleRootHeader } from '../drawer/headerOptions';
import { EndTripScreen } from '../trips/EndTripScreen';
import { SalesmanAssignmentsScreen } from '../trips/SalesmanAssignmentsScreen';

export type CGStackParamList = {
  Landing: undefined;
  CustomerDetail: { customerId: string };
  AddCustomer: undefined;
  SubmitExpense: undefined;
  OrderFulfillment: { orderId: string };
};

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator<CGStackParamList>();

function TodayStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={CGTodayScreen}
        options={{ title: "Today's Trip", ...roleRootHeader }}
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
    </Stack.Navigator>
  );
}

function DeliverStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={CGDeliveryScreen}
        options={{ title: 'Delivery sheet', ...roleRootHeader }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CGCustomerDetailScreen}
        options={{ title: 'Customer' }}
      />
    </Stack.Navigator>
  );
}

function CollectStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={CGCollectionScreen}
        options={{ title: 'Empty collection', ...roleRootHeader }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CGCustomerDetailScreen}
        options={{ title: 'Customer' }}
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
        component={CGEndOfDayScreen}
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

export function CGSalesmanNavigator() {
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
      drawerContent={(props) => <RoleDrawerContent {...props} roleLabel="Cans/Gallons Salesman" />}
    >
      <Drawer.Screen
        name="Today"
        component={TodayStack}
        options={{
          title: 'Today',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Deliver"
        component={DeliverStack}
        options={{
          title: 'Deliver',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Collect"
        component={CollectStack}
        options={{
          title: 'Collect',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color} />
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

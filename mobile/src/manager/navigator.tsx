/**
 * Manager navigator — left drawer.
 *
 *   Home / Customers / Trips / Expenses / Complaints / Team
 *
 * Home is a stack so the legacy "Van Load" screen is still reachable
 * (the assignments card on Home navigates there). Team is the staff
 * accounts stack — manage who can log into the app.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes } from '../theme';
import { ManagerHomeScreen } from './screens/ManagerHomeScreen';
import { ManagerCustomersScreen } from './screens/ManagerCustomersScreen';
import { ManagerTripsScreen } from './screens/ManagerTripsScreen';
import { ManagerTripDetailScreen } from './screens/ManagerTripDetailScreen';
import { ManagerPrepareTripScreen } from './screens/ManagerPrepareTripScreen';
import { ManagerExpensesScreen } from './screens/ManagerExpensesScreen';
import { ManagerStaffAccountsScreen } from './screens/ManagerStaffAccountsScreen';
import { ChangeMyPasswordScreen } from '../screens/ChangeMyPasswordScreen';
import { ManagerAddStaffAccountScreen } from './screens/ManagerAddStaffAccountScreen';
import { ManagerStaffAccountDetailScreen } from './screens/ManagerStaffAccountDetailScreen';
import { ManagerPendingRegistrationsScreen } from './screens/ManagerPendingRegistrationsScreen';
import { ManagerVerifyCustomerScreen } from './screens/ManagerVerifyCustomerScreen';
import { ManagerOrdersScreen } from './screens/ManagerOrdersScreen';
import { ManagerComplaintsScreen } from './screens/ManagerComplaintsScreen';
import { ComplaintDetailScreen } from '../complaints/ComplaintDetailScreen';
import { ManagerProductionScreen } from './screens/ManagerProductionScreen';
import { ManagerContainerFeesScreen } from './screens/ManagerContainerFeesScreen';
import { AgingReportScreen } from '../analytics/screens/AgingReportScreen';
import { CGAddCustomerScreen } from '../cg/screens/CGAddCustomerScreen';
import { PetsAddCustomerScreen } from '../pets/screens/PetsAddCustomerScreen';
import { useManager } from './state';
import { RoleDrawerContent } from '../drawer/RoleDrawerContent';
import { roleStackScreenOptions, roleRootHeader } from '../drawer/headerOptions';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerHomeScreen}
        options={{ title: 'Branch overview', ...roleRootHeader }}
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
        name="ComplaintDetail"
        component={ComplaintDetailScreen}
        options={{ title: 'Complaint' }}
      />
      <Stack.Screen
        name="Production"
        component={ManagerProductionScreen}
        options={{ title: 'Production' }}
      />
      <Stack.Screen
        name="ContainerFees"
        component={ManagerContainerFeesScreen}
        options={{ title: 'Container fees' }}
      />
    </Stack.Navigator>
  );
}

function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerCustomersScreen}
        options={{ title: 'All customers', ...roleRootHeader }}
      />
      <Stack.Screen
        name="AgingReport"
        component={AgingReportScreen}
        options={{ title: 'Aging report' }}
      />
      <Stack.Screen
        name="AddCGCustomer"
        component={CGAddCustomerScreen}
        options={{ title: 'New C/G customer' }}
      />
      <Stack.Screen
        name="AddPetCustomer"
        component={PetsAddCustomerScreen}
        options={{ title: 'New Pets customer' }}
      />
    </Stack.Navigator>
  );
}

function TripsStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerTripsScreen}
        options={{ title: 'Trips', ...roleRootHeader }}
      />
      <Stack.Screen
        name="TripDetail"
        component={ManagerTripDetailScreen}
        options={{ title: 'Trip detail' }}
      />
      <Stack.Screen
        name="PrepareTrip"
        component={ManagerPrepareTripScreen}
        options={{ title: 'Assign trip' }}
      />
    </Stack.Navigator>
  );
}

function ExpensesStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerExpensesScreen}
        options={{ title: 'Expense approvals', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

function ComplaintsStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={ManagerComplaintsScreen}
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

function TeamStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="StaffAccounts"
        component={ManagerStaffAccountsScreen}
        options={{ title: 'Staff accounts', ...roleRootHeader }}
      />
      <Stack.Screen
        name="AddStaffAccount"
        component={ManagerAddStaffAccountScreen}
        options={{ title: 'New staff account' }}
      />
      <Stack.Screen
        name="StaffAccountDetail"
        component={ManagerStaffAccountDetailScreen}
        options={{ title: 'Staff account' }}
      />
      <Stack.Screen
        name="PendingRegistrations"
        component={ManagerPendingRegistrationsScreen}
        options={{ title: 'Pending registrations' }}
      />
      <Stack.Screen
        name="VerifyCustomer"
        component={ManagerVerifyCustomerScreen}
        options={{ title: 'Verify customer' }}
      />
      <Stack.Screen
        name="ChangeMyPassword"
        component={ChangeMyPasswordScreen}
        options={{ title: 'Account settings' }}
      />
    </Stack.Navigator>
  );
}

function ExpensesDrawerLabel({ color, focused }: { color: string; focused: boolean }) {
  const { pendingExpenses } = useManager();
  const count = pendingExpenses.length;
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.labelText, { color }, focused ? styles.labelTextFocused : null]}>
        Expenses
      </Text>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ManagerNavigator() {
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
      drawerContent={(props) => <RoleDrawerContent {...props} roleLabel="Manager" />}
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
        name="Trips"
        component={TripsStack}
        options={{
          title: 'Trips',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Expenses"
        component={ExpensesStack}
        options={{
          title: 'Expenses',
          drawerLabel: (p) => <ExpensesDrawerLabel {...p} />,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Complaints"
        component={ComplaintsStack}
        options={{
          title: 'Complaints',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Team"
        component={TeamStack}
        options={{
          title: 'Team',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
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
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.textInverse, fontSize: 11, fontWeight: '900' },
});

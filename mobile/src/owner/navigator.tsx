/**
 * Owner navigator — left drawer.
 *
 *   Branches / Compare / Forwarded / Audit / Settings
 *
 * Each entry wraps its own Stack so pushed screens keep working. Forwarded
 * shows a red badge when there are approvals waiting on the owner.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes } from '../theme';
import { OwnerLandingScreen } from './screens/OwnerLandingScreen';
import { OwnerBranchOverviewScreen } from './screens/OwnerBranchOverviewScreen';
import { OwnerCombinedScreen } from './screens/OwnerCombinedScreen';
import { OwnerForwardedScreen } from './screens/OwnerForwardedScreen';
import { OwnerAuditScreen } from './screens/OwnerAuditScreen';
import { OwnerSettingsScreen } from './screens/OwnerSettingsScreen';
import { OwnerLeaderboardScreen } from './screens/OwnerLeaderboardScreen';
import { OwnerManageBranchesScreen } from './screens/OwnerManageBranchesScreen';
import { OwnerAddBranchScreen } from './screens/OwnerAddBranchScreen';
import { OwnerEditBranchScreen } from './screens/OwnerEditBranchScreen';
import { OwnerManageManagersScreen } from './screens/OwnerManageManagersScreen';
import { OwnerExpenseAnalyticsScreen } from './screens/OwnerExpenseAnalyticsScreen';
import { ManagerStaffAccountDetailScreen } from '../manager/screens/ManagerStaffAccountDetailScreen';
import { ManagerAddStaffAccountScreen } from '../manager/screens/ManagerAddStaffAccountScreen';
import { ChangeMyPasswordScreen } from '../screens/ChangeMyPasswordScreen';
import { AgingReportScreen } from '../analytics/screens/AgingReportScreen';
import { useManager } from '../manager/state';
import { RoleDrawerContent } from '../drawer/RoleDrawerContent';
import { roleStackScreenOptions, roleRootHeader } from '../drawer/headerOptions';
import type { BranchKey } from './types';

export type OwnerStackParamList = {
  Landing: undefined;
  BranchOverview: { branch: BranchKey };
  Combined: undefined;
  Leaderboard: undefined;
  AgingReport: undefined;
  ManageBranches: undefined;
  AddBranch: undefined;
  EditBranch: { slug: string };
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();
const SettingsStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function BranchesStack() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={OwnerLandingScreen}
        options={{ title: 'Owner', ...roleRootHeader }}
      />
      <Stack.Screen
        name="BranchOverview"
        component={OwnerBranchOverviewScreen}
        options={{ title: 'Branch' }}
      />
      <Stack.Screen
        name="Combined"
        component={OwnerCombinedScreen}
        options={{ title: 'Comparison' }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={OwnerLeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Stack.Screen
        name="AgingReport"
        component={AgingReportScreen}
        options={{ title: 'Aging report' }}
      />
      <Stack.Screen
        name="ManageBranches"
        component={OwnerManageBranchesScreen}
        options={{ title: 'Manage branches' }}
      />
      <Stack.Screen
        name="AddBranch"
        component={OwnerAddBranchScreen}
        options={{ title: 'New branch' }}
      />
      <Stack.Screen
        name="EditBranch"
        component={OwnerEditBranchScreen}
        options={{ title: 'Edit branch' }}
      />
    </Stack.Navigator>
  );
}

function WrappedCombined() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Combined"
        component={OwnerCombinedScreen}
        options={{ title: 'Branch comparison', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

function WrappedForwarded() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={OwnerForwardedScreen}
        options={{ title: 'Forwarded approvals', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

function WrappedAudit() {
  return (
    <Stack.Navigator screenOptions={roleStackScreenOptions}>
      <Stack.Screen
        name="Landing"
        component={OwnerAuditScreen}
        options={{ title: 'Audit log', ...roleRootHeader }}
      />
    </Stack.Navigator>
  );
}

function WrappedSettings() {
  return (
    <SettingsStack.Navigator screenOptions={roleStackScreenOptions}>
      <SettingsStack.Screen
        name="Landing"
        component={OwnerSettingsScreen}
        options={{ title: 'Settings', ...roleRootHeader }}
      />
      <SettingsStack.Screen
        name="ChangeMyPassword"
        component={ChangeMyPasswordScreen}
        options={{ title: 'Change my password' }}
      />
      <SettingsStack.Screen
        name="ManageManagers"
        component={OwnerManageManagersScreen}
        options={{ title: 'Branch managers' }}
      />
      <SettingsStack.Screen
        name="StaffAccountDetail"
        component={ManagerStaffAccountDetailScreen}
        options={{ title: 'Manager account' }}
      />
      <SettingsStack.Screen
        name="AddStaffAccount"
        component={ManagerAddStaffAccountScreen}
        options={{ title: 'New manager' }}
      />
      <SettingsStack.Screen
        name="ExpenseAnalytics"
        component={OwnerExpenseAnalyticsScreen}
        options={{ title: 'Expense analytics' }}
      />
    </SettingsStack.Navigator>
  );
}

function ForwardedDrawerLabel({ color, focused }: { color: string; focused: boolean }) {
  const { expenses } = useManager();
  const count = expenses.filter((e) => e.status === 'forwarded').length;
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.labelText, { color }, focused ? styles.labelTextFocused : null]}>
        Forwarded
      </Text>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function OwnerNavigator() {
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
      drawerContent={(props) => <RoleDrawerContent {...props} roleLabel="Owner" />}
    >
      <Drawer.Screen
        name="Branches"
        component={BranchesStack}
        options={{
          title: 'Branches',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="CombinedTab"
        component={WrappedCombined}
        options={{
          title: 'Compare',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="git-compare-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Forwarded"
        component={WrappedForwarded}
        options={{
          title: 'Forwarded',
          drawerLabel: (p) => <ForwardedDrawerLabel {...p} />,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="arrow-up-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Audit"
        component={WrappedAudit}
        options={{
          title: 'Audit',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={WrappedSettings}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
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

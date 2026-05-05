/**
 * Owner navigator — bottom tabs (Branches / Combined / Forwarded / Audit)
 * with Branch overview pushed on top of the Branches tab.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { OwnerLandingScreen } from './screens/OwnerLandingScreen';
import { OwnerBranchOverviewScreen } from './screens/OwnerBranchOverviewScreen';
import { OwnerCombinedScreen } from './screens/OwnerCombinedScreen';
import { OwnerForwardedScreen } from './screens/OwnerForwardedScreen';
import { OwnerAuditScreen } from './screens/OwnerAuditScreen';
import { useManager } from '../manager/state';
import type { BranchKey } from './types';

export type OwnerStackParamList = {
  Landing: undefined;
  BranchOverview: { branch: BranchKey };
  Combined: undefined;
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();
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

function BranchesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' },
        headerTintColor: colors.primaryDark,
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen
        name="Landing"
        component={OwnerLandingScreen}
        options={{ title: 'Owner' }}
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
    </Stack.Navigator>
  );
}

function ForwardedTabBadge() {
  const { expenses } = useManager();
  const count = expenses.filter((e) => e.status === 'forwarded').length;
  if (count === 0) return null;
  return <Text style={styles.badge}>{count}</Text>;
}

export function OwnerNavigator() {
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
            Branches: focused ? 'business' : 'business-outline',
            CombinedTab: focused ? 'git-compare' : 'git-compare-outline',
            Forwarded: focused ? 'arrow-up-circle' : 'arrow-up-circle-outline',
            Audit: focused ? 'list' : 'list-outline',
          };
          if (route.name === 'Forwarded') {
            return (
              <>
                <Ionicons
                  name={map[route.name] ?? 'ellipse-outline'}
                  size={size}
                  color={color}
                />
                <ForwardedTabBadge />
              </>
            );
          }
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Branches"
        component={BranchesStack}
        options={{ title: 'Branches' }}
      />
      <Tab.Screen
        name="CombinedTab"
        component={WrappedCombined}
        options={{ title: 'Compare' }}
      />
      <Tab.Screen
        name="Forwarded"
        component={WrappedForwarded}
        options={{ title: 'Forwarded' }}
      />
      <Tab.Screen
        name="Audit"
        component={WrappedAudit}
        options={{ title: 'Audit' }}
      />
    </Tab.Navigator>
  );
}

// Tabs need a header when entered directly (not via stack), so wrap each one.
function WrappedCombined() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' },
        headerTintColor: colors.primaryDark,
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen
        name="Combined"
        component={OwnerCombinedScreen}
        options={{ title: 'Branch comparison' }}
      />
    </Stack.Navigator>
  );
}

function WrappedForwarded() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' },
        headerTintColor: colors.primaryDark,
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen
        name="Landing"
        component={OwnerForwardedScreen}
        options={{ title: 'Forwarded approvals' }}
      />
    </Stack.Navigator>
  );
}

function WrappedAudit() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' },
        headerTintColor: colors.primaryDark,
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen
        name="Landing"
        component={OwnerAuditScreen}
        options={{ title: 'Audit log' }}
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

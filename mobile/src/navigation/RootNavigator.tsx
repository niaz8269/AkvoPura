/**
 * RootNavigator — top-level navigation.
 *
 * If no user is logged in, show the LoginScreen.
 * Otherwise show the role-based home (RoleHomeScreen branches by role internally).
 *
 * While the saved user is being restored from AsyncStorage, show a splash.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth, type ViewAsPayload, type ViewAsRole } from '../auth/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RoleHomeScreen } from '../screens/RoleHomeScreen';
import { CGSalesmanNavigator } from '../cg/navigator';
import { PetsSalesmanNavigator } from '../pets/navigator';
import { ManagerNavigator } from '../manager/navigator';
import { OwnerNavigator } from '../owner/navigator';
import { CustomerNavigator } from '../customer/navigator';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { useTutorial } from '../tutorial/state';
import { ActiveTripBanner } from '../trips/ActiveTripBanner';
import { navigationRef } from './navigationRef';
import { colors, fontSizes, spacing } from '../theme';
import { strings } from '../i18n/strings';
import type { Role } from '../auth/types';

const brandLogo = require('../../assets/brand/akvopura-brand.png');

const Stack = createNativeStackNavigator();

// Map each role to its top-level component.
// Every role now has a dedicated dashboard — RoleHomeScreen kept as a
// fallback safety net.
const ROLE_SCREENS: Partial<Record<Role, React.ComponentType<any>>> = {
  cans_gallons_salesman: CGSalesmanNavigator,
  pets_salesman: PetsSalesmanNavigator,
  manager: ManagerNavigator,
  owner: OwnerNavigator,
  customer: CustomerNavigator,
};

export function RootNavigator() {
  const { user, isLoading, viewAs } = useAuth();
  const { hasSeen, setActiveRole } = useTutorial();

  // When a user logs in (or restored on launch), kick off the tutorial if
  // they haven't seen their role's walkthrough yet on this device.
  useEffect(() => {
    if (user && !hasSeen(user.role)) {
      // Tiny delay so the tutorial appears just after the first screen paint
      // — feels like the screen is showing the user "where they are" first.
      const t = setTimeout(() => setActiveRole(user.role), 400);
      return () => clearTimeout(t);
    }
  }, [user, hasSeen, setActiveRole]);

  if (isLoading) return <Splash />;

  // Owner can temporarily "view as" a manager/salesman in a specific
  // branch — swap the top navigator to that role's dashboard while keeping
  // the auth user as owner. Data providers pick up the branch from
  // effectiveBranch in AuthContext.
  const effectiveRole =
    user?.role === 'owner' && viewAs ? viewAs.role : user?.role;
  const AuthedScreen = (user && effectiveRole && ROLE_SCREENS[effectiveRole]) ?? RoleHomeScreen;

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Root" component={AuthedScreen} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {user ? <ActiveTripBanner /> : null}
      {user?.role === 'owner' && viewAs ? <ImpersonationBanner payload={viewAs} /> : null}
      <TutorialOverlay />
    </>
  );
}

const VIEW_AS_LABELS: Record<ViewAsRole, string> = {
  manager: 'Manager',
  pets_salesman: 'Pets Salesman',
  cans_gallons_salesman: 'Cans/Gallons Salesman',
};

function ImpersonationBanner({ payload }: { payload: ViewAsPayload }) {
  const insets = useSafeAreaInsets();
  const { setViewAs } = useAuth();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.bannerWrap, { top: insets.top }]}
    >
      <View style={styles.banner}>
        <Ionicons name="eye-outline" size={16} color={colors.textInverse} />
        <Text style={styles.bannerText} numberOfLines={1}>
          {VIEW_AS_LABELS[payload.role]} · {payload.branchName}
        </Text>
        <Pressable
          onPress={() => setViewAs(null)}
          style={({ pressed }) => [styles.exitBtn, pressed ? { opacity: 0.85 } : null]}
          hitSlop={8}
        >
          <Text style={styles.exitBtnText}>Exit</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.appName}>{strings.appName.en}</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  appNameUr: {
    fontSize: fontSizes.title,
    color: colors.primary,
  },
  bannerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  bannerText: {
    color: colors.textInverse,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 4,
  },
  exitBtnText: {
    color: colors.textInverse,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
});

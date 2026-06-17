/**
 * RootNavigator — top-level navigation.
 *
 * If no user is logged in, show the LoginScreen.
 * Otherwise show the role-based home (RoleHomeScreen branches by role internally).
 *
 * While the saved user is being restored from AsyncStorage, show a splash.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../auth/AuthContext';
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
  const { user, isLoading } = useAuth();
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

  const AuthedScreen = (user && ROLE_SCREENS[user.role]) ?? RoleHomeScreen;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Home" component={AuthedScreen} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <TutorialOverlay />
    </>
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
});

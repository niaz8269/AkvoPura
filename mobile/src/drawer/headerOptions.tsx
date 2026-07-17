/**
 * Shared header options for stacks inside a role's Drawer.Navigator.
 *
 * `roleStackScreenOptions` = base header styling (no headerLeft — the
 * default back arrow shows on pushed screens).
 * `roleRootHeader` = same, plus hamburger on the left — apply on ROOT
 * screens of each stack so users can open the drawer from there.
 */

import React from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { HamburgerButton } from './HamburgerButton';
import { colors } from '../theme';

export const roleStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { color: colors.primaryDark, fontWeight: '800' },
  headerTintColor: colors.primaryDark,
};

export const roleRootHeader: Partial<NativeStackNavigationOptions> = {
  headerLeft: () => <HamburgerButton />,
};

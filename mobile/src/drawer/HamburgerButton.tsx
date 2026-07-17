/**
 * HamburgerButton — opens the enclosing drawer navigator.
 *
 * Drop in as `headerLeft` on any Stack.Navigator screenOptions that lives
 * inside a Drawer.Navigator. `useNavigation` + `DrawerActions` bubble the
 * open request up to the nearest drawer.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { colors, spacing } from '../theme';

export function HamburgerButton() {
  const nav = useNavigation();
  return (
    <Pressable
      onPress={() => nav.dispatch(DrawerActions.openDrawer())}
      style={({ pressed }) => [styles.btn, pressed ? { opacity: 0.6 } : null]}
      accessibilityLabel="Open menu"
      hitSlop={8}
    >
      <Ionicons name="menu" size={26} color={colors.primaryDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.xs,
  },
});

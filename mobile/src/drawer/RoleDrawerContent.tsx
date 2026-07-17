/**
 * RoleDrawerContent — shared drawer body for every role's navigator.
 *
 * Header: AkvoPura logo + role label + signed-in user name.
 * Body: default DrawerItemList (picks up options.drawerLabel / drawerIcon
 *       from each Drawer.Screen).
 * Footer: logout button, safe-area aware.
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { colors, fontSizes, spacing } from '../theme';

const brandLogo = require('../../assets/brand/akvopura-brand.png');

type Props = DrawerContentComponentProps & {
  roleLabel: string;
};

export function RoleDrawerContent({ roleLabel, ...props }: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.roleLabel}>{roleLabel}</Text>
          {user?.name ? (
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
          ) : null}
        </View>
        <View style={styles.itemsWrap}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <Pressable
        onPress={logout}
        style={({ pressed }) => [
          styles.logoutBtn,
          { paddingBottom: spacing.md + Math.max(insets.bottom, 12) },
          pressed ? { opacity: 0.7 } : null,
        ]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.primaryDark} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  logo: { width: 48, height: 48, marginBottom: spacing.sm },
  roleLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  userName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.textInverse,
    marginTop: 2,
  },
  itemsWrap: { paddingTop: spacing.xs },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});

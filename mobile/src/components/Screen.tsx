/**
 * Screen — root wrapper for every screen.
 * Handles safe area insets, status bar, and the standard background.
 */

import React, { type PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, spacing } from '../theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}>;

export function Screen({ children, scroll = false, padded = true, style }: Props) {
  const containerStyle = [
    styles.container,
    padded ? styles.padded : null,
    style,
  ];

  const Body = scroll ? (
    <ScrollView
      style={styles.scrollFlex}
      contentContainerStyle={containerStyle}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={containerStyle}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {Body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollFlex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

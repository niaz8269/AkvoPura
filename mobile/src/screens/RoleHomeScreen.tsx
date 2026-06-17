/**
 * RoleHomeScreen — stub home for every role in Slice 1.
 *
 * Shows the welcome card, role badge, branch (if any), and a logout button.
 * Each role's body is a placeholder describing what gets built in the next slice.
 * In future slices, each branch of the switch is replaced by a full dashboard.
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BilingualButton, Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme';
import { strings, type BilingualString } from '../i18n/strings';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../auth/types';

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const canIcon = require('../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../assets/brand/19ltr-gallon.webp');

const ROLE_LABEL: Partial<Record<Role, BilingualString>> = {
  owner: strings.roleOwner,
  manager: strings.roleManager,
  pets_salesman: strings.rolePetsSalesman,
  cans_gallons_salesman: strings.roleCansSalesman,
  customer: strings.roleCustomer,
};

const FALLBACK_ROLE_LABEL: BilingualString = { en: 'Staff', ur: 'عملہ' };

/** Built-in branch labels for the original two branches; for branches added
 *  later we just show the slug capitalised. */
const BRANCH_LABEL: Record<string, BilingualString> = {
  timergara: strings.branchTimergara,
  shergarh: strings.branchShergarh,
};

export function RoleHomeScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel = ROLE_LABEL[user.role] ?? FALLBACK_ROLE_LABEL;
  const branchLabel = user.branch
    ? BRANCH_LABEL[user.branch] ?? {
        en: capitalise(user.branch),
        ur: capitalise(user.branch),
      }
    : null;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeEn}>{strings.welcome.en},</Text>
            <Text style={styles.welcomeUr}>{strings.welcome.ur}،</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <RoleIcon role={user.role} />
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {roleLabel.en} • {roleLabel.ur}
            </Text>
          </View>
          {branchLabel ? (
            <View style={[styles.badge, styles.badgeBranch]}>
              <Text style={styles.badgeText}>
                {strings.branch.en}: {branchLabel.en} • {branchLabel.ur}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <RoleSpecificStub role={user.role} />
      </View>

      <View style={styles.footer}>
        <BilingualButton
          label={strings.logout}
          onPress={logout}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

function RoleIcon({ role }: { role: Role }) {
  if (role === 'cans_gallons_salesman') {
    return (
      <View style={styles.iconRow}>
        <Image source={canIcon} style={styles.icon} resizeMode="contain" />
        <Image source={gallonIcon} style={styles.icon} resizeMode="contain" />
      </View>
    );
  }
  return null;
}

function RoleSpecificStub({ role }: { role: Role }) {
  const stub = STUB_CONTENT[role] ?? {
    titleEn: 'Portal coming soon',
    titleUr: 'پورٹل جلد آرہا ہے',
    points: ['Your role does not have a dedicated portal yet.'],
  };
  return (
    <View style={styles.stubCard}>
      <Text style={styles.stubTitle}>{stub.titleEn}</Text>
      <Text style={styles.stubTitleUr}>{stub.titleUr}</Text>
      <View style={styles.divider} />
      {stub.points.map((p, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{p}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <Text style={styles.comingSoonEn}>{strings.comingSoon.en}</Text>
      <Text style={styles.comingSoonUr}>{strings.comingSoon.ur}</Text>
    </View>
  );
}

const STUB_CONTENT: Partial<Record<
  Role,
  { titleEn: string; titleUr: string; points: string[] }
>> = {
  owner: {
    titleEn: 'Owner Dashboard',
    titleUr: 'مالک کا ڈیش بورڈ',
    points: [
      'Branch overview: Timergara & Shergarh',
      'Inventory, production, sales, expenses, P&L',
      'Staff accounts and audit logs',
      'Cross-branch comparison and exports',
    ],
  },
  manager: {
    titleEn: 'Manager Dashboard',
    titleUr: 'منیجر کا ڈیش بورڈ',
    points: [
      'Van loading & multi-trip audit',
      'Customer & route management',
      'Production tracking & expense approvals',
      'Order inbox & complaints',
    ],
  },
  pets_salesman: {
    titleEn: 'Pets Salesman Dashboard',
    titleUr: 'پیٹس سیلز مین کا ڈیش بورڈ',
    points: [
      "Today's route and van load (read-only)",
      'Customer list with full history',
      'Bill generation and returns logging',
      'End-of-day cash reconciliation',
    ],
  },
  cans_gallons_salesman: {
    titleEn: 'Cans / Gallons Salesman Dashboard',
    titleUr: 'کین / گیلن سیلز مین کا ڈیش بورڈ',
    points: [
      'Color-coded customer cards (white / yellow / red)',
      'Slide-to-confirm delivery with +/- quantity',
      'Separate empty-container collection sheet',
      'Hospital • Bypass • Others route tabs',
    ],
  },
  customer: {
    titleEn: 'Customer Portal',
    titleUr: 'کسٹمر پورٹل',
    points: [
      'Place orders for Pets, Cans, Gallons',
      'Track deliveries and outstanding balance',
      'View bills and payment history',
      'Chat with salesman and file complaints',
    ],
  },
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeEn: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
  },
  welcomeUr: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  userName: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icon: {
    width: 44,
    height: 44,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  badgeBranch: {
    backgroundColor: colors.primaryLight + '22',
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  body: {
    flex: 1,
  },
  stubCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  stubTitle: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  stubTitleUr: {
    fontSize: fontSizes.body,
    color: colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 7,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.text,
    lineHeight: 22,
  },
  comingSoonEn: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
    textAlign: 'center',
  },
  comingSoonUr: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.xl,
  },
});

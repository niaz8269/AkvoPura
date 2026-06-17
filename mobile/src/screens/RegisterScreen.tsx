/**
 * RegisterScreen — customer self-registration.
 *
 * Customer picks branch + Cans/Gallons vs Pets, fills basic identity. After
 * submit, account is created in "pending" state on the server. The branch
 * manager has to approve before the customer can log in.
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen, TextField } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme';
import { registerCustomer } from '../api/users';
import { ApiError } from '../api/client';

type Nav = { goBack: () => void };

type CustomerKind = 'cg' | 'pets';
type Branch = 'timergara' | 'shergarh';

const BRANCH_LABELS: Record<Branch, string> = {
  timergara: 'Timergara',
  shergarh: 'Shergarh',
};

const KIND_LABELS: Record<CustomerKind, { en: string; ur: string; desc: string }> = {
  cg: {
    en: 'Cans / Gallons',
    ur: 'کین / گیلن',
    desc: 'Daily or weekly delivery of refillable cans and gallons',
  },
  pets: {
    en: 'Bottled (Pets)',
    ur: 'بوتل',
    desc: '600ml and 1.5L bottle packs delivered to shops, offices, homes',
  },
};

export function RegisterScreen({ navigation }: { navigation: Nav }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState<Branch>('timergara');
  const [kind, setKind] = useState<CustomerKind>('cg');
  const [submitting, setSubmitting] = useState(false);

  const valid =
    name.trim().length >= 2 &&
    identifier.trim().length >= 3 &&
    phone.trim().length >= 4 &&
    password.length >= 6;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await registerCustomer({
        identifier: identifier.trim(),
        name: name.trim(),
        password,
        phone: phone.trim(),
        branchSlug: branch,
        customerKind: kind,
      });
      Alert.alert(
        'Registration submitted',
        'Your account has been created. The branch manager will review it shortly. You can log in once they approve you.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : e.message || e.code
          : 'Unknown error';
      Alert.alert('Could not register', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed ? { opacity: 0.6 } : null]}
            accessibilityLabel="Back to login"
          >
            <Ionicons name="arrow-back" size={20} color={colors.primaryDark} />
            <Text style={styles.backText}>Back to login</Text>
          </Pressable>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.titleUr}>اپنا اکاؤنٹ بنائیں</Text>
          <Text style={styles.subtitle}>
            We'll pass your details to the branch manager. They'll approve your
            account within a day.
          </Text>
        </View>

        <TextField
          label={{ en: 'Full name *', ur: 'نام' }}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Akbar Khan"
          autoCapitalize="words"
        />

        <TextField
          label={{ en: 'Login username *', ur: 'یوزر نیم' }}
          value={identifier}
          onChangeText={(t) => setIdentifier(t.toLowerCase())}
          placeholder="e.g. akbar03001234567"
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          You'll use this to log in. Tip: use your phone number — it's easy to
          remember.
        </Text>

        <TextField
          label={{ en: 'Phone *', ur: 'فون' }}
          value={phone}
          onChangeText={setPhone}
          placeholder="0300-1234567"
          keyboardType="phone-pad"
        />

        <TextField
          label={{ en: 'Password *', ur: 'پاسورڈ' }}
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 6 characters"
          secureTextEntry
        />

        <Text style={styles.sectionLabel}>BRANCH *</Text>
        <View style={styles.pillRow}>
          {(['timergara', 'shergarh'] as Branch[]).map((b) => {
            const active = b === branch;
            return (
              <Pressable
                key={b}
                onPress={() => setBranch(b)}
                style={({ pressed }) => [
                  styles.pill,
                  active ? styles.pillActive : null,
                  pressed && !active ? { opacity: 0.7 } : null,
                ]}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
                  {BRANCH_LABELS[b]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>CUSTOMER TYPE *</Text>
        <View style={{ gap: spacing.sm }}>
          {(['cg', 'pets'] as CustomerKind[]).map((k) => {
            const active = k === kind;
            const label = KIND_LABELS[k];
            return (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                style={({ pressed }) => [
                  styles.kindCard,
                  active ? styles.kindCardActive : null,
                  pressed && !active ? { opacity: 0.8 } : null,
                ]}
              >
                <View style={[styles.kindIcon, active ? styles.kindIconActive : null]}>
                  <Ionicons
                    name={k === 'cg' ? 'water-outline' : 'cube-outline'}
                    size={22}
                    color={active ? colors.textInverse : colors.primaryDark}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kindTitle, active ? styles.kindTitleActive : null]}>
                    {label.en}
                    <Text style={styles.kindTitleUr}>  {label.ur}</Text>
                  </Text>
                  <Text style={[styles.kindDesc, active ? styles.kindDescActive : null]}>
                    {label.desc}
                  </Text>
                </View>
                {active ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.textInverse} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <BilingualButton
          label={{
            en: submitting ? 'Submitting…' : 'Create account',
            ur: 'اکاؤنٹ بنائیں',
          }}
          onPress={submit}
          disabled={!valid || submitting}
          style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  title: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  titleUr: {
    fontSize: fontSizes.title,
    color: colors.primary,
    marginTop: 2,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  hint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  pillText: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  pillTextActive: { color: colors.textInverse },
  kindCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  kindCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  kindIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindIconActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  kindTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  kindTitleUr: { fontSize: fontSizes.sm, color: colors.primary },
  kindTitleActive: { color: colors.textInverse },
  kindDesc: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  kindDescActive: { color: 'rgba(255,255,255,0.85)' },
});

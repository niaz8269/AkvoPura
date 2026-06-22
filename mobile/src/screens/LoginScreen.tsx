/**
 * LoginScreen — entry point.
 *
 * Brand logo, identifier + password fields, Login button, and a link to the
 * customer self-registration form.
 */

import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BilingualButton, Screen, TextField } from '../components';
import { colors, fontSizes, spacing } from '../theme';
import { strings } from '../i18n/strings';
import { useAuth } from '../auth/AuthContext';

const brandLogo = require('../../assets/brand/akvopura-brand.png');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LoginScreen({ navigation }: { navigation: any }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(strings.loginFailed.en);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.brandBlock}>
          <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>{strings.appName.en}</Text>
          <Text style={styles.tagline}>{strings.tagline.en}</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label={strings.phoneOrEmail}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Your username"
            autoCapitalize="none"
            autoComplete="username"
            testID="login-identifier"
          />
          <TextField
            label={strings.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            testID="login-password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <BilingualButton
            label={strings.login}
            onPress={onSubmit}
            loading={submitting}
            disabled={!identifier || !password}
          />

          <Pressable
            onPress={() => navigation.navigate('Register')}
            style={({ pressed }) => [
              styles.registerLink,
              pressed ? { opacity: 0.6 } : null,
            ]}
            accessibilityLabel="Create a customer account"
          >
            <Text style={styles.registerLinkPrefix}>New customer?</Text>
            <Text style={styles.registerLinkAction}>Create account →</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandBlock: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 140,
    height: 140,
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
    marginTop: 2,
  },
  tagline: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  form: {
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  registerLinkPrefix: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  registerLinkAction: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primary,
  },
});

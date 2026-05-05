/**
 * TutorialOverlay — full-screen modal that walks a freshly-logged-in user
 * through their role's main features. Step-through with Skip / Next / Done.
 */

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, radii, spacing } from '../theme';
import { TUTORIAL_STEPS, type TutorialStep } from './steps';
import { useTutorial } from './state';

export function TutorialOverlay() {
  const { activeRole, setActiveRole, markSeen } = useTutorial();
  const [stepIndex, setStepIndex] = useState(0);

  if (!activeRole) return null;
  const steps = TUTORIAL_STEPS[activeRole];
  if (!steps || steps.length === 0) return null;
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const close = () => {
    markSeen(activeRole);
    setActiveRole(null);
    setStepIndex(0);
  };

  const next = () => {
    if (isLast) close();
    else setStepIndex((i) => i + 1);
  };

  const back = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  return (
    <Modal
      visible={!!activeRole}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={step.icon as any}
                size={32}
                color={colors.primary}
              />
            </View>
            <Pressable
              onPress={close}
              style={({ pressed }) => [
                styles.skipBtn,
                pressed ? { opacity: 0.7 } : null,
              ]}
              accessibilityLabel="Skip tutorial"
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{step.titleEn}</Text>
          <Text style={styles.titleUr}>{step.titleUr}</Text>
          <Text style={styles.body}>{step.bodyEn}</Text>
          <Text style={styles.bodyUr}>{step.bodyUr}</Text>

          <View style={styles.dotRow}>
            {steps.map((_: TutorialStep, i: number) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === stepIndex ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>

          <View style={styles.actionRow}>
            {stepIndex > 0 ? (
              <Pressable
                onPress={back}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnSecondary,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
                <Text style={styles.btnSecondaryText}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <Pressable
              onPress={next}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {isLast ? "Got it" : "Next"}
              </Text>
              {!isLast ? (
                <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
              ) : (
                <Ionicons name="checkmark" size={18} color={colors.textInverse} />
              )}
            </Pressable>
          </View>

          <Text style={styles.stepCount}>
            Step {stepIndex + 1} of {steps.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 34, 51, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  title: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  titleUr: {
    fontSize: fontSizes.body,
    color: colors.primary,
    marginTop: 2,
  },
  body: {
    fontSize: fontSizes.body,
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  bodyUr: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 18 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    minWidth: 110,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.textInverse,
    fontSize: fontSizes.body,
    fontWeight: '800',
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  btnSecondaryText: {
    color: colors.primary,
    fontSize: fontSizes.body,
    fontWeight: '800',
  },
  stepCount: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

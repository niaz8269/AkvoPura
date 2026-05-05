/**
 * SwipeToConfirm — drag the thumb across to confirm an action.
 *
 * Per spec: "slide-to-confirm arrow (similar to swipe to unlock)" —
 * this is the gesture salesmen use to mark a delivery / collection done.
 *
 * Built with PanResponder (no extra deps). When the thumb crosses ~70% of the
 * track, onConfirm fires and the row turns green. Reset by setting `done={false}`.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';

import { colors, fontSizes, radii, spacing, tapTarget } from '../theme';

type Props = {
  labelEn: string;
  labelUr?: string;
  doneLabelEn?: string;
  doneLabelUr?: string;
  done?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  style?: ViewStyle;
};

const THUMB = tapTarget.min + 8;

export function SwipeToConfirm({
  labelEn,
  labelUr,
  doneLabelEn = 'Done',
  doneLabelUr = 'مکمل',
  done,
  disabled,
  onConfirm,
  style,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const xValueRef = useRef(0);
  const confirmedRef = useRef(false);

  useEffect(() => {
    const id = x.addListener((s) => {
      xValueRef.current = s.value;
    });
    return () => x.removeListener(id);
  }, [x]);

  // External `done` toggle — animate to the end position or reset.
  useEffect(() => {
    if (done) {
      Animated.timing(x, {
        toValue: Math.max(0, trackWidth - THUMB),
        duration: 200,
        useNativeDriver: false,
      }).start();
      confirmedRef.current = true;
    } else {
      Animated.timing(x, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      confirmedRef.current = false;
    }
  }, [done, trackWidth, x]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        x.setOffset(xValueRef.current);
        x.setValue(0);
      },
      onPanResponderMove: (_e, g) => {
        if (disabled) return;
        const max = Math.max(0, trackWidth - THUMB);
        const next = Math.min(Math.max(g.dx, -xValueRef.current), max - xValueRef.current);
        x.setValue(next);
      },
      onPanResponderRelease: () => {
        x.flattenOffset();
        const max = Math.max(0, trackWidth - THUMB);
        const threshold = max * 0.7;

        if (xValueRef.current >= threshold && !confirmedRef.current) {
          confirmedRef.current = true;
          Animated.timing(x, {
            toValue: max,
            duration: 120,
            useNativeDriver: false,
          }).start(() => onConfirm());
        } else if (!confirmedRef.current) {
          Animated.spring(x, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        x.flattenOffset();
        if (!confirmedRef.current) {
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const isDone = !!done;

  return (
    <View
      style={[styles.track, isDone ? styles.trackDone : null, disabled ? styles.disabled : null, style]}
      onLayout={onLayout}
    >
      <View style={styles.labelWrap} pointerEvents="none">
        <Text style={[styles.labelEn, isDone ? styles.labelDone : null]}>
          {isDone ? doneLabelEn : labelEn}
        </Text>
        {labelUr || doneLabelUr ? (
          <Text style={[styles.labelUr, isDone ? styles.labelDone : null]}>
            {isDone ? doneLabelUr : labelUr}
          </Text>
        ) : null}
      </View>

      {!isDone ? (
        <Animated.View
          {...responder.panHandlers}
          style={[
            styles.thumb,
            {
              transform: [{ translateX: x }],
            },
          ]}
        >
          <Text style={styles.thumbArrow}>›</Text>
        </Animated.View>
      ) : (
        <View style={[styles.thumb, styles.thumbDone, { left: trackWidth - THUMB }]}>
          <Text style={styles.thumbCheck}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: THUMB + 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  trackDone: {
    backgroundColor: colors.statusGreen + '33',
    borderColor: colors.statusGreen,
  },
  disabled: { opacity: 0.5 },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  labelEn: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  labelUr: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  labelDone: {
    color: colors.success,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
    marginLeft: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 3,
  },
  thumbDone: {
    backgroundColor: colors.success,
    position: 'absolute',
  },
  thumbArrow: {
    color: colors.textInverse,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 36,
    marginTop: -4,
  },
  thumbCheck: {
    color: colors.textInverse,
    fontSize: 24,
    fontWeight: '900',
  },
});

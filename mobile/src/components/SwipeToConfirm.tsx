/**
 * SwipeToConfirm — drag the thumb across to confirm an action.
 *
 * Per spec: "slide-to-confirm arrow (similar to swipe to unlock)".
 *
 * Uses react-native-gesture-handler's PanGestureHandler so the swipe is
 * captured cleanly even when nested inside ScrollView / KeyboardAvoidingView
 * (where React Native's built-in PanResponder loses the gesture race on the
 * new architecture).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';

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
  const translateX = useRef(new Animated.Value(0)).current;
  const lastValue = useRef(0);
  const confirmedRef = useRef(false);

  // Keep a JS copy of the animated value so we can read it on release.
  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      lastValue.current = value;
    });
    return () => translateX.removeListener(id);
  }, [translateX]);

  // External `done` toggle — animate to the end position or reset.
  useEffect(() => {
    const max = Math.max(0, trackWidth - THUMB);
    if (done) {
      Animated.timing(translateX, {
        toValue: max,
        duration: 200,
        useNativeDriver: true,
      }).start();
      confirmedRef.current = true;
    } else {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      confirmedRef.current = false;
    }
  }, [done, trackWidth, translateX]);

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const onGestureEvent = (e: PanGestureHandlerGestureEvent) => {
    if (disabled || confirmedRef.current) return;
    const max = Math.max(0, trackWidth - THUMB);
    const next = Math.min(Math.max(e.nativeEvent.translationX, 0), max);
    translateX.setValue(next);
  };

  const onHandlerStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    if (disabled || confirmedRef.current) return;

    const max = Math.max(0, trackWidth - THUMB);
    const threshold = max * 0.7;

    if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED) {
      if (lastValue.current >= threshold) {
        confirmedRef.current = true;
        Animated.timing(translateX, {
          toValue: max,
          duration: 120,
          useNativeDriver: true,
        }).start(() => onConfirm());
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      }
    }
  };

  const isDone = !!done;

  return (
    <View
      style={[
        styles.track,
        isDone ? styles.trackDone : null,
        disabled ? styles.disabled : null,
        style,
      ]}
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
        <PanGestureHandler
          enabled={!disabled}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-10, 10]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <Text style={styles.thumbArrow}>›</Text>
          </Animated.View>
        </PanGestureHandler>
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

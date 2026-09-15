import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'dark' | 'outline'
  loading = false,
  disabled = false,
  style,
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'dark' && styles.dark,
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.ink : variant === 'outline' ? colors.ink : colors.paper} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' && styles.textPrimary,
            variant === 'secondary' && styles.textSecondary,
            variant === 'dark' && styles.textDark,
            variant === 'outline' && styles.textOutline,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.amber },
  secondary: {
    // Light text + translucent light border — legible on DARK screens
    // only (e.g. Onboarding's colors.ink background). Use `outline`
    // instead on light/paper/white surfaces.
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(234,235,232,0.3)',
  },
  dark: {
    backgroundColor: colors.ink,
  },
  outline: {
    // Dark text + solid dark-ish border — the light-surface equivalent
    // of `secondary`.
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  textPrimary: { color: colors.ink },
  textSecondary: { color: colors.paper },
  textDark: { color: colors.paper },
  textOutline: { color: colors.ink },
});

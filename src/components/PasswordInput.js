import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts, radius, spacing } from '../theme';

// Same look as Input.js, but manages its own show/hide state — every
// password field in the app (Signup, Login) should use this instead of
// Input directly, so the toggle behavior stays consistent everywhere.
export default function PasswordInput({ label, error, style, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.fieldRow}>
        <TextInput
          placeholderTextColor={colors.inkSoft}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          style={[styles.input, error && styles.inputError, style]}
          {...props}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          style={styles.eyeButton}
          hitSlop={10}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkSoft} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft, marginBottom: 6 },
  fieldRow: { justifyContent: 'center' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingRight: 44,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  inputError: { borderColor: '#D9534F' },
  eyeButton: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  error: { fontFamily: fonts.body, fontSize: 12, color: '#D9534F', marginTop: 4 },
});

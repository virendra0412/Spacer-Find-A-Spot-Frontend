import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import PasswordInput from '../../components/PasswordInput';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { validatePassword, passwordChecklist } from '../../utils/passwordRules';
import { colors, fonts, spacing } from '../../theme';

export default function Signup({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checklist = passwordChecklist(password);

  const onSubmit = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('Enter your name.');
    if (phone.trim().length < 8) return setError('Enter a valid phone number.');
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);

    setLoading(true);
    try {
      await signup({ name: name.trim(), phone: phone.trim(), password });
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not create your account. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Create your account</Text>
          <Text style={styles.sub}>One account works for both finding and listing spots.</Text>

          <Input label="Full name" value={name} onChangeText={setName} placeholder="Ashok Patel" />
          <Input
            label="Phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="9990001111"
          />
          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
          />
          {password.length > 0 && (
            <View style={styles.checklist}>
              {checklist.map((rule) => (
                <Text key={rule.label} style={[styles.checkItem, rule.pass && styles.checkItemPass]}>
                  {rule.pass ? '✓' : '·'} {rule.label}
                </Text>
              ))}
            </View>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Create account" onPress={onSubmit} loading={loading} style={{ marginTop: 8 }} />

          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            Already have an account? Log in
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  h1: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginBottom: 24 },
  checklist: { marginTop: -8, marginBottom: 16 },
  checkItem: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginBottom: 2 },
  checkItemPass: { color: colors.green },
  error: { fontFamily: fonts.body, fontSize: 13, color: '#D9534F', marginBottom: 12 },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

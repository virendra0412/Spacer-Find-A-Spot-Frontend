import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import PasswordInput from '../../components/PasswordInput';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, spacing } from '../../theme';

export default function Login({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(phone.trim(), password);
      // Navigation switches automatically once AuthContext.isAuthenticated
      // flips true — RootNavigator re-renders into AppTabs.
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not log in. Check your details and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.sub}>Log in to find or manage your spots.</Text>

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
            placeholder="••••••••"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Log in" onPress={onSubmit} loading={loading} style={{ marginTop: 8 }} />

          <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
            New to Spacer? Create an account
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  h1: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginBottom: 24 },
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

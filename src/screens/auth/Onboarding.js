import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Button from '../../components/Button';
import { colors, fonts, spacing } from '../../theme';

export default function Onboarding({ navigation }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.visual}>
        <View style={[styles.spot, { top: 14, left: 14 }]} />
        <View style={[styles.spot, { top: 14, left: 90 }]} />
        <View style={[styles.spot, styles.spotFree, { top: 14, left: 166 }]}>
          <Text style={styles.spotPrice}>₹15/hr</Text>
        </View>
        <View style={[styles.spot, { top: 62, left: 14 }]} />
        <View style={[styles.spot, styles.spotFree, { top: 62, left: 90 }]}>
          <Text style={styles.spotPrice}>₹12/hr</Text>
        </View>
        <View style={[styles.spot, { top: 62, left: 166 }]} />
      </View>

      <View style={styles.body}>
        <Text style={styles.brand}>◆ Spacer</Text>
        <Text style={styles.h2}>
          Someone's lot is empty <Text style={styles.amber}>right now.</Text>
        </Text>
        <Text style={styles.p}>
          Offices after 6pm. Apartments during the day. Spacer turns unused
          parking into spots you can actually book.
        </Text>

        <View style={{ gap: 10 }}>
          <Button title="Find a spot" variant="primary" onPress={() => navigation.navigate('Signup')} />
          <Button title="List your spot" variant="secondary" onPress={() => navigation.navigate('Signup')} />
        </View>
        <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          Already have an account? Log in
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  visual: {
    height: 200,
    margin: spacing.xl,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(234,235,232,0.14)',
    borderRadius: 14,
  },
  spot: {
    position: 'absolute',
    width: 60,
    height: 40,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(234,235,232,0.35)',
  },
  spotFree: { borderColor: colors.green, backgroundColor: 'rgba(47,191,143,0.14)' },
  spotPrice: {
    position: 'absolute',
    bottom: -18,
    left: 0,
    fontFamily: fonts.displayMedium,
    fontSize: 10,
    color: colors.green,
  },
  body: { flex: 1, justifyContent: 'flex-end', padding: spacing.xl },
  brand: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.paper, marginBottom: 18 },
  h2: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.paper, marginBottom: 14 },
  amber: { color: colors.amber },
  p: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: '#B9BBB7', marginBottom: 22 },
  loginLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.paper,
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
});

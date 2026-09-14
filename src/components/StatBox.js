import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';

export default function StatBox({ label, value }) {
  return (
    <View style={styles.box}>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  value: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  label: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 2 },
});

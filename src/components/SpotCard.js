import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

export default function SpotCard({ listing, onPress }) {
  const distanceLabel =
    listing.distance_m != null ? `${(Number(listing.distance_m) / 1000).toFixed(1)} km away` : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.photo}>
        {listing.status === 'active' ? (
          <View style={styles.availTag}>
            <Text style={styles.availTagText}>Available</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        {listing.address_text ? (
          <Text style={styles.sub} numberOfLines={1}>{listing.address_text}</Text>
        ) : null}

        <View style={styles.metaRow}>
          {distanceLabel ? <Text style={styles.meta}>{distanceLabel}</Text> : null}
          {listing.covered ? <Text style={styles.meta}>· Covered</Text> : null}
        </View>
      </View>

      <View style={styles.priceWrap}>
        <Text style={styles.price}>₹{Number(listing.price_per_hour).toFixed(0)}</Text>
        <Text style={styles.priceUnit}>/hr</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.85 },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.asphalt2,
    marginRight: spacing.md,
    justifyContent: 'flex-end',
    padding: 4,
  },
  availTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    borderRadius: radius.xl,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availTagText: { fontFamily: fonts.bodySemibold, fontSize: 8, color: colors.ink },
  body: { flex: 1, marginRight: spacing.sm },
  title: { fontFamily: fonts.bodySemibold, fontSize: 14.5, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  meta: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.inkSoft },
  priceWrap: { alignItems: 'flex-end' },
  price: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  priceUnit: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft },
});

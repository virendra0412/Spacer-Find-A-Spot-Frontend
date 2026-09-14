import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Button from '../../components/Button';
import { createBooking } from '../../api/bookings.api';
import { colors, fonts, radius, spacing } from '../../theme';

// Simple duration-picker booking flow: "book starting now, for N hours."
// This keeps v1 simple — a full calendar/time-range picker is a natural
// next iteration once the core loop (search → book → park → pay) is proven.
const DURATIONS = [1, 2, 4, 8];

export default function ConfirmBooking({ route, navigation }) {
  const { listing } = route.params;
  const [hours, setHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const { startAt, endAt, estimatedCost } = useMemo(() => {
    const start = new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    return {
      startAt: start,
      endAt: end,
      estimatedCost: (hours * Number(listing.price_per_hour)).toFixed(2),
    };
  }, [hours, listing.price_per_hour]);

  const onConfirm = async () => {
    setSubmitting(true);
    try {
      const booking = await createBooking({
        listingId: listing.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      });
      navigation.replace('ActiveSession', { bookingId: booking.id });
    } catch (e) {
      if (e.response?.status === 409) {
        Alert.alert('Slot just taken', 'That time overlaps with an existing booking. Try a different duration or check back shortly.');
      } else {
        Alert.alert('Could not book', e.response?.data?.error || 'Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.h1}>Confirm booking</Text>
        <Text style={styles.sub}>{listing.title}</Text>

        <Text style={styles.label}>How long do you need it?</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((h) => (
            <Text
              key={h}
              onPress={() => setHours(h)}
              style={[styles.durationPill, hours === h && styles.durationPillActive]}
            >
              {h}h
            </Text>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Starts</Text>
            <Text style={styles.summaryValue}>Now</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{hours} hour{hours > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated cost</Text>
            <Text style={styles.summaryValueBig}>₹{estimatedCost}</Text>
          </View>
        </View>

        <Button title="Confirm & reserve" onPress={onConfirm} loading={submitting} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1, padding: spacing.xl },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginBottom: 24 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 10 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  durationPill: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    color: colors.ink,
    overflow: 'hidden',
  },
  durationPillActive: { backgroundColor: colors.ink, borderColor: colors.ink, color: colors.paper },
  summary: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  summaryValue: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  summaryValueBig: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
});

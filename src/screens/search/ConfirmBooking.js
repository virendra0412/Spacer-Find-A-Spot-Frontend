import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/Button';
import { createBooking } from '../../api/bookings.api';
import { estimateFees } from '../../api/fees.api';
import { colors, fonts, radius, spacing } from '../../theme';

const DURATIONS = [1, 2, 4, 8];

// Round "now" up to the next 5 minutes so a default start time never
// lands in the past by the time the request reaches the server (and so
// re-opening the time picker doesn't show an odd :47 default).
function roundUpToFiveMinutes(date) {
  const ms = 5 * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

export default function ConfirmBooking({ route, navigation }) {
  const { listing } = route.params;
  const [hours, setHours] = useState(2);
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [startAt, setStartAt] = useState(() => roundUpToFiveMinutes(new Date()));
  const [pickerMode, setPickerMode] = useState(null); // null | 'date' | 'time'
  const [submitting, setSubmitting] = useState(false);

  const effectiveStart = scheduleForLater ? startAt : new Date();
  const { endAt, subtotal } = useMemo(() => {
    const end = new Date(effectiveStart.getTime() + hours * 60 * 60 * 1000);
    return {
      endAt: end,
      subtotal: hours * Number(listing.price_per_hour),
    };
  }, [effectiveStart.getTime(), hours, listing.price_per_hour]);

  // Computed server-side (see fees.api.js) so this always matches what
  // the driver is actually charged — never a hardcoded copy of the fee
  // formula that could quietly drift out of sync.
  const { data: feeEstimate } = useQuery({
    queryKey: ['fee-estimate', subtotal],
    queryFn: () => estimateFees(subtotal),
    enabled: subtotal > 0,
  });

  const onPickerChange = (event, selected) => {
    // Android's picker is a one-shot dialog (fires 'dismissed' or a value
    // then closes itself); iOS's is inline and stays open, so only Android
    // needs us to explicitly close it here.
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed' || !selected) return;

    setStartAt((prev) => {
      const next = new Date(prev);
      if (pickerMode === 'date') {
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      return next;
    });
  };

  const onConfirm = async () => {
    if (scheduleForLater && startAt.getTime() < Date.now() - 60 * 1000) {
      Alert.alert('That time has passed', 'Pick a date and time in the future.');
      return;
    }
    setSubmitting(true);
    try {
      const booking = await createBooking({
        listingId: listing.id,
        startAt: effectiveStart.toISOString(),
        endAt: endAt.toISOString(),
      });
      // A booking scheduled for later isn't "active" yet — ActiveSession's
      // live timer only makes sense once the driver has actually arrived
      // and tapped start, so send scheduled bookings to MyBookings instead.
      if (scheduleForLater) {
        navigation.navigate('MyBookings');
      } else {
        navigation.replace('ActiveSession', { bookingId: booking.id });
      }
    } catch (e) {
      if (e.response?.status === 409) {
        Alert.alert('Slot just taken', 'That time overlaps with an existing booking. Try a different time or duration.');
      } else {
        Alert.alert('Could not book', e.response?.data?.error || 'Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = startAt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = startAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>Confirm booking</Text>
        <Text style={styles.sub}>{listing.title}</Text>

        <Text style={styles.label}>When do you need it?</Text>
        <View style={styles.durationRow}>
          <Pill label="Now" active={!scheduleForLater} onPress={() => setScheduleForLater(false)} />
          <Pill label="Schedule" active={scheduleForLater} onPress={() => setScheduleForLater(true)} />
        </View>

        {scheduleForLater && (
          <View style={[styles.durationRow, { marginTop: -10 }]}>
            <Pressable style={styles.dateTimeBox} onPress={() => setPickerMode('date')}>
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>{dateLabel}</Text>
            </Pressable>
            <Pressable style={styles.dateTimeBox} onPress={() => setPickerMode('time')}>
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>{timeLabel}</Text>
            </Pressable>
          </View>
        )}

        {pickerMode && (
          <DateTimePicker
            value={startAt}
            mode={pickerMode}
            minimumDate={new Date()}
            onChange={onPickerChange}
          />
        )}

        <Text style={styles.label}>How long do you need it?</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((h) => (
            <Pill key={h} label={`${h}h`} active={hours === h} onPress={() => setHours(h)} />
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Starts</Text>
            <Text style={styles.summaryValue}>
              {scheduleForLater ? `${dateLabel}, ${timeLabel}` : 'Now'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{hours} hour{hours > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Parking ({hours} hour{hours > 1 ? 's' : ''})</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform fee</Text>
            <Text style={styles.summaryValue}>
              {feeEstimate ? `₹${feeEstimate.platformFee.toFixed(2)}` : '—'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValueBig}>
              {feeEstimate ? `₹${feeEstimate.grossAmount.toFixed(2)}` : `₹${subtotal.toFixed(2)}`}
            </Text>
          </View>
        </View>

        <Button title="Confirm & reserve" onPress={onConfirm} loading={submitting} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ label, active, onPress }) {
  return (
    <Text onPress={onPress} style={[styles.durationPill, active && styles.durationPillActive]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 },
  body: { padding: spacing.xl, paddingBottom: spacing.xl * 2 },
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
  dateTimeBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dateTimeLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  dateTimeValue: { fontFamily: fonts.bodySemibold, fontSize: 14.5, color: colors.ink, marginTop: 2 },
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
  summaryRowTotal: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 2 },
  summaryLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  summaryValue: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  summaryValueBig: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
});

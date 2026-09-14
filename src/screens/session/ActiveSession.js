import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import { getBooking, startBooking, endBooking } from '../../api/bookings.api';
import { colors, fonts, radius, spacing } from '../../theme';

// Live elapsed-time readout since the session started. Ticks locally so we
// don't need to poll the server every second — the 30s poll below just
// keeps status/cost in sync with the backend.
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ActiveSession({ route, navigation }) {
  const { bookingId } = route.params;
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId),
    // Keep status/final cost in sync while the session is live — stop
    // polling once it's finished, there's nothing left to refresh.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'reserved' || status === 'active' ? 30000 : false;
    },
  });

  const elapsed = useElapsed(booking?.status === 'active' ? booking.start_at : null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startBooking(bookingId);
      invalidate();
    } catch (e) {
      Alert.alert('Could not start session', e.response?.data?.error || 'Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    setActionLoading(true);
    try {
      await endBooking(bookingId);
      navigation.replace('BookingReceipt', { bookingId });
    } catch (e) {
      Alert.alert('Could not end session', e.response?.data?.error || 'Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.paper} />
      </SafeAreaView>
    );
  }

  const isActive = booking.status === 'active';
  const isReserved = booking.status === 'reserved';
  const estimatedCost = Number(booking.estimated_cost ?? 0).toFixed(0);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{booking.listing_title}</Text>
        <Text style={styles.status}>
          {isActive ? 'Session in progress' : isReserved ? 'Spot reserved — not started yet' : booking.status}
        </Text>

        <View style={styles.timerWrap}>
          <Text style={styles.timer}>{isActive ? formatDuration(elapsed) : '00:00:00'}</Text>
          <Text style={styles.timerLabel}>{isActive ? 'elapsed' : 'ready when you are'}</Text>
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Estimated cost so far</Text>
          <Text style={styles.costValue}>₹{estimatedCost}</Text>
        </View>

        {isReserved && (
          <Button title="Start session" onPress={handleStart} loading={actionLoading} style={{ marginTop: spacing.xl }} />
        )}
        {isActive && (
          <Button
            title="End session & pay"
            onPress={handleEnd}
            loading={actionLoading}
            style={{ marginTop: spacing.xl }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.asphalt },
  body: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: '#B9BBB7', marginBottom: 4 },
  status: { fontFamily: fonts.display, fontSize: 20, color: colors.paper, marginBottom: spacing.xl },
  timerWrap: {
    alignItems: 'center',
    backgroundColor: colors.asphalt2,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  timer: { fontFamily: fonts.display, fontSize: 40, color: colors.amber, letterSpacing: 1 },
  timerLabel: { fontFamily: fonts.body, fontSize: 12, color: '#B9BBB7', marginTop: 6 },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.asphalt2,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  costLabel: { fontFamily: fonts.body, fontSize: 13, color: '#B9BBB7' },
  costValue: { fontFamily: fonts.display, fontSize: 18, color: colors.paper },
});

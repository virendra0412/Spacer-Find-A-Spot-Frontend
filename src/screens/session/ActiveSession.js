import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import Button from '../../components/Button';
import ReportIssueModal from '../../components/ReportIssueModal';
import { getBooking, startBooking, endBooking, extendBooking } from '../../api/bookings.api';
import { openDirections } from '../../utils/directions';
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
  const [reportOpen, setReportOpen] = useState(false);

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

  const handleExtend = async (hours) => {
    setActionLoading(true);
    try {
      await extendBooking(bookingId, hours);
      invalidate();
    } catch (e) {
      if (e.response?.status === 409) {
        Alert.alert(
          "Can't extend that long",
          'Someone else has this spot reserved right after your current window. Try a shorter extension.'
        );
      } else {
        Alert.alert('Could not extend', e.response?.data?.error || 'Try again.');
      }
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
        <View style={styles.statusRow}>
          <Text style={styles.status}>
            {isActive ? 'Session in progress' : isReserved ? 'Spot reserved — not started yet' : booking.status}
          </Text>
          {isReserved && booking.listing_lat != null && (
            <Pressable
              style={styles.directionsBtn}
              onPress={() =>
                openDirections(booking.listing_lat, booking.listing_lng).catch(() =>
                  Alert.alert('Could not open maps', 'Try again in a moment.')
                )
              }
            >
              <Ionicons name="navigate-outline" size={15} color={colors.paper} />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.timerWrap}>
          <Text style={styles.timer}>{isActive ? formatDuration(elapsed) : '00:00:00'}</Text>
          <Text style={styles.timerLabel}>{isActive ? 'elapsed' : 'ready when you are'}</Text>
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Estimated cost so far</Text>
          <Text style={styles.costValue}>₹{estimatedCost}</Text>
        </View>

        {isActive && (
          <>
            <Text style={styles.extendLabel}>Need more time?</Text>
            <View style={styles.extendRow}>
              {[1, 2, 4].map((h) => (
                <Pressable
                  key={h}
                  style={styles.extendPill}
                  onPress={() => handleExtend(h)}
                  disabled={actionLoading}
                >
                  <Text style={styles.extendPillText}>+{h}h</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {isReserved && (
          <Button title="Start session" onPress={handleStart} loading={actionLoading} style={{ marginTop: spacing.xl }} />
        )}
        {isActive && (
          <Button
            title="End session & pay"
            onPress={handleEnd}
            loading={actionLoading}
            style={{ marginTop: spacing.lg }}
          />
        )}

        {(isReserved || isActive) && (
          <Text style={styles.reportLink} onPress={() => setReportOpen(true)}>
            Report an issue with this spot
          </Text>
        )}
      </View>

      <ReportIssueModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        bookingId={bookingId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.asphalt },
  body: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: '#B9BBB7', marginBottom: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  status: { fontFamily: fonts.display, fontSize: 20, color: colors.paper, flexShrink: 1 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(234,235,232,0.3)',
    borderRadius: radius.xl,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  directionsBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.paper },
  reportLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: '#B9BBB7',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: spacing.lg,
  },
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
  extendLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: '#B9BBB7', marginTop: spacing.lg, marginBottom: 8 },
  extendRow: { flexDirection: 'row', gap: 8 },
  extendPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(234,235,232,0.25)',
    backgroundColor: colors.asphalt2,
  },
  extendPillText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.paper },
});

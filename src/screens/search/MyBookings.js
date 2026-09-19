import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myBookings, cancelBooking } from '../../api/bookings.api';
import { colors, fonts, radius, spacing } from '../../theme';

const STATUS_LABEL = {
  reserved: 'Reserved',
  active: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const STATUS_COLOR = {
  reserved: colors.amber,
  active: colors.green,
  completed: colors.inkSoft,
  cancelled: colors.inkSoft,
};

export default function MyBookings({ navigation }) {
  const queryClient = useQueryClient();
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: myBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      if (result.cancellation_fee > 0) {
        Alert.alert(
          'Booking cancelled',
          `A ₹${result.cancellation_fee} late-cancellation fee applies since this was close to the start time.`
        );
      } else {
        Alert.alert('Booking cancelled', 'No fee — this was within the free cancellation window.');
      }
    },
    onError: (e) => {
      Alert.alert('Could not cancel', e.response?.data?.error || 'Something went wrong.');
    },
  });

  const onCancel = (booking) => {
    Alert.alert(
      'Cancel this booking?',
      'Cancelling close to your start time may incur a fee to compensate the host for holding the slot.',
      [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel booking', style: 'destructive', onPress: () => cancelMutation.mutate(booking.id) },
      ]
    );
  };

  const openBooking = (booking) => {
    if (booking.status === 'reserved' || booking.status === 'active') {
      navigation.navigate('ActiveSession', { bookingId: booking.id });
    } else {
      navigation.navigate('BookingReceipt', { bookingId: booking.id });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.h1}>My bookings</Text>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />}

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading && (
            <Text style={styles.emptyText}>
              No bookings yet — book a spot from the Search tab.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => openBooking(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.listing_title}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.is_host ? 'As host' : 'As driver'} · {new Date(item.start_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.cost}>
                  ₹{Number(item.final_cost ?? item.estimated_cost).toFixed(0)}
                </Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status] || item.status}
                </Text>
              </View>
            </Pressable>
            {item.status === 'reserved' && (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => onCancel(item)}
                disabled={cancelMutation.isPending}
                hitSlop={8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  card: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cancelBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#D9534F',
  },
  cancelBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#D9534F' },
  title: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: spacing.sm },
  cost: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  status: { fontFamily: fonts.bodyMedium, fontSize: 11, marginTop: 2 },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 40,
  },
});

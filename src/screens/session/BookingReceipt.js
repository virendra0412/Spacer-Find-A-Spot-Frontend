import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { getBooking, reviewBooking } from '../../api/bookings.api';
import { getPayment, markPaid } from '../../api/payments.api';
import { colors, fonts, radius, spacing } from '../../theme';

const STAR_OPTIONS = [1, 2, 3, 4, 5];

export default function BookingReceipt({ route, navigation }) {
  const { bookingId } = route.params;
  const [payLoading, setPayLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId),
  });
  const { data: payment, isLoading: paymentLoading, refetch: refetchPayment } = useQuery({
    queryKey: ['payment', bookingId],
    queryFn: () => getPayment(bookingId),
  });

  if (bookingLoading || paymentLoading || !booking || !payment) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    );
  }

  const isPaid = paid || payment.status === 'paid';

  const handleMarkPaid = async () => {
    setPayLoading(true);
    try {
      await markPaid(bookingId);
      setPaid(true);
      refetchPayment();
    } catch (e) {
      Alert.alert('Payment failed', e.response?.data?.error || 'Try again.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleReview = async () => {
    setReviewLoading(true);
    try {
      await reviewBooking(bookingId, { rating, comment: comment.trim() || undefined });
      setReviewSubmitted(true);
    } catch (e) {
      Alert.alert('Could not submit review', e.response?.data?.error || 'Try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.h1}>Session complete</Text>
        <Text style={styles.sub}>{booking.listing_title}</Text>

        <View style={styles.summary}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Parking ({booking.final_cost ? 'actual time' : 'estimate'})</Text>
            <Text style={styles.rowValue}>₹{Number(payment.subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Platform fee</Text>
            <Text style={styles.rowValue}>₹{Number(payment.platform_fee).toFixed(2)}</Text>
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowLabel}>Total</Text>
            <Text style={styles.rowValueBig}>₹{Number(payment.amount).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Payment status</Text>
            <Text style={[styles.rowValue, isPaid && { color: colors.green }]}>
              {isPaid ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>

        {!isPaid ? (
          <Button title="Mark as paid" onPress={handleMarkPaid} loading={payLoading} style={{ marginTop: spacing.lg }} />
        ) : (
          <>
            {!reviewSubmitted ? (
              <View style={{ marginTop: spacing.xl }}>
                <Text style={styles.label}>Rate your experience</Text>
                <View style={styles.starRow}>
                  {STAR_OPTIONS.map((n) => (
                    <Text
                      key={n}
                      onPress={() => setRating(n)}
                      style={[styles.star, n <= rating && styles.starActive]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Input
                  label="Comment (optional)"
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Easy access, exactly as described."
                  multiline
                />
                <Button title="Submit review" onPress={handleReview} loading={reviewLoading} />
              </View>
            ) : (
              <Text style={styles.thanks}>Thanks for the review!</Text>
            )}

            <Button
              title="Done"
              variant="outline"
              onPress={() => navigation.popToTop()}
              style={{ marginTop: spacing.lg, borderColor: colors.border }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1, padding: spacing.xl },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginBottom: 24 },
  summary: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 2 },
  rowLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  rowValue: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  rowValueBig: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 10 },
  starRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  star: { fontSize: 28, color: colors.border },
  starActive: { color: colors.amber },
  thanks: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.green, marginTop: spacing.xl },
});

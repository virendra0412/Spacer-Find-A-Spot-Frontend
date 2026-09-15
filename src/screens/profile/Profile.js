import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/Button';
import Input from '../../components/Input';
import StatBox from '../../components/StatBox';
import { useAuth } from '../../context/AuthContext';
import { usePushRegistration } from '../../hooks/usePushRegistration';
import * as usersApi from '../../api/users.api';
import { colors, fonts, radius, spacing } from '../../theme';

const PUSH_STATUS_LABEL = {
  idle: 'Not enabled yet',
  registering: 'Enabling…',
  registered: 'Enabled on this device',
  denied: 'Permission denied — enable in system settings',
  'not-configured': 'Not available in this build yet',
  error: 'Something went wrong — try again',
};

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const push = usePushRegistration();

  const { data: stats } = useQuery({ queryKey: ['my-stats'], queryFn: usersApi.getMyStats });
  const { data: reviews } = useQuery({ queryKey: ['my-reviews'], queryFn: usersApi.getMyReviews });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const onStartEdit = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setEditing(true);
  };

  const onSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Name too short', 'Enter at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      await usersApi.updateMe({ name: name.trim(), email: email.trim() || null });
      await refreshUser();
      setEditing(false);
    } catch (e) {
      Alert.alert('Could not save', e.response?.data?.error || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null; // RootNavigator only mounts this once `user` is hydrated

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>Profile</Text>

        <View style={styles.statsRow}>
          <StatBox label="Rating" value={Number(user.rating_avg) > 0 ? `★ ${user.rating_avg}` : '—'} />
          <StatBox label="Role" value={user.role === 'both' ? 'Driver & host' : user.role} />
        </View>

        <View style={styles.card}>
          {editing ? (
            <>
              <Input label="Name" value={name} onChangeText={setName} />
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="optional"
              />
              <View style={styles.editButtonRow}>
                <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
                <Button title="Save" onPress={onSave} loading={saving} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <Row label="Name" value={user.name} />
              <Row label="Phone" value={user.phone} />
              <Row label="Email" value={user.email || '—'} />
              <Button title="Edit profile" variant="outline" onPress={onStartEdit} style={{ marginTop: spacing.sm }} />
            </>
          )}
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <Row label="Push notifications" value={PUSH_STATUS_LABEL[push.status]} />
          {push.status !== 'registered' && (
            <Button
              title="Enable push notifications"
              variant="outline"
              onPress={push.register}
              loading={push.status === 'registering'}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>

        <Text style={styles.sectionLabel}>Your activity</Text>
        <View style={styles.card}>
          <Row label="Parking spots used" value={stats ? stats.as_driver.completed_bookings : '—'} />
          <Row
            label="Total spent"
            value={stats ? `₹${Number(stats.as_driver.total_spent).toFixed(0)}` : '—'}
          />
        </View>

        {stats && Number(stats.as_host.listings_count) > 0 && (
          <>
            <Text style={styles.sectionLabel}>As a host</Text>
            <View style={styles.card}>
              <Row label="Listings" value={stats.as_host.listings_count} />
              <Row label="Customers served" value={stats.as_host.unique_customers} />
              <Row label="Bookings completed" value={stats.as_host.completed_bookings} />
              <Row label="Total earned" value={`₹${Number(stats.as_host.total_earned).toFixed(0)}`} />
            </View>
          </>
        )}

        {reviews && reviews.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Reviews about you</Text>
            <View style={styles.card}>
              {reviews.map((r, idx) => (
                <View key={r.id} style={[styles.reviewRow, idx > 0 && styles.reviewRowDivider]}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                    <Text style={styles.reviewMeta}>
                      {r.author_name} · as {r.author_role === 'host' ? 'host' : 'driver'}
                    </Text>
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          </>
        )}

        <Button title="Log out" variant="dark" onPress={onLogout} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { padding: spacing.xl, paddingBottom: spacing.xxl },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  sectionLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12.5,
    color: colors.inkSoft,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  rowValue: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink, flexShrink: 1, marginLeft: spacing.md },
  editButtonRow: { flexDirection: 'row', gap: 10, marginTop: spacing.xs },
  reviewRow: { paddingVertical: 10 },
  reviewRowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewStars: { fontSize: 13, color: colors.amber },
  reviewMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  reviewComment: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 18 },
});

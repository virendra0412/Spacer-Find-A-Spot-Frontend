import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
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
  'expo-go': 'Unavailable in Expo Go — use a development build',
  error: 'Something went wrong — try again',
};

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const push = usePushRegistration();

  const { data: stats } = useQuery({ queryKey: ['my-stats'], queryFn: usersApi.getMyStats });
  const { data: reviews } = useQuery({ queryKey: ['my-reviews'], queryFn: usersApi.getMyReviews });
  const { data: verification, refetch: refetchVerification } = useQuery({
    queryKey: ['my-verification'],
    queryFn: usersApi.getMyVerification,
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [identityDocument, setIdentityDocument] = useState(null);
  const [identitySelfie, setIdentitySelfie] = useState(null);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);

  const pickIdentityImage = async (kind, source) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera or photo access to submit verification.');
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    if (result.canceled || !result.assets?.[0]) return;
    if (kind === 'document') setIdentityDocument(result.assets[0]);
    else setIdentitySelfie(result.assets[0]);
  };

  const chooseIdentityImage = (kind) => {
    Alert.alert(kind === 'document' ? 'Identity document' : 'Verification selfie', 'Choose an image source.', [
      { text: 'Take photo', onPress: () => pickIdentityImage(kind, 'camera') },
      { text: 'Choose from library', onPress: () => pickIdentityImage(kind, 'library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitIdentityVerification = async () => {
    if (!identityDocument || !identitySelfie) {
      Alert.alert('Two images required', 'Add both your identity document and a selfie.');
      return;
    }
    setVerificationSubmitting(true);
    try {
      await usersApi.submitVerification({ document: identityDocument, selfie: identitySelfie });
      setIdentityDocument(null);
      setIdentitySelfie(null);
      await refetchVerification();
      Alert.alert('Submitted', 'Your identity verification is now under review.');
    } catch (e) {
      Alert.alert('Could not submit verification', e.response?.data?.error || 'Try again.');
    } finally {
      setVerificationSubmitting(false);
    }
  };

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

        <Text style={styles.sectionLabel}>Identity verification</Text>
        <View style={styles.card}>
          <Row
            label="Status"
            value={verification?.status === 'approved' ? 'Approved' : verification?.status === 'pending' ? 'Under review' : verification?.status === 'rejected' ? 'Needs resubmission' : 'Not submitted'}
          />
          {verification?.review_note ? <Text style={styles.verificationNote}>{verification.review_note}</Text> : null}
          {verification?.status !== 'approved' && verification?.status !== 'pending' && (
            <>
              <View style={styles.identityRow}>
                <Pressable style={styles.identityPicker} onPress={() => chooseIdentityImage('document')}>
                  {identityDocument ? <Image source={{ uri: identityDocument.uri }} style={styles.identityPreview} /> : <Text style={styles.identityPlaceholder}>ID document</Text>}
                </Pressable>
                <Pressable style={styles.identityPicker} onPress={() => chooseIdentityImage('selfie')}>
                  {identitySelfie ? <Image source={{ uri: identitySelfie.uri }} style={styles.identityPreview} /> : <Text style={styles.identityPlaceholder}>Selfie</Text>}
                </Pressable>
              </View>
              <Button title="Submit for review" onPress={submitIdentityVerification} loading={verificationSubmitting} style={{ marginTop: spacing.sm }} />
            </>
          )}
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <Row
            label="Push notifications"
            value={push.status === 'error' && push.error ? push.error : PUSH_STATUS_LABEL[push.status]}
          />
          {push.status !== 'registered' && push.status !== 'expo-go' && (
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
  verificationNote: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginBottom: spacing.sm },
  identityRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  identityPicker: { flex: 1, height: 90, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  identityPreview: { width: '100%', height: '100%' },
  identityPlaceholder: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkSoft },
});
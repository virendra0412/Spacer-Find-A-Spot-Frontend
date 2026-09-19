import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import StatBox from '../../components/StatBox';
import { getOverview, listAllListings, moderateListing } from '../../api/admin.api';
import { colors, fonts, radius, spacing } from '../../theme';

export default function AdminDashboard({ navigation }) {
  const queryClient = useQueryClient();
  const { data: overview } = useQuery({ queryKey: ['admin-overview'], queryFn: getOverview });
  const { data: listings, isLoading } = useQuery({ queryKey: ['admin-listings'], queryFn: listAllListings });

  const moderate = useMutation({
    mutationFn: ({ id, status }) => moderateListing(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (e) => Alert.alert('Could not update listing', e.response?.data?.error || 'Try again.'),
  });

  const onRemove = (listing) => {
    Alert.alert('Remove this listing?', `"${listing.title}" will be taken down immediately.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => moderate.mutate({ id: listing.id, status: 'removed' }) },
    ]);
  };

  const onRestore = (listing) => {
    moderate.mutate({ id: listing.id, status: 'active' });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.eyebrow}>Internal</Text>
        <Text style={styles.h1}>Admin</Text>
      </View>

      {overview && (
        <View style={styles.overviewGrid}>
          <View style={styles.overviewRow}>
            <StatBox label="Users" value={overview.users.total} />
            <StatBox label="Listings" value={overview.listings.total} />
            <StatBox label="Bookings" value={overview.bookings.total} />
          </View>
          <View style={styles.overviewRow}>
            <StatBox label="Platform revenue" value={`₹${Number(overview.revenue.platform_revenue).toFixed(0)}`} />
            <StatBox label="GMV" value={`₹${Number(overview.revenue.gmv).toFixed(0)}`} />
            <StatBox label="Cancel fees" value={`₹${Number(overview.revenue.cancellation_fees_collected).toFixed(0)}`} />
          </View>
          <Pressable style={styles.disputesBanner} onPress={() => navigation.navigate('AdminDisputes')}>
            <Text style={styles.disputesBannerText}>
              {overview.disputes.open} open dispute{overview.disputes.open === 1 ? '' : 's'}
            </Text>
            <Text style={styles.disputesBannerLink}>Review →</Text>
          </Pressable>
          <Pressable
            style={[styles.disputesBanner, { marginTop: 8 }]}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <Text style={styles.disputesBannerText}>
              {overview.users.total} user{overview.users.total === 1 ? '' : 's'} · {overview.users.admins} admin{overview.users.admins === 1 ? '' : 's'}
            </Text>
            <Text style={styles.disputesBannerLink}>Manage →</Text>
          </Pressable>
          <Pressable
            style={[styles.disputesBanner, { marginTop: 8 }]}
            onPress={() => navigation.navigate('AdminVerifications')}
          >
            <Text style={styles.disputesBannerText}>Identity submissions</Text>
            <Text style={styles.disputesBannerLink}>Review →</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionLabel}>All listings</Text>

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} />}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.host_name} · {item.host_phone} · {item.status}
              </Text>
            </View>
            {item.status === 'removed' ? (
              <Button title="Restore" variant="outline" onPress={() => onRestore(item)} style={styles.actionBtn} />
            ) : (
              <Button title="Remove" variant="dark" onPress={() => onRemove(item)} style={styles.actionBtn} />
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
  eyebrow: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.inkSoft },
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  overviewGrid: { paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: 8 },
  overviewRow: { flexDirection: 'row', gap: 8 },
  disputesBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  disputesBannerText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.paper },
  disputesBannerLink: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.amber },
  sectionLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12.5,
    color: colors.inkSoft,
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  cardSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, marginLeft: spacing.sm },
});

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatBox from '../../components/StatBox';
import Button from '../../components/Button';
import { myListings, updateListing } from '../../api/listings.api';
import { colors, fonts, radius, spacing } from '../../theme';

export default function HostDashboard({ navigation }) {
  const queryClient = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: myListings,
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) => updateListing(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.eyebrow}>Your listings</Text>
        <Text style={styles.h1}>Host dashboard</Text>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>You haven't listed a spot yet.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.address_text || 'No address set'}</Text>

            <View style={styles.statRow}>
              <StatBox label="Completed bookings" value={item.completed_bookings} />
              <StatBox label="Rate" value={`₹${Number(item.price_per_hour).toFixed(0)}/hr`} />
            </View>

            <Pressable
              style={styles.toggleRow}
              onPress={() =>
                toggleStatus.mutate({
                  id: item.id,
                  status: item.status === 'active' ? 'paused' : 'active',
                })
              }
            >
              <View>
                <Text style={styles.toggleTitle}>
                  {item.status === 'active' ? 'Currently listed' : 'Currently paused'}
                </Text>
                <Text style={styles.toggleSub}>Tap to {item.status === 'active' ? 'pause' : 'reactivate'}</Text>
              </View>
              <View style={[styles.pill, item.status === 'active' && styles.pillActive]}>
                <View style={[styles.pillKnob, item.status === 'active' && styles.pillKnobActive]} />
              </View>
            </Pressable>

            <Button
              title="Edit availability"
              variant="secondary"
              onPress={() => navigation.navigate('EditAvailability', { listingId: item.id })}
              style={{ marginTop: spacing.sm, borderColor: colors.border }}
            />
          </View>
        )}
      />

      <View style={styles.fabWrap}>
        <Button title="+ List a new spot" onPress={() => navigation.navigate('CreateListing')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  eyebrow: { fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.inkSoft, marginBottom: 4 },
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  cardSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 2, marginBottom: 12 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 12,
  },
  toggleTitle: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  toggleSub: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  pill: { width: 38, height: 22, borderRadius: 20, backgroundColor: colors.border, justifyContent: 'center' },
  pillActive: { backgroundColor: colors.green },
  pillKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.white, marginLeft: 3 },
  pillKnobActive: { marginLeft: 19 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft },
  fabWrap: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});

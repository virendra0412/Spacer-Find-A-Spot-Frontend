import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Chip from '../../components/Chip';
import SpotCard from '../../components/SpotCard';
import { useLocation } from '../../hooks/useLocation';
import { searchListings } from '../../api/listings.api';
import { colors, fonts, spacing } from '../../theme';

export default function Search({ navigation }) {
  const { coords, loading: locLoading, error: locError } = useLocation();
  const [availableNow, setAvailableNow] = useState(true);

  const { data: listings, isLoading, isError, refetch } = useQuery({
    queryKey: ['search', coords, availableNow],
    queryFn: () =>
      searchListings({
        lat: coords.latitude,
        lng: coords.longitude,
        radiusKm: 5,
        availableNow,
      }),
    enabled: !!coords,
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.loc}>{locError ? 'Default area' : 'Near you'}</Text>
            <Text style={styles.h1}>Find a spot</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('MyBookings')}
            style={styles.bookingsBtn}
            hitSlop={8}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.chipsRow}>
          <Chip label="Available now" active={availableNow} onPress={() => setAvailableNow((v) => !v)} />
          {/* Under ₹20/hr and Covered filters are UI-only placeholders for
              now — the search endpoint doesn't yet accept price/covered
              filters. Wire these once GET /listings/search supports them. */}
          <Chip label="Under ₹20/hr" active={false} onPress={() => {}} />
          <Chip label="Covered" active={false} onPress={() => {}} />
        </View>
      </View>

      {(locLoading || isLoading) && (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />
      )}

      {isError && (
        <Text style={styles.emptyText}>Couldn't load nearby spots. Pull down to retry.</Text>
      )}

      {listings && (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ListHeaderComponent={
            <Text style={styles.listHead}>{listings.length} spots nearby</Text>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No spots found nearby right now.</Text>}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <SpotCard listing={item} onPress={() => navigation.navigate('ListingDetail', { id: item.id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loc: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkSoft, marginBottom: 4 },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 14 },
  chipsRow: { flexDirection: 'row' },
  listHead: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.inkSoft, marginBottom: 10 },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 40,
  },
});

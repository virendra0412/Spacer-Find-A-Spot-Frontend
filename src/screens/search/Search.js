import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import Chip from '../../components/Chip';
import SpotCard from '../../components/SpotCard';
import FiltersModal from '../../components/FiltersModal';
import { useLocation } from '../../hooks/useLocation';
import { searchListings } from '../../api/listings.api';
import { geocodePlace, searchAddressSuggestions } from '../../utils/geocode';
import { colors, fonts, spacing } from '../../theme';

const PAGE_SIZE = 20;
const DEFAULT_FILTERS = { sortBy: 'distance', maxPrice: null, covered: false };

export default function Search({ navigation }) {
  const { coords: deviceCoords, loading: locLoading, error: locError } = useLocation();
  const [searchedCoords, setSearchedCoords] = useState(null);
  const [placeLabel, setPlaceLabel] = useState(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [availableNow, setAvailableNow] = useState(true);
  const [vehicleType, setVehicleType] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCoords = searchedCoords || deviceCoords;
  const activeFiltersCount =
    (filters.maxPrice ? 1 : 0) + (filters.covered ? 1 : 0) + (filters.sortBy !== 'distance' ? 1 : 0);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search', activeCoords, availableNow, vehicleType, filters],
    queryFn: ({ pageParam = 0 }) => searchListings({
      lat: activeCoords.latitude,
      lng: activeCoords.longitude,
      radiusKm: 5,
      availableNow,
      vehicleType,
      maxPrice: filters.maxPrice,
      covered: filters.covered,
      sortBy: filters.sortBy,
      limit: PAGE_SIZE,
      offset: pageParam,
    }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.reduce((sum, page) => sum + page.listings.length, 0) : undefined,
    initialPageParam: 0,
    enabled: !!activeCoords,
  });

  const listings = data?.pages.flatMap((page) => page.listings) ?? [];

  useEffect(() => {
    if (placeQuery.trim().length < 3) {
      setSuggestions([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(placeQuery);
        if (!cancelled) setSuggestions(results);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placeQuery]);

  const toggleVehicleType = (value) => {
    setVehicleType((current) => (current === value ? null : value));
  };

  const selectSuggestion = (suggestion) => {
    setSearchedCoords({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setPlaceLabel(suggestion.label);
    setPlaceQuery(suggestion.label);
    setSuggestions([]);
  };

  const onSubmitPlaceSearch = async () => {
    if (!placeQuery.trim()) return;
    setGeocoding(true);
    try {
      const result = await geocodePlace(placeQuery);
      if (!result) {
        Alert.alert("Couldn't find that place", 'Try a more specific address, locality, or pincode.');
        return;
      }
      setSearchedCoords(result);
      setPlaceLabel(placeQuery.trim());
      setSuggestions([]);
    } catch {
      Alert.alert('Search failed', 'Something went wrong looking up that place.');
    } finally {
      setGeocoding(false);
    }
  };

  const onUseMyLocation = () => {
    setSearchedCoords(null);
    setPlaceLabel(null);
    setPlaceQuery('');
    setSuggestions([]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.loc} numberOfLines={1}>
              {placeLabel ? placeLabel : locError ? 'Default area' : 'Near you'}
            </Text>
            <Text style={styles.h1}>Find a spot</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('MyBookings')} style={styles.bookingsBtn} hitSlop={8}>
            <Ionicons name="receipt-outline" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.inkSoft} />
            <TextInput
              value={placeQuery}
              onChangeText={setPlaceQuery}
              onSubmitEditing={onSubmitPlaceSearch}
              placeholder="Search a place, locality, or pincode"
              placeholderTextColor={colors.inkSoft}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {geocoding && <ActivityIndicator size="small" color={colors.inkSoft} />}
          </View>
          {searchedCoords && (
            <Pressable onPress={onUseMyLocation} style={styles.locBtn} hitSlop={8}>
              <Ionicons name="locate" size={18} color={colors.ink} />
            </Pressable>
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={`${suggestion.latitude}:${suggestion.longitude}:${suggestion.label}`}
                style={styles.suggestion}
                onPress={() => selectSuggestion(suggestion)}
              >
                <Ionicons name="location-outline" size={15} color={colors.inkSoft} />
                <Text style={styles.suggestionText} numberOfLines={1}>{suggestion.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.chipsRow}>
          <Chip label="Available now" active={availableNow} onPress={() => setAvailableNow((value) => !value)} />
          <Chip label="2W" active={vehicleType === '2w'} onPress={() => toggleVehicleType('2w')} />
          <Chip label="4W" active={vehicleType === '4w'} onPress={() => toggleVehicleType('4w')} />
          <Chip label="6W" active={vehicleType === '6w'} onPress={() => toggleVehicleType('6w')} />
        </View>
        <View style={styles.controlsRow}>
          <Pressable style={styles.filtersBtn} onPress={() => setFiltersOpen(true)}>
            <Ionicons name="options-outline" size={15} color={colors.ink} />
            <Text style={styles.filtersBtnText}>
              Filters &amp; sort{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Text>
          </Pressable>
          <View style={styles.viewToggle}>
            <Pressable style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleActive]} onPress={() => setViewMode('list')}>
              <Ionicons name="list-outline" size={15} color={colors.ink} />
              <Text style={styles.viewToggleText}>List</Text>
            </Pressable>
            <Pressable style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleActive]} onPress={() => setViewMode('map')}>
              <Ionicons name="map-outline" size={15} color={colors.ink} />
              <Text style={styles.viewToggleText}>Map</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {(locLoading || isLoading) && <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />}
      {isError && <Text style={styles.emptyText}>Couldn't load nearby spots. Pull down to retry.</Text>}

      {viewMode === 'map' && activeCoords && (
        <MapView
          style={styles.map}
          region={{ latitude: activeCoords.latitude, longitude: activeCoords.longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
          showsUserLocation={!searchedCoords}
        >
          {listings.map((listing) => (
            <Marker
              key={listing.id}
              coordinate={{ latitude: Number(listing.lat), longitude: Number(listing.lng) }}
              title={listing.title}
              description={`₹${Number(listing.price_per_hour).toFixed(0)}/hr`}
              onCalloutPress={() => navigation.navigate('ListingDetail', { id: listing.id })}
            />
          ))}
        </MapView>
      )}

      {viewMode === 'list' && listings.length > 0 && (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ListHeaderComponent={<Text style={styles.listHead}>{listings.length} spots {placeLabel ? `near ${placeLabel}` : 'nearby'}</Text>}
          onRefresh={refetch}
          refreshing={isLoading}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.ink} /> : null}
          renderItem={({ item }) => (
            <SpotCard listing={item} onPress={() => navigation.navigate('ListingDetail', { id: item.id })} />
          )}
        />
      )}
      {!isLoading && listings.length === 0 && !isError && (
        <Text style={styles.emptyText}>No spots found here right now.</Text>
      )}

      <FiltersModal
        visible={filtersOpen}
        value={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFiltersOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookingsBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  loc: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkSoft, marginBottom: 4 },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
  locBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  suggestions: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginTop: -6, marginBottom: 10, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.ink },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filtersBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filtersBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  viewToggle: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 9, overflow: 'hidden' },
  viewToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: colors.white },
  viewToggleActive: { backgroundColor: colors.green },
  viewToggleText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  map: { flex: 1, minHeight: 300 },
  listHead: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.inkSoft, marginBottom: 10 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, textAlign: 'center', marginTop: 40 },
});

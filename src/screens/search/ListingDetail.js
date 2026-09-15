import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { getListing, getListingReviews } from '../../api/listings.api';
import { openDirections } from '../../utils/directions';
import { colors, fonts, radius, spacing } from '../../theme';
import { API_URL } from '../../api/client';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ListingDetail({ route, navigation }) {
  const { id } = route.params;

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
  });
  const { data: reviews } = useQuery({
    queryKey: ['listing-reviews', id],
    queryFn: () => getListingReviews(id),
    enabled: !!listing,
  });

  if (isLoading || !listing) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    );
  }

  const tags = [
    listing.covered ? 'Covered' : null,
    listing.has_cctv ? 'CCTV' : null,
    listing.vehicle_type && listing.vehicle_type !== 'any' ? listing.vehicle_type.toUpperCase() : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          {listing.photos && listing.photos.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {listing.photos.map((p) => (
                <Image key={p.id} source={{ uri: `${API_URL}${p.url}` }} style={styles.photoImage} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photo} />
          )}
          <Text style={styles.availTag}>
            {listing.status === 'active' ? 'Listed & active' : listing.status}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{listing.title}</Text>
              {listing.address_text ? <Text style={styles.sub}>{listing.address_text}</Text> : null}
            </View>
            <Pressable
              style={styles.directionsBtn}
              onPress={() =>
                openDirections(listing.lat, listing.lng).catch(() =>
                  Alert.alert('Could not open maps', 'Try again in a moment.')
                )
              }
            >
              <Ionicons name="navigate-outline" size={16} color={colors.ink} />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </Pressable>
          </View>

          <View style={styles.tagRow}>
            {tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}

          <View style={styles.divider} />

          <View style={styles.hostRow}>
            <View style={styles.avatar} />
            <View>
              <Text style={styles.hostName}>{listing.host_name}</Text>
              <Text style={styles.hostMeta}>
                {listing.host_rating > 0 ? `${listing.host_rating} rating` : 'No ratings yet'}
                {reviews ? ` · ${reviews.length} review${reviews.length === 1 ? '' : 's'}` : ''}
              </Text>
            </View>
          </View>

          {reviews && reviews.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.reviewsHead}>Reviews</Text>
              {reviews.slice(0, 3).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <Text style={styles.reviewMeta}>{r.author_name} · {r.rating}★</Text>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.cta}>
        <View>
          <Text style={styles.price}>
            ₹{Number(listing.price_per_hour).toFixed(0)}
            <Text style={styles.priceUnit}>/hr</Text>
          </Text>
          {listing.price_flat_night ? (
            <Text style={styles.flatNight}>₹{Number(listing.price_flat_night).toFixed(0)} full night</Text>
          ) : null}
        </View>
        <Button
          title="Reserve spot"
          onPress={() => navigation.navigate('ConfirmBooking', { listing })}
          style={{ flex: 1, marginLeft: spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  photo: {
    height: 180,
    backgroundColor: colors.asphalt2,
  },
  photoScroll: {
    height: 220,
  },
  photoImage: {
    width: SCREEN_WIDTH,
    height: 220,
    resizeMode: 'cover',
  },
  availTag: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.green,
    color: colors.ink,
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  body: { padding: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  directionsBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 14 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  description: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20, marginBottom: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border },
  hostName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  hostMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  reviewsHead: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  reviewCard: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  reviewMeta: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  reviewComment: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.paper,
  },
  price: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  priceUnit: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  flatNight: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
});

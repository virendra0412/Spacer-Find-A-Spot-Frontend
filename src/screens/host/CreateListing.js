import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Pressable } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useLocation } from '../../hooks/useLocation';
import { createListing } from '../../api/listings.api';
import { colors, fonts, radius, spacing } from '../../theme';

const VEHICLE_SIZES = ['any', 'hatchback', 'sedan', 'suv'];

export default function CreateListing({ navigation }) {
  const { coords, loading: locLoading } = useLocation();
  const [title, setTitle] = useState('');
  const [addressText, setAddressText] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [priceFlatNight, setPriceFlatNight] = useState('');
  const [vehicleSize, setVehicleSize] = useState('any');
  const [covered, setCovered] = useState(false);
  const [hasCctv, setHasCctv] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (title.trim().length < 3) return Alert.alert('Add a title', 'Give the spot a short name.');
    const price = parseFloat(pricePerHour);
    if (!price || price <= 0) return Alert.alert('Add a price', 'Enter an hourly rate greater than 0.');
    if (!coords) return Alert.alert('Location needed', 'We need your location to place the listing on the map.');

    setSubmitting(true);
    try {
      await createListing({
        title: title.trim(),
        address_text: addressText.trim() || undefined,
        lat: coords.latitude,
        lng: coords.longitude,
        price_per_hour: price,
        price_flat_night: priceFlatNight ? parseFloat(priceFlatNight) : undefined,
        vehicle_size: vehicleSize,
        covered,
        has_cctv: hasCctv,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not create listing', e.response?.data?.error || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>List your spot</Text>
        <Text style={styles.sub}>
          {locLoading
            ? 'Getting your current location…'
            : 'Uses your current location as the pin — walk to the spot before listing it, or edit the address text below.'}
        </Text>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Basement B2, CG Road" />
        <Input label="Address (optional)" value={addressText} onChangeText={setAddressText} placeholder="CG Road, Ahmedabad" />
        <Input
          label="Price per hour (₹)"
          value={pricePerHour}
          onChangeText={setPricePerHour}
          keyboardType="decimal-pad"
          placeholder="15"
        />
        <Input
          label="Flat full-night price (₹, optional)"
          value={priceFlatNight}
          onChangeText={setPriceFlatNight}
          keyboardType="decimal-pad"
          placeholder="80"
        />

        <Text style={styles.label}>Vehicle size</Text>
        <View style={styles.pillRow}>
          {VEHICLE_SIZES.map((v) => (
            <Pressable
              key={v}
              onPress={() => setVehicleSize(v)}
              style={[styles.pill, vehicleSize === v && styles.pillActive]}
            >
              <Text style={[styles.pillText, vehicleSize === v && styles.pillTextActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.checkRow} onPress={() => setCovered((v) => !v)}>
          <View style={[styles.checkbox, covered && styles.checkboxActive]} />
          <Text style={styles.checkLabel}>Covered parking</Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setHasCctv((v) => !v)}>
          <View style={[styles.checkbox, hasCctv && styles.checkboxActive]} />
          <Text style={styles.checkLabel}>Has CCTV</Text>
        </Pressable>

        <Button title="Create listing" onPress={onSubmit} loading={submitting} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { padding: spacing.xl },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginBottom: 20 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink, textTransform: 'capitalize' },
  pillTextActive: { color: colors.paper },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.green, borderColor: colors.green },
  checkLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
});

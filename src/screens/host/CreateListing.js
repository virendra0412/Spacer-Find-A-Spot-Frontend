import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useLocation } from '../../hooks/useLocation';
import { createListing, uploadListingPhoto } from '../../api/listings.api';
import { colors, fonts, radius, spacing } from '../../theme';

const VEHICLE_TYPES = [
  { value: 'any', label: 'Any' },
  { value: '2w', label: '2-Wheeler' },
  { value: '4w', label: '4-Wheeler' },
  { value: '6w', label: '6-Wheeler+' },
];

export default function CreateListing({ navigation }) {
  const { coords, loading: locLoading } = useLocation();
  const [title, setTitle] = useState('');
  const [addressText, setAddressText] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [priceFlatNight, setPriceFlatNight] = useState('');
  const [vehicleType, setVehicleType] = useState('any');
  const [covered, setCovered] = useState(false);
  const [hasCctv, setHasCctv] = useState(false);
  const [photo, setPhoto] = useState(null); // { uri, fileName, mimeType }
  const [submitting, setSubmitting] = useState(false);

  const onPickPhoto = () => {
    // A driver deciding whether to trust a spot can't see the physical
    // space any other way, so this is presented as a required step, not
    // an optional "add photos" afterthought.
    Alert.alert('Add a photo', 'Show what the spot actually looks like.', [
      { text: 'Take photo', onPress: () => launchPicker('camera') },
      { text: 'Choose from library', onPress: () => launchPicker('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const launchPicker = async (source) => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', `Enable ${source === 'camera' ? 'camera' : 'photo library'} access in Settings to add a photo.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    }
  };

  const onSubmit = async () => {
    if (title.trim().length < 3) return Alert.alert('Add a title', 'Give the spot a short name.');
    const price = parseFloat(pricePerHour);
    if (!price || price <= 0) return Alert.alert('Add a price', 'Enter an hourly rate greater than 0.');
    if (!coords) return Alert.alert('Location needed', 'We need your location to place the listing on the map.');
    if (!photo) return Alert.alert('Add a photo', 'A photo of the actual spot helps drivers trust the listing.');

    setSubmitting(true);
    let createdListing = null;
    try {
      createdListing = await createListing({
        title: title.trim(),
        address_text: addressText.trim() || undefined,
        lat: coords.latitude,
        lng: coords.longitude,
        price_per_hour: price,
        price_flat_night: priceFlatNight ? parseFloat(priceFlatNight) : undefined,
        vehicle_type: vehicleType,
        covered,
        has_cctv: hasCctv,
      });
      await uploadListingPhoto(createdListing.id, photo);
      navigation.goBack();
    } catch (e) {
      if (createdListing) {
        // The listing itself was created successfully — only the photo
        // upload failed. Say so specifically rather than a generic
        // error, since "could not create listing" would be misleading
        // and the host might otherwise try to resubmit and get a
        // duplicate listing.
        Alert.alert(
          'Listing created, but the photo failed to upload',
          'You can find it under Host → your listings and it currently has no photo. Editing an existing listing\'s photo isn\'t supported yet — for now, delete and recreate it if you\'d like another attempt.'
        );
        navigation.goBack();
      } else {
        Alert.alert('Could not create listing', e.response?.data?.error || 'Something went wrong.');
      }
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

        <Text style={styles.label}>Photo</Text>
        <Pressable style={styles.photoBox} onPress={onPickPhoto}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          ) : (
            <Text style={styles.photoPlaceholder}>Tap to add a photo of the spot</Text>
          )}
        </Pressable>

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

        <Text style={styles.label}>Vehicle type</Text>
        <View style={styles.pillRow}>
          {VEHICLE_TYPES.map((v) => (
            <Pressable
              key={v.value}
              onPress={() => setVehicleType(v.value)}
              style={[styles.pill, vehicleType === v.value && styles.pillActive]}
            >
              <Text style={[styles.pillText, vehicleType === v.value && styles.pillTextActive]}>{v.label}</Text>
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
  photoBox: {
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  pillTextActive: { color: colors.paper },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.green, borderColor: colors.green },
  checkLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
});

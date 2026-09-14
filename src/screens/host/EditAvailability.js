import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { setAvailability } from '../../api/listings.api';
import { colors, fonts, radius, spacing } from '../../theme';

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

// v1: pick one weekly start/end time, applied to whichever days are
// toggled on. This replaces the whole schedule (matching the backend's
// "delete then re-insert the week" semantics). Per-day custom times are
// a natural v2 once hosts ask for it.
export default function EditAvailability({ route, navigation }) {
  const { listingId } = route.params;
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);

  const toggleDay = (value) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  const onSubmit = async () => {
    if (selectedDays.length === 0) return Alert.alert('Pick at least one day');

    const slots = selectedDays.map((day_of_week) => ({
      day_of_week,
      start_time: startTime,
      end_time: endTime,
      is_available: true,
    }));

    setSubmitting(true);
    try {
      await setAvailability(listingId, slots);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', e.response?.data?.error || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>Edit availability</Text>
        <Text style={styles.sub}>This replaces your entire weekly schedule for this listing.</Text>

        <Text style={styles.label}>Active days</Text>
        <View style={styles.dayRow}>
          {DAYS.map((d) => (
            <Pressable
              key={d.value}
              onPress={() => toggleDay(d.value)}
              style={[styles.dayPill, selectedDays.includes(d.value) && styles.dayPillActive]}
            >
              <Text style={[styles.dayText, selectedDays.includes(d.value) && styles.dayTextActive]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Open from (HH:MM, 24h)</Text>
        <TimeField value={startTime} onChangeText={setStartTime} />

        <Text style={styles.label}>Open until (HH:MM, 24h)</Text>
        <TimeField value={endTime} onChangeText={setEndTime} />

        <Text style={styles.hint}>
          Tip: an overnight window like 18:00 → 08:00 is valid — it means "open from 6pm to 8am the next morning."
        </Text>

        <Button title="Save availability" onPress={onSubmit} loading={submitting} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TimeField({ value, onChangeText }) {
  // Minimal text-based time entry to avoid pulling in a native picker
  // dependency for v1. Swap for @react-native-community/datetimepicker
  // once the core flow is validated.
  const Input = require('../../components/Input').default;
  return <Input value={value} onChangeText={onChangeText} placeholder="18:00" keyboardType="numbers-and-punctuation" />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { padding: spacing.xl },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginBottom: 20 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft, marginBottom: 8, marginTop: 6 },
  dayRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dayPillActive: { backgroundColor: colors.green, borderColor: colors.green },
  dayText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.ink },
  dayTextActive: { color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 4, marginBottom: 8 },
});

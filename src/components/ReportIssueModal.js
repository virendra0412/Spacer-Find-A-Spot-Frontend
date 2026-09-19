import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Button from './Button';
import { raiseDispute, DISPUTE_CATEGORIES } from '../api/disputes.api';
import { colors, fonts, radius, spacing } from '../theme';

// Reusable across any screen tied to a specific booking (ActiveSession,
// BookingReceipt, MyBookings) — takes just a bookingId and handles the
// category picker, description, submit, and confirmation itself.
export default function ReportIssueModal({ visible, onClose, bookingId, onSubmitted }) {
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory(null);
    setDescription('');
  };

  const onSubmit = async () => {
    if (!category) {
      Alert.alert('Pick a category', 'Choose the option that best describes what happened.');
      return;
    }
    setSubmitting(true);
    try {
      await raiseDispute(bookingId, { category, description: description.trim() || undefined });
      reset();
      onClose();
      Alert.alert('Reported', "We've logged this and it'll be reviewed. Thanks for flagging it.");
      onSubmitted?.();
    } catch (e) {
      Alert.alert('Could not submit', e.response?.data?.error || 'Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Report an issue</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <Text style={styles.label}>What happened?</Text>
        <View style={styles.optionList}>
          {DISPUTE_CATEGORIES.map((opt) => (
            <Pressable key={opt.value} style={styles.optionRow} onPress={() => setCategory(opt.value)}>
              <View style={[styles.radio, category === opt.value && styles.radioActive]} />
              <Text style={styles.optionText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Details (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Anything that would help us understand what happened"
          placeholderTextColor={colors.inkSoft}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <Button title="Submit report" onPress={onSubmit} loading={submitting} style={{ marginTop: spacing.sm }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,23,28,0.5)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  h1: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft, marginBottom: 10, marginTop: 4 },
  optionList: { marginBottom: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border },
  radioActive: { borderColor: colors.ink, borderWidth: 5.5 },
  optionText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: spacing.md,
  },
});

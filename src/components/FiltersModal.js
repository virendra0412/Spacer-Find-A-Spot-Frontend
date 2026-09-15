import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, fonts, radius, spacing } from '../theme';

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

// A controlled draft is kept locally so the user can change several
// filters and hit "Apply" once, rather than every tap re-querying the
// backend immediately — cheaper on the API and avoids the list jumping
// around mid-adjustment.
export default function FiltersModal({ visible, onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const onReset = () => setDraft({ sortBy: 'distance', maxPrice: null, covered: false });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Filters &amp; sort</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <Text style={styles.label}>Sort by</Text>
        <View style={styles.optionList}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={styles.optionRow}
              onPress={() => setDraft((d) => ({ ...d, sortBy: opt.value }))}
            >
              <View style={[styles.radio, draft.sortBy === opt.value && styles.radioActive]} />
              <Text style={styles.optionText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Max price per hour (₹)</Text>
        <TextInput
          value={draft.maxPrice != null ? String(draft.maxPrice) : ''}
          onChangeText={(t) => {
            const n = t.replace(/[^0-9]/g, '');
            setDraft((d) => ({ ...d, maxPrice: n ? Number(n) : null }));
          }}
          keyboardType="number-pad"
          placeholder="No limit"
          placeholderTextColor={colors.inkSoft}
          style={styles.priceInput}
        />

        <Pressable style={styles.checkRow} onPress={() => setDraft((d) => ({ ...d, covered: !d.covered }))}>
          <View style={[styles.checkbox, draft.covered && styles.checkboxActive]} />
          <Text style={styles.optionText}>Covered parking only</Text>
        </Pressable>

        <View style={styles.buttonRow}>
          <Button title="Reset" variant="outline" onPress={onReset} style={{ flex: 1 }} />
          <Button title="Apply" onPress={() => onApply(draft)} style={{ flex: 1 }} />
        </View>
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
  optionList: { marginBottom: spacing.md },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border },
  radioActive: { borderColor: colors.ink, borderWidth: 5.5 },
  optionText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  priceInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.lg },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.green, borderColor: colors.green },
  buttonRow: { flexDirection: 'row', gap: 10 },
});

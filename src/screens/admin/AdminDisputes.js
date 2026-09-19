import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import { listDisputes, resolveDispute } from '../../api/admin.api';
import { colors, fonts, radius, spacing } from '../../theme';

const CATEGORY_LABEL = {
  spot_occupied: 'Spot was occupied',
  no_show_host: 'Host never showed',
  no_show_driver: 'Driver never showed',
  payment_issue: 'Payment issue',
  damage: 'Damage',
  other: 'Other',
};

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const { data: disputes, isLoading } = useQuery({ queryKey: ['admin-disputes'], queryFn: listDisputes });
  const [notes, setNotes] = useState({}); // { [disputeId]: text }

  const resolve = useMutation({
    mutationFn: ({ id, status }) => resolveDispute(id, { status, resolution_note: notes[id] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (e) => Alert.alert('Could not update', e.response?.data?.error || 'Try again.'),
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.h1}>Disputes</Text>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} />}

      <FlatList
        data={disputes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        ListEmptyComponent={!isLoading && <Text style={styles.empty}>No disputes reported.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{CATEGORY_LABEL[item.category] || item.category}</Text>
              <Text style={[styles.badge, item.status !== 'open' && styles.badgeClosed]}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>
              {item.listing_title} · reported by {item.raised_by_name} ({item.raised_by_phone})
            </Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

            {item.status === 'open' ? (
              <>
                <TextInput
                  value={notes[item.id] || ''}
                  onChangeText={(t) => setNotes((n) => ({ ...n, [item.id]: t }))}
                  placeholder="Resolution note (optional)"
                  placeholderTextColor={colors.inkSoft}
                  style={styles.noteInput}
                  multiline
                />
                <View style={styles.actionRow}>
                  <Button
                    title="Dismiss"
                    variant="outline"
                    onPress={() => resolve.mutate({ id: item.id, status: 'dismissed' })}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Resolve"
                    onPress={() => resolve.mutate({ id: item.id, status: 'resolved' })}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            ) : (
              item.resolution_note && <Text style={styles.resolutionNote}>Note: {item.resolution_note}</Text>
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
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  empty: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  category: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  badge: {
    fontFamily: fonts.bodySemibold,
    fontSize: 10.5,
    color: colors.ink,
    backgroundColor: colors.amber,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.xl,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  badgeClosed: { backgroundColor: colors.border, color: colors.inkSoft },
  meta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginBottom: 6 },
  description: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginBottom: 10, lineHeight: 18 },
  noteInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    marginBottom: 8,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  resolutionNote: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, fontStyle: 'italic', marginTop: 4 },
});

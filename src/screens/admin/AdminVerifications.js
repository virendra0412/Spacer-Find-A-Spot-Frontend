import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import { listVerifications, reviewVerification } from '../../api/admin.api';
import { colors, fonts, radius, spacing } from '../../theme';

export default function AdminVerifications() {
  const queryClient = useQueryClient();
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => listVerifications({ limit: 100 }),
  });
  const review = useMutation({
    mutationFn: ({ userId, status }) => reviewVerification(userId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-verifications'] }),
    onError: (error) => Alert.alert('Could not update verification', error.response?.data?.error || 'Try again.'),
  });

  return (
    <SafeAreaView style={styles.screen}>
      {isLoading && <ActivityIndicator style={{ marginTop: 24 }} color={colors.ink} />}
      <FlatList
        data={submissions || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No identity submissions yet.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.phone} · {item.status}</Text>
            <View style={styles.images}>
              <Image source={{ uri: item.document_url }} style={styles.image} />
              <Image source={{ uri: item.selfie_url }} style={styles.image} />
            </View>
            {item.review_note ? <Text style={styles.note}>{item.review_note}</Text> : null}
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <Button title="Reject" variant="outline" onPress={() => review.mutate({ userId: item.user_id, status: 'rejected' })} loading={review.isPending} style={{ flex: 1 }} />
                <Button title="Approve" onPress={() => review.mutate({ userId: item.user_id, status: 'approved' })} loading={review.isPending} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  name: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 3 },
  images: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  image: { flex: 1, height: 150, borderRadius: radius.md, backgroundColor: colors.paper },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  empty: { fontFamily: fonts.body, color: colors.inkSoft, textAlign: 'center', marginTop: 40 },
});

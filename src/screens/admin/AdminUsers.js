import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { listUsers, setUserAdmin, listAuditLog } from '../../api/admin.api';
import { colors, fonts, radius, spacing } from '../../theme';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => listUsers() });
  const { data: auditLog } = useQuery({ queryKey: ['admin-audit-log'], queryFn: () => listAuditLog({ limit: 10 }) });

  const toggleAdmin = useMutation({
    mutationFn: ({ id, isAdmin }) => setUserAdmin(id, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (e) => Alert.alert('Could not update admin access', e.response?.data?.error || 'Try again.'),
  });

  const onToggle = (u) => {
    const grant = !u.is_admin;
    Alert.alert(
      grant ? 'Grant admin access?' : 'Remove admin access?',
      grant
        ? `${u.name} will be able to see the admin dashboard, moderate listings, and manage disputes.`
        : `${u.name} will lose admin access immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: grant ? 'Grant' : 'Remove',
          style: grant ? 'default' : 'destructive',
          onPress: () => toggleAdmin.mutate({ id: u.id, isAdmin: grant }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.eyebrow}>Internal</Text>
        <Text style={styles.h1}>Users</Text>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} />}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        ListFooterComponent={
          auditLog && auditLog.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.sectionLabel}>Recent admin actions</Text>
              {auditLog.map((entry) => (
                <View key={entry.id} style={styles.auditRow}>
                  <Text style={styles.auditText}>{entry.detail}</Text>
                  <Text style={styles.auditMeta}>
                    {entry.actor_name} · {new Date(entry.created_at).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isSelf = item.id === me?.id;
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  {item.is_admin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {item.phone} · {item.role}
                  {item.rating_avg > 0 ? ` · ${item.rating_avg}★` : ''}
                </Text>
              </View>
              <Button
                title={item.is_admin ? 'Remove' : 'Make admin'}
                variant={item.is_admin ? 'outline' : 'dark'}
                onPress={() => onToggle(item)}
                disabled={isSelf && item.is_admin}
                style={styles.actionBtn}
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  eyebrow: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.inkSoft },
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  cardSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  adminBadge: {
    backgroundColor: colors.amber,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  adminBadgeText: { fontFamily: fonts.bodySemibold, fontSize: 9.5, color: colors.ink },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, marginLeft: spacing.sm },
  sectionLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12.5,
    color: colors.inkSoft,
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  auditRow: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: 8,
  },
  auditText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  auditMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 3 },
});

import { client } from './client';

export function getOverview() {
  return client.get('/admin/overview').then((r) => r.data);
}

export function listUsers({ limit, offset } = {}) {
  return client.get('/admin/users', { params: { limit, offset } }).then((r) => r.data);
}

export function setUserAdmin(userId, isAdmin) {
  return client.patch(`/admin/users/${userId}/admin`, { is_admin: isAdmin }).then((r) => r.data);
}

export function listAuditLog({ limit, offset } = {}) {
  return client.get('/admin/audit-log', { params: { limit, offset } }).then((r) => r.data);
}

export function listAllListings() {
  return client.get('/admin/listings').then((r) => r.data);
}

export function moderateListing(id, status) {
  return client.patch(`/admin/listings/${id}/status`, { status }).then((r) => r.data);
}

export function listDisputes() {
  return client.get('/admin/disputes').then((r) => r.data);
}

export function resolveDispute(id, { status, resolution_note }) {
  return client.patch(`/admin/disputes/${id}`, { status, resolution_note }).then((r) => r.data);
}

export function listVerifications({ limit, offset } = {}) {
  return client.get('/admin/verifications', { params: { limit, offset } }).then((r) => r.data);
}

export function reviewVerification(userId, { status, review_note }) {
  return client.patch(`/admin/verifications/${userId}`, { status, review_note }).then((r) => r.data);
}

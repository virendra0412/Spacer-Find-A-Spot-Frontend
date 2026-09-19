import { client } from './client';

export function getOverview() {
  return client.get('/admin/overview').then((r) => r.data);
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

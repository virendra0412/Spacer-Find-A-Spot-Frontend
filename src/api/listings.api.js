import { client } from './client';

export function searchListings({ lat, lng, radiusKm = 3, availableNow }) {
  return client
    .get('/listings/search', {
      params: {
        lat,
        lng,
        radius_km: radiusKm,
        ...(availableNow ? { available_now: true } : {}),
      },
    })
    .then((r) => r.data);
}

export function getListing(id) {
  return client.get(`/listings/${id}`).then((r) => r.data);
}

export function getListingReviews(id) {
  return client.get(`/listings/${id}/reviews`).then((r) => r.data);
}

export function myListings() {
  return client.get('/listings/mine').then((r) => r.data);
}

export function createListing(payload) {
  return client.post('/listings', payload).then((r) => r.data);
}

export function updateListing(id, payload) {
  return client.patch(`/listings/${id}`, payload).then((r) => r.data);
}

export function setAvailability(id, slots) {
  return client.post(`/listings/${id}/availability`, { slots }).then((r) => r.data);
}

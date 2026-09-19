import { client } from './client';

export function searchListings({ lat, lng, radiusKm = 3, availableNow, vehicleType, maxPrice, covered, sortBy, limit = 20, offset = 0 }) {
  return client
    .get('/listings/search', {
      params: {
        lat,
        lng,
        radius_km: radiusKm,
        limit,
        offset,
        ...(availableNow ? { available_now: true } : {}),
        ...(vehicleType ? { vehicle_type: vehicleType } : {}),
        ...(maxPrice ? { max_price: maxPrice } : {}),
        ...(covered ? { covered: true } : {}),
        ...(sortBy ? { sort_by: sortBy } : {}),
      },
    })
    .then((r) => r.data); // { listings, limit, offset, has_more }
}

export function getListing(id) {
  return client.get(`/listings/${id}`).then((r) => r.data);
}

export function getListingReviews(id, { limit, offset } = {}) {
  return client
    .get(`/listings/${id}/reviews`, { params: { limit, offset } })
    .then((r) => r.data); // { reviews, total, limit, offset }
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

// Photo upload uses FormData — deliberately NOT setting a Content-Type
// header here. React Native's networking layer sets the correct
// multipart boundary automatically when it sees a FormData body; setting
// 'multipart/form-data' manually omits the boundary param and the
// request silently fails to parse server-side.
export function uploadListingPhoto(listingId, photo) {
  const form = new FormData();
  form.append('photo', {
    uri: photo.uri,
    name: photo.fileName || 'photo.jpg',
    type: photo.mimeType || 'image/jpeg',
  });
  return client.post(`/listings/${listingId}/photos`, form).then((r) => r.data);
}

export function deleteListingPhoto(listingId, photoId) {
  return client.delete(`/listings/${listingId}/photos/${photoId}`).then((r) => r.data);
}

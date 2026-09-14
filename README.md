# Spacer — mobile app

React Native (Expo) frontend for Spacer. See `spacer-frontend-plan.md` in this
repo (or wherever you keep it) for the full screen inventory, API map, and
build-order rationale.

## Run it

```bash
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL to your backend's LAN IP
npm start              # scan the QR code with Expo Go
```

Your phone and the backend need to be reachable from each other — `localhost`
won't work from a physical device. Use your laptop's LAN IP, or deploy the
backend and point `EXPO_PUBLIC_API_URL` at that instead.

## What's here

Every screen from the plan is wired up and navigable end-to-end:

- **Auth**: Onboarding → Signup/Login → auto-login on relaunch (silent token
  refresh via `AuthContext`)
- **Search loop**: Search → Listing detail → Confirm booking (with the 409
  "slot just taken" path handled) → Active session (polls every 30s, live
  elapsed timer) → Booking receipt (mark paid → leave a review)
- **Host loop**: Host dashboard (toggle active/paused) → Create listing →
  Edit availability

## What's still open

- Search is a list view; the plan calls for adding `react-native-maps` once
  you're testing on a real device (Expo Go's stock build doesn't ship Google
  Maps API keys — see plan section 2).
- `AuthContext` can't hydrate the full `user` object on relaunch because
  there's no `GET /auth/me` yet — it only knows "the token is valid." Add
  that endpoint and wire it in `AuthContext.js` (marked with a `TODO`).
- The "Under ₹20/hr" and "Covered" search filters are UI-only placeholders —
  `GET /listings/search` doesn't accept those params yet.
- Cancel-booking UI and push notification settings were explicitly deferred
  per the plan (v1 scope).

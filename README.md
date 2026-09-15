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

Push notifications need this project linked to EAS before they'll work —
`npx eas init` (needs a free Expo account) sets `extra.eas.projectId` in
`app.json`. Until that's done, the "Enable push notifications" button in
Profile will correctly report itself as not-configured rather than crash.

Your phone and the backend need to be reachable from each other — `localhost`
won't work from a physical device. Use your laptop's LAN IP, or deploy the
backend and point `EXPO_PUBLIC_API_URL` at that instead.

## What's here

Every screen from the plan is wired up and navigable end-to-end:

- **Auth**: Onboarding → Signup/Login → auto-login on relaunch (silent token
  refresh via `AuthContext`)
- **Search loop**: Search → Listing detail → Confirm booking (choose "Now"
  or "Schedule" with a real date/time picker, plus the 409 "slot just taken"
  path handled) → Active session (polls every 30s, live elapsed timer) →
  Booking receipt (mark paid → leave a review). A scheduled (non-"Now")
  booking skips Active Session and lands you on My Bookings instead, since
  there's nothing live to show until you've actually arrived.
- **Host loop**: Host dashboard (toggle active/paused) → Create listing →
  Edit availability
- **Profile**: view/edit name & email, see your rating, log out, enable
  push notifications — backed by the new `GET/PATCH /users/me` endpoints.
  `AuthContext` now hydrates the full `user` object on relaunch through
  `GET /users/me` (the old TODO here is resolved).
- **Vehicle differentiation (2W/4W/6W)**: replaced the old hatchback/sedan/
  suv/any classification with 2-wheeler/4-wheeler/6-wheeler+/any — a
  better fit, since what actually determines whether a spot fits a
  vehicle is its footprint, not its body style. Search now has real,
  working 2W/4W/6W filter chips (an `any` listing matches every filter).
  `CreateListing` uses the new categories too.
- **Listing photos**: hosts must attach a photo when creating a listing
  (client-enforced for now — see note below). Photos display as a
  horizontal gallery on `ListingDetail` and as a thumbnail on
  `SpotCard`/search results/host dashboard.

## Photo storage — a deliberate v1 tradeoff

Photos are stored on the backend's local disk (`spacer-backend/uploads/`)
and served via a static route, not S3/R2 as the original plan called for.
That's the honest reason: S3 needs real cloud credentials, and shipping
code tested only against a mocked upload isn't something I wanted to hand
you as "done." The API is shaped so swapping to S3 later only touches
`photos.controller.js` — the DB just stores a URL string either way, and
the frontend already treats it as an opaque path appended to `API_URL`.

- **Filters & sort**: a "Filters & sort" sheet on Search — sort by
  distance/price low-to-high/price high-to-low, a max-price cap, and a
  covered-only toggle, all backed by real `GET /listings/search` params
  (`sort_by`, `max_price`, `covered`) rather than UI-only placeholders.
- **Search by place**: a real search bar on Search using
  `expo-location`'s native geocoding (`geocodeAsync` — no API key
  needed) to re-center results on a typed address, locality, or pincode.
  A "locate me" button resets back to device GPS.
- **Directions**: a "Directions" button on `ListingDetail` and on
  `ActiveSession` (while a booking is reserved but not yet started —
  the moment a driver actually needs it) opens Google Maps via its
  universal URL scheme, working on both platforms through `Linking`
  with no extra permissions or API key.
- **SafeAreaView fix**: every screen was importing `SafeAreaView` from
  plain `react-native` instead of `react-native-safe-area-context` —
  the built-in one is a no-op on Android even though `App.js` already
  wraps everything in `SafeAreaProvider`. Fixed across all 13 screens.
- **Password validation + show/hide**: `PasswordInput` (new component)
  adds an eye-icon toggle, used in both Signup and Login. Signup also
  shows a live checklist against the same rule the backend now enforces
  (8–72 characters, at least one letter and one number).
- **Button contrast fix**: the `secondary` button variant (light text)
  was only ever legible on dark screens like Onboarding, but was also
  being used on light-background cards in `Profile`, `BookingReceipt`,
  and `HostDashboard` — nearly invisible there. Added an `outline`
  variant (dark text) for light surfaces and switched those three
  screens to it.

## What's still open

- Photo upload isn't enforced server-side yet — `CreateListing` requires
  one client-side, but `POST /listings` alone (without a follow-up photo
  upload) still succeeds. If the photo upload step fails after the
  listing is created, the user is told directly rather than shown a
  generic error, but there's no retry-upload-only flow yet — the
  suggested workaround (delete and recreate) is a stopgap.
- Search is a list view; the plan calls for adding `react-native-maps` once
  you're testing on a real device (Expo Go's stock build doesn't ship Google
  Maps API keys — see plan section 2).
- Cancel-booking has an API function (`cancelBooking` in `bookings.api.js`)
  but no button wired to it in `MyBookings.js` yet.
- Push notifications need `npx eas init` before they'll produce a real
  token — see the note above.
- Place search resolves to a single geocoded point — it doesn't
  disambiguate between multiple matches (e.g. a locality name that
  exists in more than one city) or offer autocomplete-as-you-type.

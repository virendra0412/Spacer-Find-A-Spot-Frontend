# Spacer — mobile app

React Native (Expo) frontend for Spacer. See `spacer-frontend-plan.md` in this
repo (or wherever you keep it) for the full screen inventory, API map, and
build-order rationale.

## Run it

```bash
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL to your backend's LAN IP
```

**This app can no longer run in plain Expo Go.** `expo-notifications`
needs to actually work, and SDK 53+ removed push notifications from
Expo Go on Android — that requires native code Expo Go's generic
pre-built binary doesn't have. `expo-dev-client` and `eas.json` are
already set up for this — you need a **custom dev client build**
instead:

```bash
npx eas build --profile development --platform android
```

Install the resulting APK on your device once, then for every day-to-day
run:

```bash
npx expo start --dev-client
```

and open the project from inside that installed dev-client app — not
inside the regular Expo Go app. (You can also build locally instead of
via EAS with `npx expo run:android`, if you have Android Studio/SDK set
up — that skips the EAS build queue but needs the native toolchain
installed.)

### No embedded map, and deliberately so

There's no in-app map view — `react-native-maps` was removed on
purpose. Rendering a live map inside the app requires a Google Maps
SDK key tied to a Google Cloud billing account, even though usage
itself would stay free at this scale; that's a cost/complexity
tradeoff not worth it for what the app actually needs. Instead:
Search stays list-only, and "Directions" (on `ListingDetail` and
`ActiveSession`) opens the real Google Maps app via a plain deep link
— completely free, no API key, no billing account, ever, since it's
just launching another app rather than calling a billable API.

Push notifications need this project linked to EAS before they'll work —
already done here (`extra.eas.projectId` is set in `app.json`).

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

## Photo storage

Photos now upload to **Cloudinary**, not local disk (the earlier version
of this backend stored them on the server's filesystem — that was
always meant to be temporary, since most hosting platforms wipe local
disk on every redeploy). Requires `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` set on the backend —
see its `.env.example`. Without those set, photo/verification upload
endpoints return a clean `503 Cloudinary is not configured` rather than
crashing, but uploads won't work until they're set.

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
  upload) still succeeds.
- Place search resolves to a single geocoded point — it doesn't
  disambiguate between multiple matches (e.g. a locality name that
  exists in more than one city).

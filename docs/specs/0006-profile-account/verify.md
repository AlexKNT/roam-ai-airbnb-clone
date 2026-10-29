# Verify: profile and account · spec 0006 · updated 2026-10-29

_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Sign in, open Profile → the logo, the gear, the Clerk photo, the full name and the `Roam Explorer` badge render, with the place line hidden while the place is empty → AC-1
- [x] Open Profile on an account with one save → Trips reads `0` and Saved reads `1`, the same count `GET /api/saved-stays` returns → AC-2
- [ ] Watch Saved while the list is idle and loading → it reads a dash, and a failed list shows the dash plus a retry that replaces it with a count → AC-3
- [x] Open Personal info → first name, last name, place and the read only email render in that order with the helper line → AC-4
- [x] Clear the first name to spaces and save → `Enter your first name.` shows inline and nothing is written; change the place and save → the screen returns to Profile and the place line shows the new value → AC-4
- [ ] Tap Payment methods and Notifications → each opens the `Notice` dialog; tap Help & support → the mail composer opens or the Notice shows when no mail app exists; tap Trips → the Trips tab opens → AC-5
- [ ] Open Policies from the Free cancellation banner → every Roam policy prints with its title, summary, body and `Roam policy · <topic>` source, in title order → AC-6
- [x] Open Policies with the network blocked → the error state with a retry shows, not a blank screen → AC-6 (error state only)
- [x] Open Settings → Sign out, Delete account and `Version 1.0.0` from `expo-constants` → AC-7
- [x] Tap Sign out, then Stay signed in → the guest stays on Settings; tap Sign out and confirm → the session ends and `/sign-in` opens → AC-8
- [x] Tap Delete account and confirm → the screen returns to `/sign-in`; the Clerk user answers 404 afterwards and the guest's `savedStay` documents are gone from the private dataset → AC-9
- [ ] Force the Clerk delete to fail after a successful purge → the notice with a retry shows, the guest stays signed in, and retrying finishes the deletion → AC-10
- [x] `DELETE /api/account` with no token and with a bogus bearer token → 401 with an empty body, nothing changed → AC-11
- [ ] Attempt the route as guest A against guest B's subject → only A's data is touched, and the sixth attempt inside ten minutes answers 429 → AC-11
- [x] Each screen shows its title with the default back header → AC-12. The header's back control announces `(tabs), back`, because Expo Router names it after the route group
- [ ] In PostHog, inspect `profile_opened`, `personal_info_saved`, `signed_out` and `account_deleted` → each holds a screen name only → AC-13

## Commands

- [x] `npx expo lint` → passes → AC-14
- [x] `npx tsc --noEmit` → passes → AC-14
- [x] `npx jest` → 11 suites, 94 tests pass, including the account route, `removeAll` and the name and place validation → AC-14

## Acceptance-criteria coverage

- AC-1, AC-2, AC-4, AC-7, AC-8, AC-9 covered by the runs recorded above
- AC-3 covered by no step yet
- AC-5 covered by no step yet
- AC-6 covered by the error state only
- AC-10 covered by no step yet
- AC-11 covered by the 401 steps, not by the scoping or limiter steps
- AC-12 covered by the header step
- AC-13 covered by no step yet
- AC-14 covered by the three commands

## Run 2026-10-29

Web dev server at 390x844 with a throwaway Clerk user, deleted at the end of the run. No device on this machine. The browser blocks every Sanity request with CORS, so the Policies list, the Trips rows and the hearts could not be exercised.

Two findings from the run:

- `src/app/account/personal-info.tsx` writes through `user.update({ unsafeMetadata })`, which Clerk now warns is deprecated in favour of `user.updateMetadata({ unsafeMetadata })`.
- The default header back control is announced as `(tabs), back` rather than `Back`.

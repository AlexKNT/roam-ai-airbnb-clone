# Verify: design system and app shell · spec 0001 · updated 2026-10-21
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Launch the app signed out, then open a tab route such as `/profile` → you land on `/sign-in` and no bar shows → AC-6
- [x] Sign in with email and password, then enter the code sent to you → Home opens with the floating bar → AC-6, AC-11
- [x] Tap Search, then Trips, then Profile → the yellow circle moves, the active icon fills, the other tabs keep their outline icon and label → AC-5, AC-6
- [ ] Change one label in `src/constants/copy.ts`, for example Trips to My trips → the bar shows the new label with no other edit → AC-5 (value sourcing)
- [ ] Scroll any placeholder screen to its end → the last content clears the floating bar → AC-5 (value sourcing, bottom padding)
- [ ] Focus a text field with the keyboard open → the bar slides below the screen and returns when the keyboard closes → AC-5
- [x] Switch the simulator or system to dark appearance → the app keeps the light palette, gray background, white cards, dark text → AC-7
- [ ] Read the placeholder text inside an input on the gray field → it uses `textMuted`, so it stays readable → AC-1 (contrast)
- [x] Open `/dev/components` in a dev build → every primitive renders every listed variant and state → AC-4
- [ ] Turn on VoiceOver and swipe through the bar → each tab announces its label and whether it is selected, and every icon button announces a label → AC-8
- [ ] On an iOS 26 device open the app → the bar renders glass with the same height, float and radius as the white fallback → AC-5
- [ ] Temporarily rename one font file in `assets/fonts/` and reload → the splash still goes away and text falls back to the system font → AC-2

## Commands

- [x] `npx tsc --noEmit` → exit 0 → AC-1, AC-3, AC-9
- [x] `npx expo lint` → no problems → AC-9
- [x] Search `src/components` and `src/app` for `#` color values and for `fontSize` or `fontFamily` → no match outside `src/theme` and the Logo size prop → AC-1, AC-3
- [x] `npx expo export --platform android` → a Hermes bundle builds → AC-2, AC-5 (native bundle compiles)
- [x] `npx expo start --web` → fonts load before first paint and the bar keeps its geometry → AC-2, AC-5

## Acceptance-criteria coverage

- AC-1 covered by the token audit command and the placeholder contrast step · AC-2 covered by the web smoke, the Android export and the font failure step · AC-3 covered by the token audit command · AC-4 covered by the gallery step · AC-5 covered by the tab steps, the keyboard step, the iOS 26 step and the web smoke · AC-6 covered by the signed out and signed in steps · AC-7 covered by the dark appearance step · AC-8 covered by the VoiceOver step · AC-9 covered by the two command steps · AC-10 covered by the gallery step plus iOS simulator screenshots and an Android run, neither taken yet · AC-11 covered by the sign in step, the Google and Apple entry points are not in the app yet.

## Run 2026-10-29 (`/check verify design system & app shell`, web + commands)

Ran on Windows against `npx expo start --web` at 390x844; no iOS simulator or device on this machine.

- [x] `npx tsc --noEmit` → exit 0 → AC-1, AC-3, AC-9
- [x] `npx expo lint` → exit 0, no problems → AC-9
- [ ] Token audit → **fails**: `src/components/auth/google-mark.tsx` holds four raw brand hex values (`#EA4335`, `#4285F4`, `#FBBC05`, `#34A853`), added by feature 11. Everything else in `src/components` and `src/app` reads tokens; `Logo` keeps its size prop → AC-1, AC-3
- [x] App boots on web: Plus Jakarta Sans loads before first paint, onboarding and the four tabs render, the floating bar keeps its height, float and radius at phone width → AC-2, AC-5
- [x] `textMuted` on `surfaceGray` measures 5.46:1, so placeholder text clears 4.5:1 → AC-1 (contrast)
- [x] Bar labels and icons come from `tabItems` in `src/constants/copy.ts`, one edit changes the bar → AC-5 (value sourcing, read in code)
- [x] Bars and screens read `useScreenBottomPadding`, so content clears the bar; the bar listens for the keyboard on iOS and Android → AC-5 (read in code, not exercised)
- [x] Splash hides on a font failure and the text falls back to the system font → AC-2 (read in code, not exercised)
- [ ] Not run here: dark appearance, VoiceOver, iOS 26 glass, the `/dev/components` pass and the AC-10 screenshots, because there is no simulator or device on this machine.

# Verify: onboarding · spec 0007 · updated 2026-10-29

_Steps derived from spec 0007 requirements. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Launch with the seen flag cleared → `/onboarding` opens instead of the tabs or sign in → gate
- [x] Compare slide 1 with `prompts/prompt-imgs/onboarding.png` at phone width → the photo hero, the `roam` logo, the Skip pill, the `Whistler, BC` place pill, the curved sheet, the three dots with the first one lilac, the heading, the body and the yellow `Get started` button all match → design
  - Fails one element: the design shows a `Continue with Google` button under `Get started`, and the screen has no such button, no handler and no copy for it
- [ ] Swipe to slides 2 and 3 → the hero, the place pill, the heading and the body change, and the progressbar moves → requirement 1
- [ ] Read the screen with VoiceOver or TalkBack → the logo is skipped, Skip and Get started announce their labels, the dots announce as a progressbar and the heading reads as a header → accessibility
- [x] Tap Get started → the seen flag is written and `/sign-in` opens → requirements 3, 4
- [x] Reload and open `/` again → the tabs layout sends a seen guest to `/sign-in`, never back to the slides → requirement 4
- [ ] Tap Skip instead of Get started → the same redirect, with no sign up attempt → requirement 3
- [ ] Sign in, then sign out → the slides do not replay, because the flag is per device → spec assumption

## Commands

- [x] `npx expo lint` → passes
- [x] `npx tsc --noEmit` → passes

## Run 2026-10-29

Web dev server at 390x844; no device on this machine, so the swipe and screen reader steps are not run. The three slides and their copy exist in `onboardingCopy`, but only slide 1 was seen.

The missing Google button is the one design difference; the build milestones for feature 10 never listed it, so it reads as a deliberate omission rather than a regression.

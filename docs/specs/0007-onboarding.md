# 0007 · Onboarding

**Status**: Assumed
**Date**: 2026-10-29
**Authorized by**: engineer, during /develop

## Owed decision

Two choices behind the first run slides, neither settled by a spec or by `AGENTS.md`:

1. Where the "this device has seen the slides" flag lives, and what clears it.
2. What slides 2 and 3 say and show. `prompts/prompt-imgs/onboarding.png` only
   shows slide 1.

## Assumption built on

- **Flag storage**: `expo-secure-store`, already installed for the Clerk token
  cache, under the key `roam.onboarding.seen`, with `localStorage` on web where
  SecureStore is unavailable. No new dependency. The flag is per device, not per
  guest, so it survives sign out and signing in again never replays the slides.
  Both Skip and Get started write it before routing to `/sign-in`.
- **Gate**: the tabs layout sends a signed out guest to `/onboarding` while the
  flag is unset, and to `/sign-in` once it is set. The onboarding route carries
  its own gate the same way the other signed out routes do: seen means
  `/sign-in`, signed in means `/`.
- **Slides 2 and 3 copy** is written from the scope line "explain the product":
  slide 2 covers describing a trip in one sentence, slide 3 covers asking about
  a stay and getting the host's own words back.
- **Photos** are remote placeholders (`picsum.photos`), the same source the dev
  gallery uses. Real stay photography replaces them later.

## Code area

`src/app/onboarding.tsx`, `src/app/(tabs)/_layout.tsx`, `src/onboarding/`,
`src/constants/copy.ts`, `src/theme/tokens.ts`

## Requirements

- Three first run slides that explain the product, skippable, leading into sign up.
- The slides match `prompts/prompt-imgs/onboarding.png`.
- Skip and Get started reach auth.
- Returning guests never see them again.

## Ratify

This decision was recorded by /develop, not deliberated. Run `/architect onboarding`
to deliberate and ratify it. Until then it stays flagged as an owed decision; it does not block marking the feature `done`.

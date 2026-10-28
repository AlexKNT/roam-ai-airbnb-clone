# 0006. Profile and account

**Date**: 2026-10-28
**Status**: In Progress

## Summary

The Profile tab becomes the guest's own screen: their Clerk photo, name and place, a Saved count that matches Trips, account and preference rows, and the cancellation banner from the design. Name and place are editable in a Personal info screen, the banner opens Roam's own policies word for word, and the gear opens a Settings screen with sign out and a working account delete. No new Sanity document type and no new environment variable are needed.

## Requirements

**User stories**:
- As a signed in guest, I want a screen that shows who I am and what I have saved, so the app feels like mine.
- As a guest, I want to correct my name and place, so my profile is accurate.
- As a guest, I want to read Roam's cancellation policy in full, so I know the rules before I book.
- As a guest, I want to sign out on a device I share, and to delete my account and my data when I leave.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: The Profile tab matches `prompts/prompt-imgs/profile.png`: the logo top left, the gear button top right, an identity card holding the Clerk photo (initials when there is no photo), the full name, the place with its pin icon and the "Roam Explorer" badge, then the stats row, the Account group, the Preferences group and the Free cancellation banner, every value drawn from a design token. The one deviation is the stats row, which holds two columns (see AC-2).
- **AC-2**: The stats row shows Trips `0` and Saved as the saved list count, and no Rating column. Saved reads the same list Trips renders in the same read window, so the two agree, except that a list reporting more than it loaded shows the count followed by `+`.
- **AC-3**: Saved shows a dash while the list is idle or loading. When the list failed, Saved shows a dash and a short retry pressable; a successful retry replaces the dash with the count.
- **AC-4**: Personal info opens a screen showing first name, last name, place and the read only email, in that order. Validation accepts a required first name of 1 to 50 trimmed characters, an optional last name of 1 to 50, and an optional place of one line, up to 60 trimmed characters; a whitespace only value counts as empty. Save stays disabled until something changed, and shows a spinner while it runs. Saving writes the name and place to Clerk, merging the existing unsafe metadata and omitting the place key when it is empty, so an empty place hides the place line on Profile. On success the screen returns to Profile showing the new values. On failure it shows an inline error and keeps what the guest typed.
- **AC-5**: The account and preference rows do what they say: Personal info opens Personal info, Trips opens the Trips tab, Help & support opens the device mail composer addressed to `support@roam.app` and falls back to the Notice when no mail app exists, and Payment methods and Notifications each show the Notice dialog saying they arrive with a later update.
- **AC-6**: The Free cancellation banner opens a Policies screen listing every Roam policy from Sanity in title order, each printed word for word with its title, summary, plain text body and the source line `Roam policy · <topic>`. It renders a loading state, an error state with a retry, and an empty state.
- **AC-7**: The gear opens a Settings screen showing Sign out, Delete account and the app version read from `expo-constants`, falling back to the native application version and then `unknown`.
- **AC-8**: Sign out asks for confirmation in the Notice dialog. Confirming ends the Clerk session and lands on sign in; cancelling leaves the guest signed in where they were.
- **AC-9**: Delete account asks for confirmation in the Notice dialog. Confirming calls `DELETE /api/account`, which verifies the token, purges every saved stay for the token's subject in one delete mutation, then deletes the Clerk user through `createClerkClient({ secretKey }).users.deleteUser(sub)`, where a user that is already gone counts as success. The app then ends the session in a `finally` block and replaces the route with sign in. Afterwards no saved stay remains and the account can no longer sign in.
- **AC-10**: If the purge succeeds and the Clerk delete fails, the screen shows a notice saying the saves are already gone and cannot be restored, with a retry, and the guest stays signed in. Retrying finishes the deletion without error, repeating the purge is safe, and a 401 on the retry (a delete that landed but answered badly) counts as success.
- **AC-11**: `DELETE /api/account` with no valid Clerk token answers 401 with an empty body, like the saved stays route, and changes nothing. The route only ever touches the subject carried by the token, and deleting one guest's account never touches another guest's data. Attempts are limited to 5 in 10 minutes per subject, counted per attempt after the token is verified.
- **AC-12**: Settings, Personal info and Policies need a session. A signed out deep link redirects to sign in, checked after `isLoaded` and before `isSignedIn`. Each screen shows its title with the default back header.
- **AC-13**: PostHog records `profile_opened`, `personal_info_saved`, `signed_out` and `account_deleted` from `src/profile/analytics.ts`, each with a screen name only. No name, place, email, token or typed text is sent, and a PostHog failure never blocks the action.
- **AC-14**: Lint and type check pass, and Jest covers the account route (session check, purge before delete, purge failure), `removeAll`, and the place and name validation helper.

## Decision

**Chosen option**: Option 1: Clerk holds identity and place, one API route owns account deletion, Sanity keeps serving content.

The Profile screen reads everything from Clerk and the existing saved list: name and photo from the Clerk user, place from Clerk unsafe metadata, Saved count from the shared saved list, Trips as a constant `0` until booking exists. Personal info writes back through the Clerk client SDK. The only new server surface is `DELETE /api/account`, which verifies the token, purges the guest's saved stays from the private dataset through a new `removeAll`, then deletes the Clerk user with the secret key. Policies are read by the app from the public published dataset, like stays.

Two existing pieces grow. The saved stay store gains `removeAll(guestId)`, one GROQ delete mutation, because the current `removeMany` needs ids and the read caps at 200. The `Notice` dialog gains an optional confirm label, callback and destructive tone, so single action callers stay valid.

**Implementation skills**: none consulted for this spec (no community skill covers account screens; the project's own conventions in `AGENTS.md` shaped it).

## Rationale

The reasoning, the options weighed and the screen audit live in [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

| Entity | Owner | Key | Fields | Relationships |
|---|---|---|---|---|
| Clerk user | Clerk (external) | `id` | `firstName`, `lastName`, `imageUrl`, `primaryEmailAddress` (read only), `unsafeMetadata.place` | one user has many saves |
| savedStay | private Sanity dataset, unchanged | `_id` = `savedStay.<guestId>.<stayId>` | `guestId`, `stayId`, `savedAt` | `guestId` is the Clerk user id as a plain value; `stayId` is a stay id as a plain value |
| roamPolicy | public Sanity dataset, existing, read only | `_id` | `title`, `summary`, `body`, `topic` | none |
| stay | public Sanity dataset, existing, read only | `_id` | unchanged | referenced by `savedStay.stayId` |

No new document type, so no schema change and no migration. `unsafeMetadata.place` is a string, optional, one line, at most 60 trimmed characters, written by merging the existing metadata object and omitting the key when the place is empty.

**Token mapping** (every value from `src/theme`, used because the design image gives no raw numbers):

| Element | Tokens and components |
|---|---|
| Screen frame | `Screen` with its default `surfaceGray` background and `layout.screenGutter` |
| Header row | `Logo` at the home header size, gear as `IconButton` with `shape="soft"` |
| Identity card | `color.surface` inside a `radius.xl` card with `spacing[5]` padding; avatar at `layout.avatarSize` with `radius.pill`, adding a profile token rather than a literal if the image needs a larger one; name on `AppText variant="heading"`; place on `body` in `color.textSecondary` with an `Icon name="location-outline"` at `iconSize.sm`; badge as `Tag tone="lavender"` with a star icon |
| Stats row | `color.surface` card, `radius.xl`, cells divided by `color.border`; number on `subheading`, label on `caption` in `color.textSecondary`; two cells while Rating is absent |
| Group sections | `color.surfaceGray` container on `surfaceGray` with `radius.xl` and `spacing[4]`, the group label on `button`, rows in a `color.surface` inner card with `radius.lg` |
| Rows | existing `ProfileRow` (`layout.controlHeight`, `spacing[3]` gap, `iconSize.sm` icons) |
| Free cancellation banner | `color.badgeLavender` fill, `radius.xl`, title on `button`, description on `caption` in `color.textSecondary`, document and chevron icons in `color.lavender` |

The avatar size and the inner card radius are estimated from the image and confirmed against a simulator screenshot during the build.

**State transitions**:
`savedStay`: saved → purged (account deletion, repeating the purge is a no op).
Clerk user: active → deleted (account deletion, terminal). A guest whose purge succeeded but whose Clerk delete failed stays active with no saves and can retry.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/account` | DELETE | `Authorization: Bearer <Clerk token>` | `{ deleted: true }` | bearer token verified with `CLERK_SECRET_KEY` | 401 with an empty body when there is no valid token, nothing changed · 429 after 5 attempts in 10 minutes per subject · 500 `account_delete_failed` after the purge, safe to retry |

Clerk client calls used in the app, not endpoints of ours: `user.update({ firstName, lastName, unsafeMetadata })` for Personal info, `signOut()` for sign out, `user.imageUrl` and `user.primaryEmailAddress` for display.

Clerk backend call used only in the route: `createClerkClient({ secretKey }).users.deleteUser(sub)`, where a user that is already gone counts as success.

Public read used by Policies, defined once in `src/sanity/queries.ts` and shared with the policy chat: `*[_type == "roamPolicy"] | order(title asc){_id, title, summary, body, topic}` through the existing Sanity client at the published perspective.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Profile identity card | full name | Clerk user `firstName` + `lastName`, falling back to `username` |
| Profile identity card | photo | Clerk user `imageUrl`; initials from first and last name, else the local part of the email address, else the person icon placeholder |
| Profile identity card | place line, hidden when empty | Clerk user `unsafeMetadata.place` |
| Profile stats row | Trips number | constant `0`, decided in this spec (no booking system) |
| Profile stats row | Saved number | `count` of the existing saved stays context |
| Profile stats row | Saved `+` suffix | `hasMore` from the same context |
| Profile stats row | Saved while idle, loading or failed | literal dash, decided in this spec |
| Profile badge | "Roam Explorer" | copy constant in `src/constants/copy.ts` |
| Personal info | name and place as typed, validated | screen inputs, written to Clerk |
| Personal info | stored place | trimmed string in `unsafeMetadata.place`, key omitted when empty |
| Personal info | email, read only | Clerk `primaryEmailAddress.emailAddress` |
| Settings | app version | `expo-constants` `expoConfig.version`, else the native application version, else `unknown` |
| Help & support | support address | existing `supportEmail` constant |
| Policies | title, summary, body | `roamPolicy` documents in the public dataset |
| Policies | source line | the document's `topic`, rendered as `Roam policy · <topic>` |
| Delete account | which saves to purge | `sub` claim of the verified Clerk token, passed to `removeAll` |
| Delete account | which Clerk user to delete | the same `sub`, passed to the Clerk backend |
| Count states, notices, errors | all copy | `src/constants/copy.ts` |

**Key invariants**:
- Profile only ever shows the signed in guest's own data, because every value comes from the Clerk session and a session scoped list.
- The Saved number on Profile and the rows on Trips read from one list in the same window, so they cannot disagree except where the list reports more than it loaded, which the `+` marks.
- Purge happens before the Clerk delete, and a failed purge aborts before the account is deleted.
- The purge is exhaustive: it deletes every saved stay for the subject, not only the page the read returned.
- The purge repeats safely, so a retry after a partial deletion finishes cleanly.
- No guest typed value (name, place, email) reaches PostHog.
- Every account screen sits behind one gate, checked after `isLoaded`.
- Nothing server side branches on `unsafeMetadata`: it is display data the guest wrote about themselves.

**Security model**:
- Identity and place: read and written by the owning guest only, through the Clerk session. Clerk enforces ownership on its own SDK calls.
- Saved stays: unchanged, reachable only through the saved stays route with a verified token.
- Account deletion: the only destructive action in this feature. It requires a valid token, confirms in the UI first, and uses `CLERK_SECRET_KEY` on the server, which never reaches the app bundle. Token verification checks signature and expiry only, so a deleted guest's token stays technically verifiable until it expires; the Follow-up covers closing that window.
- Policies: public published content, read only.
- Privacy scope: personal data (name, email, place) and guest saves are deleted together on account deletion. No audit log is needed, as no money or access control data is involved.

**Configuration required**: none new. The route reuses `CLERK_SECRET_KEY`, `EXPO_PUBLIC_SANITY_PROJECT_ID`, `SANITY_PRIVATE_DATASET` and `SANITY_API_WRITE_TOKEN`, all already in `.env.local` and `.env.example`.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):
- Happy path: sign in, save two stays, open Profile and read Saved `2` with Trips `0`, open Trips and count two rows, verifies **AC-2**.
- Happy path: edit name and place in Personal info, return to Profile, see both changed, verifies **AC-4**.
- Failure case: purge succeeds, Clerk delete fails, notice with retry appears, retry completes the deletion, verifies **AC-10**.
- Failure case: no network while saving Personal info, inline error keeps the typed values, verifies **AC-4**.
- Auth/permission: `DELETE /api/account` with no token answers 401 and leaves the saves in place, and a signed out deep link to `/account/settings` lands on sign in, verifies **AC-11**, **AC-12**.

## Build plan

Built as a Tracer Bullet, like the rest of the project: one thin thread from the Clerk session through the Profile screen to real saved data first, then each action thickens the thread. No schema work is needed at any step.

1. Thread start: replace the Profile placeholder with the screen shell, reading the Clerk name, photo and place, showing the stats row with the real Saved count and Trips `0`, and rendering the account and preference rows and the banner from tokens. Migrate the existing `screenCopy.profile` placeholder copy out. Satisfies **AC-1**, **AC-2**.
2. Saved count states: dash for an idle or loading list, dash plus a retry pressable on error, matching the Trips rows. Satisfies **AC-3**.
3. Account route group: `src/app/account/_layout.tsx` with the session gate and per screen titles, the `Notice` confirm action, then the Settings screen with the app version and the sign out confirmation. Satisfies **AC-7**, **AC-8**, **AC-12**.
4. Personal info: screen fields in the agreed order, one shared validation helper for the name and place rules, Save disabled until dirty, a spinner while saving, the Clerk merge write, the back path on success and the inline failure. The Profile place line reflects the saved value. Satisfies **AC-4**.
5. Rows wired: Trips navigation, the mail composer with its fallback, notices for Payment methods and Notifications. Satisfies **AC-5**.
6. Policies: the shared query, the screen with loading, error and empty states and its source line, banner navigation. Satisfies **AC-6**.
7. Account deletion: `removeAll` on the saved stay store, `DELETE /api/account` (verify token, purge, delete the Clerk user, a failed purge aborting before the delete, the rate limit), the app call, confirmation, retry that treats 401 as success, sign out in `finally` and the replace to sign in. Satisfies **AC-9**, **AC-10**, **AC-11**.
8. Analytics: the four fixed events in `src/profile/analytics.ts`, wrapped so a failure never blocks. Satisfies **AC-13**.
9. Jest tests for the route, `removeAll` and the validation helper, lint and type check, and a simulator screenshot compared with `profile.png`. Satisfies **AC-14**, and re-checks **AC-1**.

## Consequences

**Positive**:
- The guest gets a real account screen and can leave cleanly, with their saved data removed in the same action.
- No new infrastructure: identity stays in Clerk, content stays in Sanity, one small route owns deletion.
- The place line and the name edit need no migration, and the deletion clears them with the Clerk user.

**Negative / tradeoffs**:
- The design shows three stats and the screen ships two. The Rating column waits for guest reviews, which do not exist.
- Trips reads `0` until booking exists, so the number is honest rather than useful.
- `unsafeMetadata` is writable by the client and appears in the session token. That suits a self written display string, not anything trusted.
- Account deletion depends on two systems succeeding in order. A Clerk failure leaves a guest with their saves gone but their login working until they retry, and the saves cannot be restored, which the retry notice says.
- Payment methods and Notifications stay dead rows with a notice, which the design does not show.
- The confirm dialogs mean extending `Notice` with a second action, so that shared component grows a little for every screen that shows it.

**Neutral**:
- Three new screens sit in a new `src/app/account/` route group, behind one gate, reachable from Profile only.
- The Policies screen prints text the chat already reads from the same documents, so no new copy is written.
- PostHog gains four events, all anonymous.
- A deleted guest's token stays verifiable until it expires, so a save write in that window could recreate one document. Closing it costs a Clerk lookup per save write, so it is deferred (see Follow-up).

## Follow-up

- [ ] Design a booking model before Trips can show a real count and Payment methods can exist.
- [ ] Rate limiting for the deletion route uses the in memory limiter; revisit if the app moves to multiple server instances.
- [ ] A guest rating needs a reviews model; the third stat column waits for it.
- [ ] Close the deleted token window: after an account delete, a still valid token could write a new saved stay. Either check the Clerk user exists on save writes or record a deletion tombstone.

# 0006. Profile and account

## Context

The Profile tab is still a placeholder. The design (`prompts/prompt-imgs/profile.png`) shows an identity card, a three column stats row, two grouped lists of rows and a cancellation banner, plus a gear button with no destination. Meanwhile the app already holds real guest data in two places: Clerk for identity, and a private Sanity dataset for saved stays reached only through an API route.

Three constraints shape the work. First, two of the three stats have no data behind them: Trips counts bookings and Rating counts guest reviews, and neither model exists. Second, several rows point at features that do not exist yet (payment methods need booking, notifications need push), so a screen that pretends otherwise would lie to the guest. Third, account deletion touches two systems that must agree, and leaving a guest with a deleted account but orphaned saves (or the reverse) is a privacy failure, not a cosmetic one.

The screen also needs a place line the design shows, and Clerk has no place field, so where that string lives is a real choice with consequences for deletion.

## Options considered

### Option 1: Clerk owns identity and place, one route owns deletion

Name, photo and place live in the Clerk user (place in `unsafeMetadata`). Personal info writes through the Clerk client SDK. A new `DELETE /api/account` route verifies the token, purges the guest's saved stays from the private dataset, then deletes the Clerk user with the secret key.

**Pros**:
- No new document type, no migration, no new environment variable.
- Deleting the Clerk user takes the name, photo and place with it, so the privacy story stays one line.
- One server surface, and the secret key stays on the server.

**Cons**:
- `unsafeMetadata` is writable from the client and rides in the session token, so it can only hold display data the guest wrote about themselves.
- Editing profile data bypasses our own validation layer, so validation has to live in a shared client side helper.

### Option 2: A guest profile document in the private dataset

A `guestProfile` document per guest in the private dataset, keyed by the Clerk user id, holding place (and room for later settings), read and written through an API route like saved stays.

**Pros**:
- One private store for all guest data, with server side validation and a clear deletion step we control.
- Room to grow (preferences, notification settings) without touching Clerk metadata.

**Cons**:
- A second route, a new document type and more code for one optional display string.
- Deletion now has two documents to purge, and both must succeed, so it doubles the partial failure surface for a line of text.

### Option 3: App orchestrated deletion

The app purges saves through the existing saved stays route, then calls Clerk's client side `user.delete()`.

**Pros**:
- No new route.
- Each step is visible in the app, which makes the failure order easy to reason about while building.

**Cons**:
- The cascade order lives in the UI, so any future caller (a second screen, a script) has to repeat it correctly.
- If the Clerk call fails after the purge, the app must keep a signed in session it no longer trusts to finish the job.

### Option 4: Mark deletion unavailable

Ship the Settings screen with a row that says deletion is not available yet and points to support.

**Pros**:
- Cheapest path, and it satisfies the scope's fallback wording.
- No destructive code goes anywhere near production this early.

**Cons**:
- The app would hold guest data it cannot delete on request, which a store review and a privacy policy both dislike.
- Turns a one route job now into a data request handled by hand later.

## Rationale

The deciding force is that identity and the place line have the same owner already. Clerk holds the name, the photo and the email, and a guest can only change their own values through their session, so putting place beside them costs one `user.update` call instead of a route, a document type and a second purge target. Option 2 is the better shape the day the profile owns settings the guest cannot express in Clerk, and the spec's Follow-up keeps that door open.

Deletion is the one action where the app cannot be trusted to keep systems in order. Option 1 puts the cascade behind the secret key in one place, so the order (purge, then delete) is written once, the purge stays safe to repeat, and a failed second step leaves a state the guest can retry out of rather than a half deleted account. Option 3 spreads that ordering into the UI for no gain, and Option 4 leaves guest data we cannot remove.

The stats row follows the same honesty rule as the rest of the app: values we hold are shown, values we do not hold are left out rather than faked. The saved count is real because the shared saved list already holds it; Trips is a constant zero until booking exists; Rating waits for reviews.

## Evidence

Screen audit at design time:

| Placeholder or missing piece | State before this spec |
|---|---|
| `src/app/(tabs)/profile.tsx` | renders `PlaceholderScreen` and logs one event |
| `screenCopy.profile` | the placeholder title and description to retire |
| `ProfileRow` component | exists in `src/components/ui/profile-row.tsx`, unwired |
| Sign out | absent; no `signOut` call anywhere in `src/` |
| Place field | absent from the Clerk user and from every schema |
| `roamPolicy` documents | exist in the public dataset, read today only by the policy chat route, `body` is a plain text field |
| `SavedStaysContext.count` | already exposed, capped by `SAVED_STAYS_LIMIT` and paired with `hasMore` |
| `SavedStayStore.remove` / `removeMany` | need explicit ids, and `read` caps at 200, so purging a whole guest needs a new mutation |
| `Notice` component | takes one dismiss action, so a confirm dialog needs an optional second action |
| Account screens | no `src/app/account/` route group |

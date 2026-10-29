# Verify: grounded policy chat · spec 0004 · updated 2026-10-26

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Setup: `npx expo start`, sign in as a guest, open `brownstone-garden-flat` (a stay with a strict cancellation policy, house rules and pets allowed). A second stay with no cancellation policy reference is needed for one step.

## UI / manual

- [ ] Open a stay, note the URL `/stay/<slug>`, tap Ask about policies, confirm the chat opens at `/stay/<slug>/chat` with the stay name, a back control and three starters → AC-1, AC-2, AC-16
- [ ] Stay signed out and open `/stay/<slug>/chat` and `/stay/<slug>`, confirm both redirect to sign in → AC-1
- [ ] Tap "Can I cancel my booking?", confirm the guest bubble shows a pending state, then one answer card with the policy body copied from Studio word for word and the line `Source: <policy title>` → AC-3, AC-4
- [ ] Tap "What are the house rules?", confirm one line per stored rule and no added wording → AC-4
- [ ] Ask "What time is check in?", confirm the templated sentence shows the same time as the stay detail screen → AC-4
- [ ] Ask "What identification do I need at check in?", confirm the answer matches the Roam policy document body in Studio → AC-4, AC-17
- [ ] Ask "Are pets allowed, and how much is a night?", confirm two blocks ordered by strength (pets before price) → AC-6
- [ ] Ask "Why is the sky blue?", confirm the no answer state with the support line and no invented text → AC-6
- [ ] Ask a cancellation question, then ask "and what about that refund?", confirm the follow up still answers cancellation → AC-9
- [ ] On a stay whose cancellation policy reference is empty, tap the cancellation starter, confirm the short unavailable line instead of an error → AC-11
- [ ] Turn off the network, ask any question, confirm the turn fails with a Try again control; turn the network back on and retry, confirm the answer lands on the same turn → AC-10
- [ ] Send 21 questions inside a minute, confirm the 21st shows the fixed rate limit copy with no retry control → AC-10, AC-14
- [ ] Paste more than 300 characters, confirm the field stops at 300 → AC-12
- [ ] Ask 25 questions, confirm the input is disabled with the cap message and the earlier turns stay readable → AC-12
- [ ] Leave the chat, reopen it, confirm the thread is still there; sign out and back in, confirm it is empty → AC-12
- [ ] Restart the app, confirm the thread is gone → AC-12
- [ ] In PostHog, inspect `policy_chat_opened` and `policy_question_asked`, confirm they hold topic ids, answer count, status and the degraded flag only, and no question text → AC-13
- [ ] Point `TYPESAFE_AI_BASE_URL` at an unreachable host, ask "Can I cancel my booking?", confirm the answer is still exact, marked degraded, and one `policy_chat_degraded` warning lands → AC-8, AC-13
- [ ] With a screen reader, confirm each answer reads as title, body and source together, and every control has a label with a 44 by 44 target → AC-15

## Commands

- [ ] `npx expo lint` → passes → AC-19
- [ ] `npx tsc --noEmit` → passes → AC-19
- [ ] `npx jest` → 4 suites, 27 tests pass, no network used → AC-18
- [ ] `curl -i -X POST <origin>/api/policy-chat -H 'content-type: application/json' -d '{"staySlug":"brownstone-garden-flat","question":"hi"}'` → 401 with an empty body → AC-5
- [ ] Same call with `Authorization: Bearer garbage` → 401 → AC-5
- [ ] Valid session token and `staySlug: "no-such-stay"` → 404 → AC-5
- [ ] Valid session token and a 301 character question → 422 → AC-14
- [ ] 21 valid questions inside a minute → the 21st returns 429 → AC-14
- [ ] `cd studio && npx sanity schema list` → one deployed schema for the dataset → AC-17

## Acceptance-criteria coverage

- AC-1 covered by the first two UI steps and the stay URL check
- AC-2 covered by the first UI step and a read of `policyChatCopy` (every string lives there)
- AC-3, AC-4 covered by the cancellation, house rules, check in and Roam policy steps
- AC-5 covered by the 401, 404 command steps
- AC-6 covered by the two block step, the no answer step and `selection.test.ts`
- AC-7 covered by the live Jev run recorded in the build report (probabilities and follow up inheritance)
- AC-8 covered by the unreachable TypeSafe step and `fallback.test.ts`
- AC-9 covered by the follow up step
- AC-10 covered by the network failure step and the rate limit step
- AC-11 covered by the empty policy reference step and `answers.test.ts`
- AC-12 covered by the 300 character, 25 turn, reopen and restart steps
- AC-13 covered by the PostHog step
- AC-14 covered by the 422 and 429 command steps
- AC-15 covered by the screen reader step
- AC-16 covered by the starters step and `topics.test.ts`
- AC-17 covered by the Roam policy answer step, the seeded documents and the schema list command
- AC-18 covered by the jest command
- AC-19 covered by the lint and type check commands

## Value sourcing coverage

- stay name in the header: open a second stay and confirm its own name → AC-2
- three starters: compare against `starterQuestionsFor` for that stay, and check a stay without house rules loses that starter → AC-16
- matched topic ids: the two block step shows probabilities decide order → AC-6
- closest suggestion: ask a question the catalog only nearly covers and confirm the named closest topic, or no suggestion when nothing fits → AC-6
- follow up context: the follow up step → AC-9
- policy body: compare with the cancellation policy document in Studio → AC-4
- house rules text: compare with the house rules document, one line per rule → AC-4
- Roam policy body: compare with the Roam policy document in Studio → AC-4, AC-17
- stay fact sentences: compare with the stay fields on the detail screen → AC-4
- source label: every answer shows its own source, and a fact answer shows `This stay` → AC-3
- unavailable flag: the empty policy reference step → AC-11
- 25 turns: the cap step → AC-12
- 300 characters: the length step → AC-12
- store key and lifetime: reopen, sign out, restart steps → AC-12
- rate window per guest: 20 accepted then 429, and a second account starts with a fresh window → AC-14
- degraded flag: the unreachable TypeSafe step → AC-8
- analytics: the PostHog step → AC-13
- support address: the no answer step shows `supportEmail` from `copy.ts` → AC-6
- base URL on a device: set `EXPO_PUBLIC_API_ORIGIN` and ask one question from a phone → AC-5
- Clerk user id: the rate window step, which only works when the session verifies → AC-5, AC-14
- copy: every string on the screen comes from `policyChatCopy` → AC-2

## Run 2026-10-29 (`/check verify grounded policy chat`, authenticated route run)

Run against the dev server on web with a throwaway Clerk user created for this check and deleted at the end. No device on this machine, so the screen steps are not covered.

- [x] `npx expo lint` → exit 0 → AC-19
- [x] `npx tsc --noEmit` → exit 0 → AC-19
- [x] `npx jest src/chat` → 4 suites, 27 tests pass, no network used → AC-18
- [x] `POST /api/policy-chat` with no token, and with a bogus bearer token → 401, empty body → AC-5
- [x] Valid session token, `staySlug: "no-such-stay"` → 404; empty `staySlug` → 422; a 301 character question → 422 → AC-5, AC-14
- [x] "Can I cancel my booking?" → the Strict cancellation body word for word with the `Strict cancellation` source, `degraded: false`, so live Jev answered → AC-3, AC-4, AC-7
- [x] "What are the house rules?" → one line per stored rule, nothing added → AC-4
- [x] "What time is check in?" → the templated fact sentence with source `This stay` → AC-4
- [x] "What identification do I need at check in?" → the Roam policy body word for word → AC-4, AC-17
- [x] "Are pets allowed, and how much is a night?" → two answers, pets before price → AC-6
- [x] "Why is the sky blue?" → `unanswered`, no answer text, no closest topic → AC-6
- [x] A follow up carrying `recentTopicIds: ["cancellation-policy"]` answers cancellation again → AC-9
- [ ] Not run here: the unavailable state (every seeded stay has a cancellation policy, so no stay triggers it), the 300 character and 25 turn caps, the 21 question rate limit, the unreachable TypeSafe degrade, the screen steps, PostHog and the screen reader pass.

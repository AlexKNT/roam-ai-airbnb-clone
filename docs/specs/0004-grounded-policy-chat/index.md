# 0004. Grounded policy chat

**Date**: 2026-10-26
**Status**: In Progress

## Summary

A guest opens a stay and taps Ask about policies. They ask about cancellation, house rules, pets, check in or a fact about the stay, and Roam replies with the stay's own text, word for word, with a line saying where it came from. A model called Jev only decides which handful of topics a question is about, and code turns that answer into exact reads from Sanity. When nothing covers the question, the chat says so, offers the closest topic and points at support.

## Requirements

**User stories**:

- As a guest, I want to ask about this stay's policies in my own words so that I do not have to read every card to find the rule that matters.
- As a guest, I want every answer to show where it came from so that I can trust it and quote it.
- As a guest, I want a clear answer when this stay does not cover something so that I know to ask support instead of guessing.
- As the person building the app, I want one answer path with one catalog of topics so that a new policy is one content addition and one constant edit.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The Ask about policies card on a stay opens the chat screen at `/stay/<slug>/chat`, the stay detail keeps working at its current URL after the route folder change, and both stay the behind the existing signed in gate, so a signed out guest is redirected rather than reaching either screen.
- **AC-2**: The chat screen contains a header with the stay name and a back control, a suggestion block with three starter questions, the message list, and an input bar with a send control. It is built from the existing tokens and components plus three new ones (chat bubble, source line, starter chip), with no new color, spacing or radius value: the guest bubble on `surfaceGray`, the answer card on `surface` with a `border`, and the source line on `textMuted`. Every string comes from one `policyChatCopy` block in `src/constants/copy.ts`, and the support address from `supportEmail` in the same file.
- **AC-3**: Sending a starter question or typed question appends the guest turn, shows a pending state on that turn, then renders the reply as one block per matched topic. Each block prints the exact text from its source and one source line naming where it came from (the policy title for a stay policy, the Roam policy title for a Roam policy, This stay for a stay fact).
- **AC-4**: No answer text is generated. A policy or Roam policy answer prints the stored string unchanged, a house rules answer assembles the stored rule lines and nothing else, and a stay fact answer prints the field value through a fixed template held in `src/chat/answers.ts`.
- **AC-5**: The app sends the Clerk session token as a bearer header, and `POST /api/policy-chat` verifies it with the Clerk backend before any other work, returning 401 with no body content when the header is missing or invalid. It returns 404 when the slug names no published stay, and it never calls Jev or reads stay content for either case.
- **AC-6**: A successful response carries up to two topics in probability order, each with its topic id, display title, exact body, source label and an `unavailable` flag (true when the stay has no text for that topic). A topic is included only when its probability clears `TOPIC_THRESHOLD` of 0.7, with ties broken by probability then catalog order. When no topic clears the threshold the response carries the no answer status plus a suggestion: the highest scoring topic, offered only when the null case probability is below 0.3 and that topic can be answered for this stay, and null otherwise.
- **AC-7**: Jev receives a single request whose state is `{ question, recentTopics }` (the recent topic labels sent by the client), holding one Noul (a true or false probability question) per catalog topic plus one null case Noul asking whether the question touches any of them. Each topic's criteria state that a follow up naming no new subject inherits the recent topic. The topic catalog, the question wording, the criteria and the threshold live in `src/chat/topics.ts`. A topic id that is not in the catalog is discarded before any query runs.
- **AC-8**: When the Jev call fails or exceeds 2500 ms, the route falls back to deterministic keyword matching over topic labels and their known phrasings, answers only when exactly one topic matches clearly, and otherwise returns the no answer status. A fallback answer is marked degraded, and the app reports it once per session as a PostHog warning carrying no question text.
- **AC-9**: The client sends the stay slug, the question, and up to the last three topic labels answered in this thread, with the bearer token. The route keeps no state between requests, and the conversation is never stored server side.
- **AC-10**: When a request fails, that turn shows as failed with a retry control, except a 429 which shows fixed rate limit copy and disables retry for that turn. Earlier turns stay readable, and retry sends the same question with the same context.
- **AC-11**: A topic counts as unavailable when its stay reference is null, its body is empty, or its rules list is empty. The other topics still answer, and an unavailable one replies with a short line for this stay and the `unavailable` flag, instead of an error or an invented answer.
- **AC-12**: The conversation lives in a module level store keyed by Clerk user id and stay slug, so leaving and reopening the stay restores the thread, signing out clears it, and restarting the app clears it. Failed turns count toward the cap. At 25 turns the input is disabled with a cap message that points at support, and the question field stops accepting input past 300 characters.
- **AC-13**: Opening the chat records `policy_chat_opened` once per open, and each question records `policy_question_asked` with the matched topic ids, the answer count, the status and whether it degraded. Neither event carries the question, any word from it, or the stay name.
- **AC-14**: The route keeps a sliding window of the last minute of timestamps per Clerk user id, pruned on access, accepts at most 20 questions in that window and returns 429 beyond it, and returns 422 for a question over 300 characters or an empty one.
- **AC-15**: Every control has an accessible label, every target is at least 44 by 44, the reading order follows the visual order, and an answer's source line is read as part of that answer.
- **AC-16**: The three starter questions are drawn from the catalog for the topics this stay can actually answer, so a stay without a house rules document does not offer a house rules starter. Sending is disabled while a turn is pending, and the field clears on send.
- **AC-17**: The dataset holds three `roamPolicy` documents, for refunds and deposits, identification at check in, and payment and fees, whose topic ids match the catalog. The schema is deployed, the Studio is redeployed, and the topic field offers the catalog ids from a Studio side list that a test asserts equals `src/chat/topics.ts`.
- **AC-18**: `npx jest` runs with jest-expo from a `test` script and a jest config, with tests in `src/chat/__tests__`, covering catalog lookup, threshold selection with the null case and tie break, the keyword fallback requiring a unique match, answer assembly for each source kind including house rules lines and null stay fields, the unavailable case, and the catalog against the Studio list, all without network access.
- **AC-19**: `npx expo lint` and `npx tsc --noEmit` pass, with jest globals recognized by the ESLint config.

## Decision

**Chosen option**: Option 1: Jev topic judgment plus exact GROQ reads

Jev decides which topics a question is about, and code turns that decision into exact reads and exact prints. Nothing generates prose. A failed Jev call degrades to keyword matching rather than to an error, and the degrade is recorded so the failure stays visible.

One refinement on top of the answer given in the interview: the engineer picked a Jev Choice, and the installed TypeSafe skill states plainly that a Choice returns exactly one option and that questions where more than one thing can be true should be asked as one Noul each. Since this feature answers up to two topics, the judgment is asked as one Noul per topic plus a null case Noul, and code combines them, which is the same intent with a shape the model can actually express. The runner up was a Choice limited to picking the single closest topic when nothing clears the threshold.

**Implementation skills**: `typesafe-ai` (`typesafe-ai/skills`, `.agents/skills/typesafe-ai/`)

## Feature design

**Data model sketch**:

| Entity | Kind | Key fields | Rules |
|---|---|---|---|
| `roamPolicy` (new) | Sanity document | `title` string required, `summary` string required, `body` text required, `topic` string required | `topic` must be one of the catalog ids; documents are global and carry no stay reference |
| `stay` (existing) | Sanity document | `pricePerNight`, `guests`, `bedrooms`, `beds`, `baths`, `petsAllowed`, `checkInTime`, `checkOutTime`, `amenities` | 1:1 `cancellationPolicy` and `houseRules` through weak references, either may be null |
| `cancellationPolicy` (existing) | Sanity document | `title`, `summary`, `body` | Referenced by many stays |
| `houseRules` (existing) | Sanity document | `name`, `rules[]` | Referenced by many stays |
| `PolicyTopic` (new) | Code constant, `src/chat/topics.ts` | `id`, `label`, `kind` (`stay-policy`, `house-rules`, `roam-policy`, `stay-fact`), `starterQuestions` (or none), the field or document it reads, the phrasings the fallback matches | Ids are stable and kebab-case; the catalog is the only list of what the chat knows; one topic per subject, so two matched topics never repeat a subject |
| `ChatMessage` (new) | Client state, per stay, session lifetime | `id`, `question`, `answers[]` (`topicId`, `title`, `body`, `source`, `unavailable`), `status` (`pending`, `answered`, `failed`) | Never sent to a server as a record; nothing persisted |

Catalog entries: a stay policy topic for cancellation and one for house rules, a pets topic, one topic per stay fact field (price, guests, bedrooms, beds, baths, amenities, check in, check out), and three Roam policy topics (refunds and deposits, identification at check in, payment and fees). Roam policy topics cover subjects no stay document holds, which is what keeps two answers in one reply from contradicting each other. Stay fact templates live in `src/chat/answers.ts` and format values through `src/utils/format.ts`; a null field prints the fixed line saying the stay does not list it.

The Jev request carries the state `{ question, recentTopics }` and one probability question per topic plus the null case, with the wording and criteria held in the catalog file.

State transitions for one turn: `pending` on send, then `answered` or `failed`; a `failed` turn returns to `pending` on retry and keeps its original question and context. A thread moves to `capped` at 25 turns, which disables the input without removing the thread.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/policy-chat` | POST | `staySlug` string required, `question` string required up to 300 characters, `recentTopicIds` string[] optional up to 3 | `status` (`answered` or `unanswered`), `answers[]` with `topicId`, `title`, `body`, `source`, `unavailable`, `closestTopicId` string or null, `degraded` boolean | Clerk bearer token, verified with `@clerk/backend` and `CLERK_SECRET_KEY`; retried on 401 | 401 no or invalid session, 404 unknown stay, 422 empty or too long, 429 rate limited, 500 unexpected |

Client reads and hooks: `usePolicyChat(slug)` owns the thread, the pending and failed states, the cap, the analytics events, and the call to the route through the `EXPO_PUBLIC_API_ORIGIN` base URL with `useAuth().getToken()`. `useStay(slug)` already supplies the stay name, the header data and the catalog availability for the starters.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Open the chat | stay name in the header | `StayDetail.name` from `useStay(slug)` |
| Open the chat | the three starter questions | catalog `starterQuestions`, filtered to topics this stay can answer |
| Send a question | matched topic ids | Jev Noul probabilities at or above `TOPIC_THRESHOLD` of 0.7, capped at two by probability then catalog order |
| Send a question | closest suggestion when nothing matched | highest Noul probability, offered only when the null case probability is below 0.3 and the topic is answerable for this stay, null otherwise |
| Send a question | follow up context | `recentTopicIds` from the thread, sent as labels in the Jev state `recentTopics` |
| Render an answer | policy body | `cancellationPolicy.body` read by GROQ |
| Render an answer | house rules text | `houseRules.rules` joined with a newline and rendered one line per rule |
| Render an answer | Roam policy body | `roamPolicy.body` read by GROQ on the chosen `topic` |
| Render an answer | stay fact sentences | `src/chat/answers.ts` templates filled from the named stay fields and formatted through `src/utils/format.ts`, with a fixed line for a null field |
| Render an answer | source label | policy `title`, house rules `name`, `roamPolicy.title`, or the literal This stay |
| Render an answer | the unavailable flag | null stay reference, empty body, or empty rules on that topic |
| Show the cap | 25 turns | `MAX_TURNS` in `src/chat/topics.ts` beside the catalog |
| Show the length stop | 300 characters | `MAX_QUESTION_LENGTH` in `src/chat/topics.ts`, checked on the client and the route |
| Keep the thread | store key and lifetime | module level `Map` keyed by Clerk user id and stay slug, cleared on sign out |
| Rate limit | questions per minute for a guest | Clerk `userId` from the verified session in the route, counted in a sliding window in memory |
| Report a degrade | degraded flag | true when the keyword fallback produced the answer |
| Analytics | `policy_chat_opened`, `policy_question_asked` | the thread and the response fields above, never the question text |
| Point at support | support address | `supportEmail` in `src/constants/copy.ts` |
| Call the route | base URL on a device | `EXPO_PUBLIC_API_ORIGIN` |
| Verify the session | the Clerk user id | `@clerk/backend` `verifyToken` with `CLERK_SECRET_KEY` |
| Render any string | copy | `policyChatCopy` in `src/constants/copy.ts` |

**Key invariants**:

- No answer body is produced by a model. Every body is a stored string or a fixed template filled from a named stay field.
- An answer contains only catalog topic ids, at most two, ordered by probability.
- A topic id from outside the catalog never reaches a query or the screen.
- Nothing a guest types is persisted, logged server side, or sent to PostHog.
- A topic counts as unavailable when its stay reference is null, its body is empty, or its rules list is empty, and that topic is never filled in from anywhere else.
- Two answers in one reply never cite the same subject, because the catalog holds one topic per subject.
- A thread belongs to one stay and is never shown under another.

**Security model**:

The route is authenticated by a Clerk bearer token verified on the server with `@clerk/backend`, and every request is attributed to the verified user id for the rate limit. Stay content is public, so the only sensitive value is what the guest types; it travels to the TypeSafe API for the topic judgment and nowhere else, and the fallback keeps a copy in memory only for the duration of the request. No secret crosses into the bundle: `CLERK_SECRET_KEY`, the TypeSafe key and any Sanity token stay on the server, and only `EXPO_PUBLIC_API_ORIGIN` is public. There is no compliance scope for this feature (no payment, no health data, no stored personal data), and the third party processing of guest typed text is recorded as a follow up for the privacy policy.

**Configuration required**:

- `TYPESAFE_AI_API_KEY`: the key the route uses for the Jev call. It already exists in `.env.example`; set it in `.env.local` and in the hosting environment before the chat answers anything.
- `CLERK_SECRET_KEY`: already in `.env.example`, now used by the new route to verify the bearer token.
- `EXPO_PUBLIC_API_ORIGIN`: the base URL of the route on a device, for example the hosted web origin or a development tunnel. Public by nature. Add it to `.env.example` with an empty value.

**Critical test scenarios** (each maps to an acceptance criterion in Requirements):

- Happy path: open the chat from a stay, tap a cancellation starter, read the exact policy body and its source line, verifies **AC-1**, **AC-3**, **AC-4**, **AC-16**
- Happy path: ask a question that touches two topics and read two blocks in probability order, verifies **AC-6**, **AC-7**
- Happy path: ask about a stay fact and see the templated sentence filled from the field, verifies **AC-4**, **AC-6**
- Failure case: stop the route's outbound call so Jev fails, then ask a clearly worded question. The keyword fallback answers, the turn is marked degraded, and one warning event lands without question text, verifies **AC-8**, **AC-13**
- Failure case: ask a question with no topic, see the suggestion and the support line, verifies **AC-6**
- Failure case: open a stay whose cancellation policy reference is empty and ask about cancellation, verifies **AC-11**
- Failure case: ask with no network, see the failed turn and retry successfully once it is back, verifies **AC-10**
- Auth/permission: call the route with no bearer token and with a garbage token and receive 401 in both cases, and open the chat signed out and be redirected, verifies **AC-5**, **AC-1**
- Abuse: send 21 questions in a minute and receive 429 on the last, see the fixed rate limit copy with retry disabled, send a 400 character question and receive 422, verifies **AC-14**, **AC-10**
- Privacy: inspect both PostHog events after a question and confirm they hold topic ids, counts and flags only, verifies **AC-13**

## Build plan

Tracer Bullet: a thin thread through schema, catalog, route and screen first, with two topics and no Jev call at all, so the vertical path works before any model is involved. Matching, content, limits and tests thicken it afterwards.

1. Thread start and spike: prove the two unproven pieces first, server side Clerk verification with `@clerk/backend` and the device reaching the route through `EXPO_PUBLIC_API_ORIGIN`, then draw the `roamPolicy` document type and register it, add `src/chat/topics.ts` with two topics (cancellation policy and check in time) and `src/chat/answers.ts` for the source labels, add the `POST /api/policy-chat` route with the bearer check, body validation and exact GROQ reads, move the stay detail to `src/app/stay/[slug]/index.tsx`, and add the chat screen with a field, a pending turn and an answer block reached from the existing card, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-19**
2. Catalog and starters: every topic (cancellation, house rules, pets, the eight stay facts, the three Roam policies), starter questions per topic, the answer assembly for each kind including null fields, the unavailable flag and line, the no answer status with the closest suggestion and the support line, satisfies **AC-2**, **AC-3**, **AC-6**, **AC-11**, **AC-16**
3. Jev matching: install `ai` and `@ai-sdk/typesafe-ai` pinned, build the state `{ question, recentTopics }` and one Noul per topic plus the null case Noul in a single request, read probabilities with the 0.7 threshold and the tie break, cap at two, discard unknown ids, and add the 2500 ms keyword fallback with its degraded flag, satisfies **AC-6**, **AC-7**, **AC-8**
4. Thread state and failures: the module level per user and stay store with its sign out clear, the 25 turn cap, the failed turn and retry path with the 429 exception, the request carrying the last three topic labels, the client length stop, and the sliding window rate limit with 429 and 422 responses, satisfies **AC-9**, **AC-10**, **AC-12**, **AC-14**
5. Analytics and accessibility: both events with the agreed properties, and a pass over labels, target sizes, reading order and the source line announcement, satisfies **AC-13**, **AC-15**
6. Roam policy content: seed the three Roam policy documents mapped to catalog ids, deploy the schema, redeploy the Studio, and add the Studio side topic list with the test that compares it to the catalog, satisfies **AC-17**
7. jest-expo: add the runner, its config, the `test` script and the ESLint jest environment, then tests for catalog lookup, threshold selection including the null case and tie break, keyword fallback, answer assembly per kind, and the unavailable case, satisfies **AC-18**
8. Design and checks: open the chat in the iOS simulator, compare against the design system and the policy card on `prompts/prompt-imgs/property-details.png`, list and fix every difference, then run lint and the type check, satisfies **AC-2**, **AC-19**

## Consequences

**Positive**:
- Every answer is the stored text, so the product promise that a guest can trust and quote an answer holds without review.
- One route and one catalog file carry the whole feature, and a new topic is a constant edit plus content.
- Matching runs on a typed judgment with a deterministic fallback, so the risky logic is testable without a model.
- The screen reuses the design system, so the visual surface stays one language with the rest of the app.

**Negative / tradeoffs**:
- The chat can only look things up. A question that needs two documents combined into one sentence, or a question about something not in the catalog, gets the no answer state.
- The catalog duplicates knowledge of the schema: adding a topic means touching code even when the content already exists.
- An experimental model API sits on the path of every question, and the fallback is a keyword match that can pick the wrong topic on an unusual phrasing.
- The rate limit lives in process memory, so it resets on redeploy and does not coordinate across instances; it is a speed bump against a looping client, not a hard quota.
- The app gains its first server dependency on `@clerk/backend` and its first public base URL setting, which every later API route will also need.
- Content coverage is now part of correctness: a missing Roam policy document turns a good answer into a no answer.
- Guest typed text leaves the app to a third party, which needs a privacy statement before release.
- jest-expo brings a heavier test toolchain than the pure functions strictly need, which is the price of having one runner the whole app can share.

**Neutral**:
- This is the first API route in the app, so `+api.ts` conventions and the `web.output: server` setting become real rather than theoretical.
- The stay detail route moves into a folder to make room for the chat, and its URL does not change.
- jest-expo arrives with this feature, so later slices inherit a test runner.
- `src/chat/` becomes the home for topic and answer logic, and the search parser stays the home for filter vocabulary.

## Follow-up

- [ ] The base URL for `EXPO_PUBLIC_API_ORIGIN` differs per environment: a tunnel during development, the EAS Hosting origin in production. Confirm the hosted origin before the Beta test.
- [ ] `AGENTS.md` still records a Sanity Context endpoint in Knowledge Base mode as the policy knowledge path. The next `/sync` should replace that line with the Jev judgment plus exact reads, and note the Context endpoint was declined.
- [ ] `typesafe-ai` conventions are installed but not listed in `AGENTS.md`. Add one bullet with its location to the `## Agent skills` section so the build loads it.
- [ ] The privacy policy must disclose that guest typed question text is sent to TypeSafe. Required before a store release.
- [ ] The keyword fallback phrasings are a first guess. Review them against real Beta questions and tune them in `src/chat/topics.ts`.
- [ ] Conversation context for follow ups is limited to topic ids. If real follow ups miss, send the last answer body instead of only its id.
- [ ] The in memory rate limit is enough before launch. Move it to a hosted counter when the app has public traffic.
- [ ] The Sanity Context MCP server was noted and skipped. It becomes worth connecting only if a later slice moves retrieval to Context.
- [ ] No design exists for this screen in `prompts/prompt-imgs/`. If a design arrives later, treat it as a change request against AC-2 and the new components.

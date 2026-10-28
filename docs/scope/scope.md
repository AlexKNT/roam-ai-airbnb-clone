# Scope: Roam

Roam is an Expo mobile app for guests. You describe the stay you want in one sentence and Roam returns ranked stays, then each stay answers booking and policy questions from Roam's own content.

**Build approach:** Tracer Bullet (every feature runs end to end through Sanity and an API route before the next one starts).
**Workflow:** Alpha (after `/develop`, `/check verify`; the grounded chat carries `· Beta`, so it also gets `/test`).

The screen set and behavior follow the reference app at `github.com/jsmastery-pro/airbnb-clone`, adapted to this repo's routes, theme tokens and rules in `AGENTS.md`. Screens match the images in `prompts/prompt-imgs/`, using Plus Jakarta Sans from `prompts/fonts/` and the light palette in `design.png`. Every screen meets a basic accessibility bar (labels on icon buttons, 44pt touch targets, readable contrast, sane screen reader order), and copy is English only, kept in shared constants so translating later stays mechanical.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Project scaffold & tooling | Existing base | existing |
| B | Authentication | Existing base | existing |
| C | Analytics identity | Existing base | existing |
| D | Sanity Studio shell | Existing base | existing |
| 1 | Design system & app shell | Foundation | in-progress |
| 2 | Content model & stay queries | Foundation | in-progress |
| 3 | Demo content seed | Foundation | done |
| 4 | Home feed | Slice 1 · Browse | in-progress |
| 5 | Stay detail | Slice 1 · Browse | in-progress |
| 6 | Natural language search | Slice 2 · Search | in-progress |
| 7 | Grounded policy chat | Slice 3 · Chat | in-progress |
| 8 | Saved stays | Slice 4 · Saving | in-progress |
| 9 | Profile & account | Slice 5 · Account | in-progress |
| 10 | Onboarding | Slice 6 · First run | planned |
| 11 | Auth screens to the design | Slice 6 · First run | planned |

## Existing base

### A. Project scaffold & tooling · existing
Expo SDK 58, TypeScript, expo router routes in `src/app/`, ESLint and type check scripts. code in `./`

### B. Authentication · existing
Clerk email and password sign in and sign up with verification codes, secure token cache, and a session gate on the tab layout. code in `src/app/sign-in.tsx`, `src/app/(tabs)/_layout.tsx`

### C. Analytics identity · existing
PostHog provider with error tracking, Clerk identity attached and reset on sign out, analytics failures never block the app. code in `src/config/posthog.ts`, `src/components/clerk-analytics.tsx`

### D. Sanity Studio shell · existing
Studio app with deploy config and CLI, schema still empty. code in `studio/`

## Foundations

### 1. Design system & app shell
Map the design system image to tokens, build the base components, and replace the template tabs with the four tab shell so every later screen shares one visual language.
**Done when:** tokens cover every color, type, spacing and radius in `design.png`; Plus Jakarta Sans loads on iOS and Android; primary button, input, chip, listing card, policy card, profile row, alert and badge exist; the liquid glass tab bar shows Home, Search, Trips and Profile with the active states from the design.
- [x] Design it (spec): `/architect design system & app shell` · spec [0001](../specs/0001-design-system-app-shell/index.md)
- [ ] Build it: `/develop design system & app shell` · code in `src/theme/`, `src/components/ui/`, `src/app/(tabs)/`
  - [x] Foundations: tokens, Plus Jakarta Sans, light appearance (AC-1, AC-2, AC-7)
  - [x] Shell: text and screen frame, four routes, floating tab bar (AC-3, AC-5, AC-6, AC-8)
  - [x] Component library and sign in migration (AC-4, AC-11)
  - [ ] Gallery match, template cleanup, lint and type check (AC-9, AC-10)
- [ ] Verify it: `/check verify design system & app shell`

### 2. Content model & stay queries
The property, host, policy and house rule documents every screen reads, plus the typed queries home, detail and search use.
**Done when:** a stay carries name, place, price, rating and review count, guests, type, amenities, pets, images, host reference, cancellation policy and house rules; text that should affect ranking lives on the stay document; the app reads stays through parameterized queries with typed results.
- [x] Design it (spec): `/architect content model & stay queries` · spec [0002](../specs/0002-content-model-stay-queries/index.md)
- [x] Build it: `/develop content model & stay queries` · code in `src/sanity/`, `studio/schemaTypes/`
  - [x] Thread start: Sanity client config, four schema types, schema deployed (AC-1, AC-9, AC-10, AC-11)
  - [x] Detail read: result types, `getStayBySlug`, image helper, `useStay` (AC-2, AC-4, AC-5, AC-6, AC-8, AC-12)
  - [x] List read: `getStays`, `useStays`, ordering, tie break and cap (AC-3, AC-6)
  - [x] Edge states and checks: deleted references, label and copy constants, lint and type check (AC-7, AC-13)
- [ ] Verify it: `/check verify content model & stay queries`

### 3. Demo content seed
Seed enough stays and policies that the feed, search and chat have real material to work with.
**Done when:** one local script seeds at least 12 stays across cabin, beach, city and villa with images, amenities and full policies, and the feed and detail screens read them.
- [x] Build it: `/develop demo content seed` · code in `scripts/seed-demo-content.mjs`

## Slice 1 · Browse

### 4. Home feed
The first real screen: greeting, hero, search entry, category chips and stay cards, fed by Sanity.
**Done when:** the feed lists seeded stays, chips filter by stay type through GROQ with a real selected state, each card opens its stay, and loading, empty and error states render. The search entry renders per design and starts working in Slice 2.
- [x] Build it: `/develop home feed` · code in `src/app/(tabs)/index.tsx`, `src/components/home/`

### 5. Stay detail
Open a stay for its gallery, name, place, rating, amenities, policy entry, host and price.
**Done when:** the screen matches the design and prints the stay's own fields word for word; Book this stay shows a short booking is coming soon notice instead of failing silently. Ask about policies is present and wired when the chat lands in Slice 3.
- [x] Build it: `/develop stay detail` · code in `src/app/stay/`, `src/components/stay/`, `src/components/ui/notice.tsx`
  - [x] Gallery, name, rating, place and the four amenities
  - [x] Policy and cancellation cards, host row, notice dialog
  - [x] Summary, stay facts, check in times, house rules and the booking bar
- [ ] Verify it: `/check verify stay detail`

## Slice 2 · Search

### 6. Natural language search
Type one sentence and get ranked stays back, with hard constraints as filters and soft intent as ranking.
**Done when:** a sentence such as "quiet pet friendly cabin with a hot tub under $300 a night" returns matching stays; price, guests, type, amenities and pets filter through GROQ params; quiet, cozy and secluded rank through embeddings; chips, result count, sort and empty state match the design; an unclear request falls back to a clear message rather than wrong results.
- [x] Design it (spec): `/architect natural language search` · spec [0003](../specs/0003-natural-language-search/index.md)
- [x] Build it: `/develop natural language search` · code in `src/search/`, `src/app/(tabs)/search.tsx`, `src/components/search/`, `src/sanity/use-stay-search.ts`
  - [x] Thread start: parser for type and price, search query, field and cards on real results (AC-2, AC-3, AC-5, AC-13, AC-19)
  - [x] Parser vocabulary, chips, count line and sort menu (AC-2, AC-6, AC-7, AC-8, AC-9)
  - [x] Screen chrome, loading, error, empty, focus and filter notice (AC-1, AC-10, AC-11, AC-14, AC-15)
  - [x] Embeddings, degrade path, session state, analytics, accessibility and design match (AC-4, AC-12, AC-16, AC-17, AC-18, AC-19)
- [ ] Verify it: `/check verify natural language search`

## Slice 3 · Chat

### 7. Grounded policy chat · Beta
Ask about cancellation, house rules, pets or check in and read the stay's own answer, word for word, with its source.
**Done when:** answers come only from the stay's data and Roam's policies, every answer shows its source, and a question nothing answers says so and points to support.
- [x] Design it (spec): `/architect grounded policy chat` · spec [0004](../specs/0004-grounded-policy-chat/index.md)
- [x] Build it: `/develop grounded policy chat` · code in `src/chat/`, `src/app/api/policy-chat+api.ts`, `src/app/stay/[slug]/`, `src/components/chat/`, `studio/schemaTypes/roam-policy.ts`
  - [x] Thread start: topic catalog, API route and chat screen on real stay text (AC-1, AC-3, AC-4, AC-5, AC-19)
  - [x] Full catalog, starters, answer assembly, unavailable and no answer states (AC-2, AC-6, AC-11, AC-16)
  - [x] Jev matching and the keyword fallback (AC-6, AC-7, AC-8)
  - [x] Thread state, caps, rate limit, analytics and accessibility (AC-9, AC-10, AC-12, AC-13, AC-14, AC-15)
  - [x] Roam policy content, jest tests, design match and checks (AC-17, AC-18, AC-2, AC-19)
- [ ] Verify it: `/check verify grounded policy chat`
- [ ] Test it: `/test grounded policy chat`

## Slice 4 · Saving

### 8. Saved stays
Save a stay from any card or detail screen and find it again in Trips, private to that guest.
**Done when:** the heart toggles and persists across launches, Trips lists the saved stays with their saved state, the profile Saved count agrees, and private data stays out of the public content dataset.
- [x] Design it (spec): `/architect saved stays` · spec [0005](../specs/0005-saved-stays/index.md)
- [x] Build it: `/develop saved stays` · code in `src/saved/`, `src/app/api/saved-stays+api.ts`, `src/app/(tabs)/trips.tsx`
  - [x] Private dataset, route and shared provider (AC-3, AC-7, AC-10, AC-12, AC-13)
  - [x] Hearts on listing cards and the detail screen (AC-1, AC-2, AC-8, AC-9)
  - [x] Trips list, its states and orphan pruning (AC-4, AC-5, AC-6, AC-11)
  - [x] Analytics, tests and checks (AC-14, AC-15)
- [ ] Verify it: `/check verify saved stays`

## Slice 5 · Account

### 9. Profile & account
The guest's own screen: identity, counts, account rows, preferences and sign out.
**Done when:** the profile shows the Clerk name, avatar and place with real Trips and Saved counts, sign out returns to sign in, and account deletion either works safely or is clearly marked unavailable.
- [x] Design it (spec): `/architect profile & account` · spec [0006](../specs/0006-profile-account/index.md)
- [x] Build it: `/develop profile & account` · code in `src/app/(tabs)/profile.tsx`, `src/app/account/`, `src/profile/`, `src/components/profile/`, `src/app/api/account+api.ts`
  - [x] Profile screen on real data: identity card, two stat columns, Saved states (AC-1, AC-2, AC-3)
  - [x] Account route group and sign out confirmation (AC-7, AC-8, AC-12)
  - [x] Personal info edit and the wired rows (AC-4, AC-5)
  - [x] Policies screen from Sanity with its states (AC-6)
  - [x] Account deletion, analytics and checks (AC-9, AC-10, AC-11, AC-13, AC-14)
- [ ] Verify it: `/check verify profile & account`

## Slice 6 · First run

### 10. Onboarding
Three first run slides that explain the product, skippable, leading into sign up.
**Done when:** the slides match the design, Skip and Get started reach auth, and returning guests never see them again.
- [ ] Build it: `/develop onboarding`

### 11. Auth screens to the design
Restyle the existing Clerk screens to the design without changing the working flow.
**Done when:** sign up and sign in match `auth.png` with name, email, password, Google and Apple, and the current Clerk sign in, sign up and verification still work.
- [ ] Build it: `/develop auth screens to the design`

## Deferred
Out of scope for this pass, kept so the plan stays honest.
- **Booking & payment**: choose dates, validate availability, price on the server, pay with Stripe · needs a decision
- **Host side**: companies, roles, permissions and property ownership · needs a decision
- **Payment methods and notifications settings**: profile rows that depend on booking and push · needs a decision
- **Guest reviews and ratings**: the third profile stat needs a reviews model · needs a decision · from spec 0006
- **Production release**: EAS builds, keys, store requirements, privacy and terms pages · needs a decision · GA
- **Design system catalog screen**: internal route showing every token and component · Prototype

## Legend

**The decision box.** Every feature carries exactly one, the subtask whose label ends with `(spec)`. Its wording varies, so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` with 2 to 5 milestones; the tier's closing boxes |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` and milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is | boxes you ran ticked, skipped ones marked skipped |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (dropped from scope, kept for history).
- **Approach tag** beside a heading overrides the project default for that feature; no tag inherits it.
- **Workflow tier tag** beside a heading sets that one feature's rigor above or below the project default. Alpha = `/check verify` after `/develop`; Beta = adds `/test`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.

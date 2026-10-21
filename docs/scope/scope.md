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
| 2 | Content model & stay queries | Foundation | planned |
| 3 | Demo content seed | Foundation | planned |
| 4 | Home feed | Slice 1 · Browse | planned |
| 5 | Stay detail | Slice 1 · Browse | planned |
| 6 | Natural language search | Slice 2 · Search | planned |
| 7 | Grounded policy chat | Slice 3 · Chat | planned |
| 8 | Saved stays | Slice 4 · Saving | planned |
| 9 | Profile & account | Slice 5 · Account | planned |
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

### 2. Content model & stay queries · needs a decision
The property, host, policy and house rule documents every screen reads, plus the typed queries home, detail and search use.
**Done when:** a stay carries name, place, price, rating and review count, guests, type, amenities, pets, images, host reference, cancellation policy and house rules; text that should affect ranking lives on the stay document; the app reads stays through parameterized queries with typed results.
- [ ] Design it (spec): `/architect content model & stay queries`

### 3. Demo content seed
Seed enough stays and policies that the feed, search and chat have real material to work with.
**Done when:** one local script seeds at least 12 stays across cabin, beach, city and villa with images, amenities and full policies, and the feed and detail screens read them.
- [ ] Build it: `/develop demo content seed`

## Slice 1 · Browse

### 4. Home feed
The first real screen: greeting, hero, search entry, category chips and stay cards, fed by Sanity.
**Done when:** the feed lists seeded stays, chips filter by stay type through GROQ with a real selected state, each card opens its stay, and loading, empty and error states render. The search entry renders per design and starts working in Slice 2.
- [ ] Build it: `/develop home feed`

### 5. Stay detail
Open a stay for its gallery, name, place, rating, amenities, policy entry, host and price.
**Done when:** the screen matches the design and prints the stay's own fields word for word; Book this stay shows a short booking is coming soon notice instead of failing silently. Ask about policies is present and wired when the chat lands in Slice 3.
- [ ] Build it: `/develop stay detail`

## Slice 2 · Search

### 6. Natural language search · needs a decision
Type one sentence and get ranked stays back, with hard constraints as filters and soft intent as ranking.
**Done when:** a sentence such as "quiet pet friendly cabin with a hot tub under $300 a night" returns matching stays; price, guests, type, amenities and pets filter through GROQ params; quiet, cozy and secluded rank through embeddings; chips, result count, sort and empty state match the design; an unclear request falls back to a clear message rather than wrong results.
- [ ] Design it (spec): `/architect natural language search`

## Slice 3 · Chat

### 7. Grounded policy chat · needs a decision · Beta
Ask about cancellation, house rules, pets or check in and read the stay's own answer, word for word, with its source.
**Done when:** answers come only from the stay's data and Roam's policies, every answer shows its source, and a question nothing answers says so and points to support.
- [ ] Design it (spec): `/architect grounded policy chat`

## Slice 4 · Saving

### 8. Saved stays · needs a decision
Save a stay from any card or detail screen and find it again in Trips, private to that guest.
**Done when:** the heart toggles and persists across launches, Trips lists the saved stays with their saved state, the profile Saved count agrees, and private data stays out of the public content dataset.
- [ ] Design it (spec): `/architect saved stays`

## Slice 5 · Account

### 9. Profile & account · needs a decision
The guest's own screen: identity, counts, account rows, preferences and sign out.
**Done when:** the profile shows the Clerk name, avatar and place with real Trips and Saved counts, sign out returns to sign in, and account deletion either works safely or is clearly marked unavailable.
- [ ] Design it (spec): `/architect profile & account`

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

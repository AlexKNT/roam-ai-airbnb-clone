# 0003. Natural language stay search

**Date**: 2026-10-23
**Status**: In Progress

## Summary

A guest types one sentence on the Search tab and gets stays back. A small TypeScript parser turns the concrete parts of the sentence (price, guests, type, amenities, pets, place) into filters that Sanity runs as a query, and the leftover mood words (quiet, cozy, secluded) only change the order through Sanity's dataset embeddings. Nothing removes a stay for a soft word, so a wrong read never hides a valid stay. The screen follows the search design and reuses the components from Home.

## Requirements

**User stories**:

- As a guest, I want to describe the stay I want in a sentence so that I do not have to fill in filters.
- As a guest, I want to see which parts of my sentence were understood so that I can correct a wrong reading.
- As a guest, I want results I can reorder by price or rating so that I can compare them my way.
- As the person building screens, I want one search read path with loading, error, empty and unclear states so that no screen invents its own behavior.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The Search tab matches `prompts/prompt-imgs/search.png`: a back arrow returning to Home, a search field with a search icon, a placeholder and a filter icon, one horizontally scrolling row of chips, a count line with the sort control at its right, and stay cards below. It is built from the existing tokens and components, with no new size or color value.
- **AC-2**: Submitting "quiet pet friendly cabin with a hot tub under $300 a night" returns only cabins priced at $300 or less per night, with pets allowed and the hot tub amenity, ordered by how well each stay's summary matches the quiet part.
- **AC-3**: Every constraint value reaches GROQ as a parameter. The query string is a constant and no part of what the guest typed is concatenated into it.
- **AC-4**: With Best match selected and soft text present, order comes from `text::semanticSimilarity($softText)` inside `score()` followed by `order(_score desc, rating desc, lower(name) asc)`. Mood words never exclude a stay, and the 50 result cap slices after the order, never before it.
- **AC-5**: A sentence with constraints but no mood words is ordered by rating descending then name, the same order the feed uses.
- **AC-6**: The sort control offers Best match, Price low to high, Price high to low and Top rated. Choosing one reruns the search and the chosen label stays visible. Best match alone uses the scored order; the other three sort in the query's `order()` and skip scoring entirely.
- **AC-7**: The chips show exactly the constraints the parser applied, in a fixed order (price, guests, type, amenities, pets, place), one chip per amenity. Tapping a chip removes that constraint from the filter state and reruns immediately. The chip disappears and the typed sentence is left as the guest wrote it, until the next submit re-parses it.
- **AC-8**: The count line reads "n stays", or "50+ stays" when the query returns the 50 result cap. It is hidden while loading, on error, and when nothing matches.
- **AC-9**: When the sentence is not empty and the parser reads no filter from it, such as "something nice for the weekend", all stays show in best match order with one line above the count line saying nothing in the sentence was understood. The line clears on the next submit, and a mood only sentence such as "somewhere quiet" keeps the line while still ranking by its mood text.
- **AC-10**: When the parsed constraints match no stay, the empty state renders with a Clear filters button that resets the sentence, chips and sort, reruns, and shows all stays.
- **AC-11**: Loading shows a spinner and one line. A failed query shows the Alert plus a Try again button that reruns it, matching Home's states.
- **AC-12**: The sentence, the applied chips and the results survive a switch to another tab and back for as long as the app runs, and reset when the app restarts.
- **AC-13**: A search runs on mount, on the keyboard search key, and on any chip or sort change only. Typing on its own never queries, and submitting the same sentence again issues a fresh request.
- **AC-14**: Home's prompt bar and the hero search icon open the Search tab with the field focused, through a focus param on the route.
- **AC-15**: The filter icon opens the Notice dialog with coming soon copy and never navigates.
- **AC-16**: When the scored query fails, the app retries the plain query once. If that succeeds the results show in rating order with no error, and if it fails too the error state shows. A degrade is reported once per session as a PostHog warning event that carries no sentence text.
- **AC-17**: The `search_submitted` PostHog event carries the sort chosen, the number of filters applied, and the kinds of constraint applied. It never carries the sentence, or any word from it, and it fires on submit, chip change and sort change.
- **AC-18**: Every icon control has an accessible label, each chip exposes its selected state, every target is at least 44 by 44, and the reading order follows the visual order.
- **AC-19**: `npx expo lint` and `npx tsc --noEmit` pass.

## Decision

**Chosen option**: Option 1, a TypeScript lexicon parser in the app, one parameterized GROQ read, and dataset embeddings for the soft words

The parser runs on the device and produces one filters object plus a `softText` string. The app calls Sanity directly with the existing public client, exactly as the feed does. Ranking uses `score(text::semanticSimilarity($softText))` only when the sort is Best match and there is soft text, and a plain rating order otherwise. If the scored query fails, the same query retries once without the score clause, so search keeps working and only the order changes.

**Implementation skills**: none installed for this area. The Sanity work follows `AGENTS.md` and spec 0002.

## Feature design

**Data model sketch**:

No new documents, no new fields. The stay document from spec 0002 already carries every value search filters on. Search adds one read shape and one dataset setting.

| Search field | Type | Nullable | Source in the stay document |
|---|---|---|---|
| maxPrice | number | yes | `pricePerNight` |
| minGuests | number | yes | `guests` |
| type | `cabin \| beach \| city \| villa` | yes | `type` |
| amenities | string[] (the nine amenity values) | yes | `amenities` |
| petsOnly | boolean | yes | `petsAllowed` |
| place | string | yes | `city`, `region` |
| softText | string | yes | `summary`, read by the embeddings index |

- `StaySearchFilters` (the six filter fields) and `StaySearchParams` (`filters` plus `softText`) are TypeScript only. Nothing is stored.
- Chips are derived from the filters object. There is no second chip list to keep in step. Chip order is fixed: price, guests, type, amenities, pets, place, with one chip per amenity.
- Dataset embeddings projection, set once per dataset: `_type == "stay" => {"name": name, "summary": summary}`. References cannot be expanded by a projection, so nothing else is embedded.

**Parser rules**:

- Price: a digit amount, with or without a currency sign, becomes a ceiling whether or not a comparative word is present. Comparative words under, less than, below, max, up to and at most are consumed too. Written numbers such as "three hundred" are not read, and a total is still read as a per night ceiling.
- Guests: digits, plus couple (2), solo (1) and a few (3). The count becomes a minimum on `guests`.
- Type: cabin, beach, city and villa with a few obvious synonyms. The first type word wins and later ones are ignored.
- Amenities: one synonym table per amenity value, kept next to `src/constants/amenities.ts`. "Pet friendly" is consumed by the pets filter rather than the amenity filter, and several amenities combine with AND.
- Pets: pet friendly, pets allowed, dog and cat set `petsOnly`. Negated forms such as "no pets" or "without a pool" are removed from the text and never inverted.
- Place: the remaining word is matched case insensitively against `city` or `region`.
- `softText` is the sentence with every consumed word, its negation, and punctuation removed, lowercased and whitespace collapsed. It is `null` when nothing is left, and `null` is the only value that skips scoring. Connectives such as with, and, a, for and in are dropped as well.

**State transitions**:

Search runs: `default` (all stays, best match, queried on mount) → `submitted` (filters plus soft text parsed) → `loading` → one of `ready` with results, `ready` with no results, or `error`. A chip tap or sort change moves `ready` back to `loading`. A failed scored query retries plain once: success lands in `ready` in rating order with a degrade note logged, failure lands in `error`. State is local to the screen and is never persisted, so a tab switch keeps it (the tabs stay mounted) and a restart clears it. A submit bumps a nonce so an identical sentence still issues a fresh request.

**API surface**:

| Surface | Kind | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `parseStayQuery(sentence)` | pure function, `src/search/parse.ts` | `sentence: string` | `filters: StaySearchFilters`, `softText: string \| null` | none | never throws, returns empty filters for text it cannot read |
| `searchStays(params, sort)` | read, `src/sanity/queries.ts` | the six filter fields, `softText`, `sort: SearchSort` | `StaySummary[]`, capped at 50 | public read, no token | Sanity failure, scoring unavailable |
| `staySearchQuery` variants | GROQ constants, `src/sanity/groq.ts` | the same params | stay summary rows, plus `_score` on the scored variant | public read | unused params are ignored by the conditional filters |
| `useStaySearch(params, sort)` | hook, `src/sanity/use-stay-search.ts` | params, sort | `loading`, `error`, `ready`, `retry` | none beyond the tab's Clerk gate | passed through from `searchStays` |
| `SearchField` focus | prop on `src/components/ui/search-field.tsx` | `autoFocus` | focuses the input once on mount | none | none |
| `SortMenu` | component, `src/components/search/sort-menu.tsx` | `value`, `onChange` | the chosen `SearchSort` | none | none |
| Dataset embeddings setting | Sanity CLI, run once by the engineer | dataset `production`, the projection above | similarity available inside `score()` | Sanity account token | the index stays `updating` for a minute or two after enabling |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Parse a sentence | each filter value | the sentence, read by the parser's vocabulary |
| Parse a sentence | `softText` | the sentence with the words the parser consumed removed |
| Parse a sentence | chip labels | derived from the filters object plus the constraint labels in `src/constants/copy.ts` |
| Run the search | the stay rows | the stay documents through GROQ |
| Rank softly | `_score` per stay | the dataset embeddings index over name and summary |
| Show the count | "n stays" or "50+ stays" | length of the returned array, capped at 50 (decided here) |
| Sort by price or rating | order | the `sort` value mapped to a GROQ `order()` in code |
| Show loading, error, empty | state | `useSanityQuery`, as it already behaves for the feed |
| Log the search | sort, filter count, constraint kinds | the sort state and the filters object, never the text |
| Show the unclear note | which note | the parser returning empty filters for a sentence that is not empty |

**Key invariants**:

- Hard constraints filter, soft words only rank. No soft word may remove a stay.
- A word the parser does not understand never becomes a filter, because a wrong filter hides valid stays.
- Every guest value is a GROQ parameter. Query strings stay constant.
- The result list never exceeds 50, and best match falls back to rating then name when there is no `_score`.
- Scoring runs only when the sort is Best match and `softText` is not null. An empty string never reaches `score()`.
- The 50 slice is the last stage of the query, after `score()` and `order()`, so ranking is never computed on a truncated list.
- `useSanityQuery` receives a `load` memoised on a key that serialises the filters, `softText`, sort and submit nonce, and a module level `initialData`. Its effect depends on both identities, so an inline closure would refetch forever.
- The sentence never reaches PostHog, logs, or error messages.
- Negations ("no pets", "without a pool") are ignored rather than inverted.

**Security model**:

Stay content is public and already read without a token. The Search tab sits behind the existing Clerk gate in `src/app/(tabs)/_layout.tsx`, so no extra check is added. The sentence is sent to Sanity as a GROQ parameter value on the project's own dataset, and nowhere else. No secret enters the bundle, and this feature adds no API route. No personal data is involved, so no compliance scope applies.

**Configuration required**:

- No new environment variable. One dataset setting is enabled once with the Sanity CLI, using the existing `SANITY_AUTH_TOKEN` or a CLI login.

**Critical test scenarios** (each maps to an acceptance criterion in Requirements):

- Happy path: submit "quiet pet friendly cabin with a hot tub under $300 a night" and read the chips, the count, the order and the cards, verifies **AC-2**, **AC-7**, **AC-8**
- Happy path: change sort to Price low to high and to Top rated, verifies **AC-6**
- Failure case: turn embeddings off, then search with a mood word. The same stays come back in rating order, with no error and one degrade warning event, verifies **AC-16**
- Failure case: go offline, keep a mood word in the sentence, and submit. The plain retry fails too, so the Alert and Try again appear, verifies **AC-11**, **AC-16**
- Edge case: submit "something nice for the weekend". All stays show with the unclear note, verifies **AC-9**
- Edge case: submit a sentence whose filters match nothing, then tap Clear filters, verifies **AC-10**
- Privacy: inspect the PostHog event after a search and confirm it holds counts and sort only, verifies **AC-17**

## Build plan

Tracer Bullet: a thin thread through parser, query and screen first, then each layer thickens. Embeddings are switched on only after search already works without them.

1. Thread start: `src/search/parse.ts` reading only stay type and the price ceiling, one parameterized search query in `src/sanity/groq.ts` plus `searchStays` in `queries.ts`, and the Search tab replacing its placeholder with a field, the search key, a mount query and real cards ordered by rating, satisfies **AC-2**, **AC-3**, **AC-5**, **AC-13**, **AC-19**
2. Thicken the parser: guests (digits plus couple, solo and a few), amenity synonyms next to `src/constants/amenities.ts`, pets, place against city and region, the mood word split into `softText` with consumed and negated words removed, negation ignored and the first stay type kept, satisfies **AC-2**, **AC-7**, **AC-9**
3. Chips, count line and the new `SortMenu` component, wired to the filters object and the sort to query map, satisfies **AC-1**, **AC-6**, **AC-7**, **AC-8**
4. Screen chrome and states: back arrow to Home, loading and error copied from Home, empty state with Clear filters, filter icon notice, `autoFocus` on `SearchField` plus the Home focus param, satisfies **AC-1**, **AC-10**, **AC-11**, **AC-14**, **AC-15**
5. Embeddings: enable the dataset index with the projection, add the scored query variant, and wire the fallback that reruns unscored, satisfies **AC-2**, **AC-4**, **AC-16**
6. Session state, the analytics event, and an accessibility pass over the new controls, satisfies **AC-12**, **AC-17**, **AC-18**
7. Simulator screenshots against `prompts/prompt-imgs/search.png` with every difference listed and fixed, then `npx expo lint` and `npx tsc --noEmit`, satisfies **AC-1**, **AC-19**

## Consequences

**Positive**:

- All filtering is deterministic and readable in code, and the chips show a guest exactly which constraint hid a stay.
- Search adds no API route, no secret and no model call, so it costs nothing per search beyond the Sanity quota.
- The scored branch is isolated, so a plain ordered search keeps working on any dataset that has no embeddings.

**Negative / tradeoffs**:

- The lexer only knows the words in its vocabulary. A synonym it lacks is silently ignored rather than ranked, so search quality improves only by editing that vocabulary.
- Semantic queries count against the org's monthly semantic search quota, and the embeddings index lags writes by about a minute.
- Setting up a new environment means remembering the dataset embeddings command, which no build step performs.
- The scored query is the one path where a Sanity failure silently changes the order, so a regression there looks like worse ranking rather than an error.

**Neutral**:

- Two more stay queries now exist next to the two from spec 0002.
- `src/search/` becomes the home for text understanding, which the policy chat in feature 7 can reuse for its vocabulary.

## Follow-up

- [ ] Tokenless use of `text::semanticSimilarity()` on a public dataset with `useCdn: true` is not documented by Sanity. Step 5 of the build proves it against the real dataset first. If it fails, the fix is an Expo API route holding a Sanity token, which would be the first route in this app and needs the `origin` setting for production.
- [ ] Written numbers ("three hundred", "twelve guests") are not read. If real sentences need them, add a small number word table to the parser rather than moving parsing to a model.
- [ ] Jev typed decisions are not used here. If the parser's vocabulary proves too narrow for real sentences, the next step is a Jev Choice over candidate amenities that code already found, not free text generation.
- [ ] Remove `screenCopy.search` from `src/constants/copy.ts` once the placeholder is gone, and add `searchCopy` beside the other screen copy.

Reasoning and the options that lost: see [rationale.md](rationale.md).

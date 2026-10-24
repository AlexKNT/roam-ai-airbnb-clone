# src/search

One sentence in, hard filters plus mood text out. Spec [0003](../../docs/specs/0003-natural-language-search/index.md) is the contract; read it before changing what search does.

## Files

- `parse.ts`: `parseStayQuery(sentence)` returns `{ filters, softText }`. Pure, never throws, and an unreadable sentence yields empty filters.
- `types.ts`: `StaySearchFilters`, `StaySearchParams`, `SearchSort`, plus `filterKinds` and `hasFilters`.
- `chips.ts`: `searchChips(filters)` builds the chip row from the filters object and `withoutConstraint` removes one. There is no second chip list to keep in step.
- `places.ts`: state names resolve to region codes (`california` to `ca`), because stays store `CA`, `OR`, `NY` in `region`.
- `analytics.ts`: the `search_submitted` event. Sort, filter count and constraint kinds only, never the sentence or a word from it.

## Parser rules

- Vocabulary tables are `amenitySynonyms` in `src/constants/amenities.ts`, `typeSynonyms` in `parse.ts`, and `placeAliases` in `places.ts`. A word missing from them is silently ignored, never guessed, because a wrong filter hides valid stays.
- Order matters: negations, numbers (price and guests), guest words, amenities, pets, type, place. Amenities run before type, so "beach access" wins over "beach".
- The first stay type wins; later type words are consumed and ignored.
- Negations ("no pets", "without a pool") are dropped, never inverted.
- `softText` is what is left after the words the parser consumed and after connectives. `null` is the only value that skips scoring.

## Reading and screen

- `useStaySearch(params, sort, submitNonce)` in `src/sanity/use-stay-search.ts` owns the query key. The submit nonce is what makes an identical sentence issue a fresh request.
- `searchStays` in `src/sanity/queries.ts` runs the scored query for best match and retries the plain one once, warning PostHog once per session.
- The screen is `src/app/(tabs)/search.tsx`; chips and sort menu live in `src/components/search/`.
- Ranking needs the dataset embeddings index. Check it, and enable it on a new dataset, from `studio/` with `npx sanity datasets embeddings enable <dataset> --projection '{"name": name, "summary": summary}' --wait`. The index is per dataset and lags writes by about a minute.

_Drafted by /sync from the introducing change, worth a quick human pass._

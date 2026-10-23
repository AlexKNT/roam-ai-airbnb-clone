# Verify: natural language search · spec 0003 · updated 2026-10-23

_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Open the Search tab. Back arrow, field with search icon and filter icon, one chip row, count line with sort on the right, then cards. Layout, spacing, radii, colors and icons match `prompts/prompt-imgs/search.png` → AC-1, AC-18
- [ ] Submit "quiet pet friendly cabin with a hot tub under $300 a night". Only cabins at $300 or less, pets allowed, hot tub present, and the quietest summary comes first → AC-2
- [ ] The chips read exactly the constraints that were applied, in the order price, guests, type, amenities, pets, place, with one chip per amenity. Tap Pet Friendly: the chip goes, a stay without pets can now appear, and the sentence in the field is untouched. Submit again and the chip comes back → AC-7
- [ ] The count line matches the number of cards, reads "50+ stays" at the cap, and disappears while loading, on error and when nothing matches → AC-8
- [ ] Change sort to Price low to high, then Price high to low, then Top rated. The order changes each time, the label sticks, and with a mood word in the sentence none of the three spends a scored query (check the dev network log) → AC-6
- [ ] Submit "cabins" with no mood word. Order is by rating then name, the same as the feed, and the label still reads Best match → AC-4, AC-5
- [ ] Submit "something nice for the weekend". All stays show with the note above the count line. Submit "quiet cabin": the note is gone. Submit "somewhere quiet": the note shows and the order still follows the mood → AC-9
- [ ] Submit a sentence that matches nothing, for example "villa in Iceland under $50". The empty state shows with no count line, and Clear filters returns all stays with an empty field → AC-10
- [ ] Type without submitting. No query runs and the results stay put. Press the search key and it runs. Submit the identical sentence again and a fresh request goes out → AC-13
- [ ] Open Search from the Home prompt bar, then again from the hero search icon. The field is focused both times → AC-14
- [ ] Tap the filter icon. The coming soon notice opens and no navigation happens → AC-15
- [ ] Search, switch to Trips, come back. The sentence, chips and results are still there, with no refetch. Restart the app and the tab is back to the default ranking → AC-12
- [ ] Read the screen with VoiceOver or TalkBack. Every icon button is announced, chips announce selected, targets are at least 44 by 44, and order follows the visual order → AC-18

## Failure and limits

- [ ] Turn dataset embeddings off and search with a mood word. Results come back in rating order with no error, and one degrade warning event appears in PostHog → AC-16
- [ ] Go offline and submit a sentence with a mood word. The plain retry fails too, so the Alert and Try again appear, and Try again reruns → AC-11, AC-16
- [ ] In the Studio Vision panel, run the plain search query with `$type` set to `x" || defined(slug.current) || "`. It returns no stays and does not error into an unexpected shape → AC-3
- [ ] After a search, inspect `search_submitted` in PostHog. It holds sort, filter count and constraint kinds only, never the sentence, and it fires on submit, chip tap and sort change → AC-17

## Commands

- [ ] `npx tsc --noEmit` exits 0 → AC-19
- [ ] `npx expo lint` exits 0 → AC-19
- [ ] From `studio/`, `npx sanity datasets embeddings status production` reports `ready` → AC-4
- [ ] A tokenless query using `score(text::semanticSimilarity($softText))` returns rows with `_score` (the build's step 5 check) → AC-4, AC-16

## Deferred

- Real sentence variety beyond the seed vocabulary. The parser's coverage is measured in feature 7, when the policy chat adds its own vocabulary and both are reviewed together.

## Acceptance-criteria coverage

- AC-1 by the design comparison and the chrome checks · AC-2 by the pet friendly cabin sentence · AC-3 by the injected parameter value · AC-4 by the embeddings status, the scored query and the sort charge check · AC-5 by the rating order check · AC-6 by the three sort changes · AC-7 by the chip order, removal and sentence check · AC-8 by the count line checks · AC-9 by the three unclear sentences · AC-10 by the empty state and Clear filters · AC-11 by the offline check · AC-12 by the tab switch and restart · AC-13 by typing without submitting and the repeat submit · AC-14 by the two Home entries · AC-15 by the filter icon · AC-16 by the embeddings off and offline checks · AC-17 by the PostHog event · AC-18 by the screen reader pass · AC-19 by the two commands.

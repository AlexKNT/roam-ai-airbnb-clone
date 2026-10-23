# 0003 rationale. Natural language stay search

## Context

> ⚠️ Premise note: the scope's done criteria put message ranking (quiet, cozy, secluded) at the center, but with roughly a dozen stays and a one paragraph summary each, embeddings mostly reorder a short list. The part that decides whether search feels right is the vocabulary that turns "pet friendly", "hot tub" and "under $300" into filters, because a missed synonym is invisible while a wrong filter hides a valid stay. So embeddings are designed as a thin ordering layer with a working fallback, and the vocabulary is treated as the real product surface, with a clear next step if it proves too narrow.

The app already reads stay content straight from a public Sanity dataset with no token, and the feed filters by stay type through a parameterized GROQ query (spec 0002). Search is the first screen where the input is free text, which raises three questions the feed never had to answer: how a sentence becomes filters, who runs that translation, and how a soft word like "quiet" can influence order without ever hiding a stay.

The project rules settle two things already. Prices and guest counts are parsed in code, never produced by a model. Soft intent ranks through Sanity Dataset Embeddings, and embeddings rank rather than filter. Jev, the typed decision model, answers Choice, Noul and Score questions and never writes queries, so it could only pick between candidates code already found.

The device is the constraint that shapes the rest. The dataset is public, so the app can query it directly. Any model call would need an API route, a secret, and (for production builds) an `origin` setting that does not exist yet. That is a reasonable price for the policy chat in feature 7, which really does need a model, but it is a high price for turning "under three hundred" into a number.

The current Search tab is a placeholder, and the design at `prompts/prompt-imgs/search.png` shows the finished shape: back arrow, field with a filter icon, chips, a count line with a sort control, and cards.

## Options considered

### Option 1: Lexicon parser in the app, parameterized GROQ read, embeddings for mood

A TypeScript module turns the sentence into six optional filters plus a leftover `softText`. The app queries Sanity directly with the client it already has. When `softText` is present the query scores with `text::semanticSimilarity($softText)` and orders by `_score`, then rating; when it is absent, or the scored query fails, the same query runs ordered by rating.

**Pros**:
- No new surface: no route, no secret, no per search model cost.
- Deterministic and inspectable: the chips show exactly what was applied, and the vocabulary is a file to edit.
- Degrades cleanly, because the unscored query is the same query minus one clause.

**Cons**:
- Only reads the words in its vocabulary, so unknown synonyms are ignored.
- Two query variants and a fallback path to keep in step.
- Semantic queries spend the org's monthly similarity quota.

### Option 2: Code parser plus Jev choosing between candidates, through an API route

The parser finds candidate readings (for example, "hot tub" could mean the hot tub amenity or the word "tub" in a summary), and Jev answers a Choice question to pick one.

**Pros**:
- Handles genuine ambiguity the lexicon cannot settle.
- Stays inside the project's rule that Jev chooses but never produces a value.

**Cons**:
- Needs the app's first API route, an `origin` setting for production, and a request round trip before any stay is fetched.
- With an unambiguous eight word vocabulary there is little to choose between, so it adds a hop for no visible gain.

### Option 3: Keyword ranking only, no embeddings

Mood words are matched against the stay summary with GROQ `match`, and order falls back to rating.

**Pros**:
- No dataset setting, no quota, one query.
- Works on any dataset with nothing to enable.

**Cons**:
- "Quiet" only matches a summary that literally says quiet, so the ranking fails on the paraphrases the feature is named for.
- Contradicts the project rule that soft intent ranks through embeddings.

### Option 4: Move search to an API route with a Sanity token

The whole read moves server side, which also covers the case where `text::semanticSimilarity()` turns out not to work from a tokenless, CDN backed client.

**Pros**:
- One place to change if the tokenless semantics assumption fails.
- Lets the sentence be logged or inspected server side without touching the device bundle.

**Cons**:
- Duplicates a read that already works publicly and adds hosting, a secret and an origin setting.
- Slower first result, and one more deployment surface for a single screen.

## Rationale

Option 1 wins because the forces in Context all point the same way: the data is public, the values that matter are numbers and fixed vocabulary, and the project already parses numbers in code. A model in this path buys tolerance for wording the seed content does not contain, at the price of a route, a secret and a round trip, and it puts a probabilistic step in front of a filter that must never hide a valid stay (basis: your AGENTS.md, prices and guest counts are parsed in code, and Jev only chooses between candidates).

The embeddings question is the one place where the recommendation is narrower than the scope copy suggests. Dataset Embeddings are configured per dataset with a projection and read through `score()`, and ordering must use `_score`, never a direct call in `order()` (basis: Sanity Dataset Embeddings documentation, verified in the research pass recorded below). What the documentation does not say is whether a tokenless public client using the CDN can run a scored query at all. Rather than design around an unknown, the spec makes the scored query an additive step with a proven fallback, and puts the proof in the build plan before the rest of the screen depends on it. That also keeps option 4 as a contained change rather than a rewrite.

Option 3 was rejected despite being the simplest, because a ranking that only fires on the literal word "quiet" does not deliver the promise of describing a stay in a sentence. Option 2 was kept as the growth path rather than the starting point: it is the right answer once the vocabulary proves too narrow, and it costs a route that is cheaper to add later than to design twice.

## Evidence from the research pass

Checked during the design conversation, against the official documentation:

- `text::semanticSimilarity("text")` exists and is valid only as an argument to `score()`. Ordering is `... | score(...) | order(_score desc)`; using the function inside `order()` returns an error.
- The index is a dataset setting, enabled with the Sanity CLI (`sanity datasets embeddings enable <dataset> --projection='...'`) or the datasets HTTP API. It is not a Studio plugin and no schema deploy is needed. Projections cannot expand references.
- Documented limits: at most 10 chunks per document, embeddings update asynchronously with a lag usually under a minute, and queries count against a monthly semantic search quota. The maximum number of scored documents and the meaning of `_score` are not documented, so `_score` is only comparable inside one query.
- Tokenless and CDN behaviour for scored queries is not documented anywhere on that page or the migration guide. This is the open item carried into the build plan and Follow-up.
- Expo Router API routes do work for native clients against a deployed server, and a relative `fetch` works against the dev server. A production build needs the `origin` set on the `expo-router` plugin. This is what option 4 would cost, which is why it is not the starting point.

## References

**Project sources**:
- `AGENTS.md`: rules that prices and guest counts are parsed in code, that embeddings rank and never filter, that soft intent ranks through Dataset Embeddings, and that no learner typed text reaches PostHog · `src/constants/copy.ts` for screen copy conventions · `src/components/ui/search-field.tsx` and `chip.tsx` for the existing controls
- spec 0002 (`docs/specs/0002-content-model-stay-queries/`): the stay document, the typed query pattern, the 50 result cap and the hook states search reuses
- `prompts/prompt-imgs/search.png`: the screen design

**Practices & standards**:
- Hard constraints filter, soft signals rank: a ranking signal must never remove a candidate
- Parse structured values in code, never in a model
- Parameterized queries only, no string concatenation into query text
- Degrade to the previous behaviour when an optional capability is unavailable

**Links** (web verified during the design research pass):
- Sanity Dataset Embeddings: https://www.sanity.io/docs/content-lake/dataset-embeddings
- Sanity, search content with GROQ: https://www.sanity.io/docs/content-lake/search-content-with-groq
- Expo Router API routes: https://docs.expo.dev/router/web/api-routes/

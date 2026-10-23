# 0002. Content model and stay queries · decision record

Decision record for [index.md](./index.md).

## Context

Roam has a Sanity Studio with an empty schema and an app with no content layer at all. Every planned screen depends on the same content: a stay with its photos, place, price and amenities, the host who runs it, the cancellation policy behind the refund line, and the house rules that chat must quote back word for word. Until this content model exists, the seed script has nothing to fill, the home feed has nothing to list, and the policy chat has nothing to quote.

Two forces shape the decision. First, the content is entirely public and read only from the app's point of view: guests browse it, editors change it in the Studio, and nothing a guest types is stored here. Second, several later features rank or quote this content, so the text that should affect ranking has to live on the stay document itself (embeddings cannot follow a reference), and the policy text has to stay plain enough to quote exactly.

> ⚠️ Premise note: reading the public dataset directly means everything in `production` is readable by anyone holding the project id. That is safe today because the model holds no personal data, but it becomes a leak the moment guest data, host contact details or saved stays land in the same dataset. Saved stays (feature 8) must therefore go somewhere private, and `AGENTS.md` states the no personal data rule as a standing constraint, not a one time cleanup.


## Options considered

### Option 1: Direct public read with the official client, typed projections

Add `@sanity/client` and `@sanity/image-url`, query the public dataset from the app with the CDN on, and write one result type per query that mirrors the projection exactly.

**Pros**:
- One network hop per screen, cached at the CDN, with no session and no server route to keep alive.
- No secret exists in the read path, so nothing can leak from the bundle.
- The types describe what the app receives, not what the schema allows, so a screen never handles a field the query did not project.

**Cons**:
- Every field added to these documents is world readable the moment it is published.
- Types are maintained by hand, so a projection edit that forgets its type drifts silently.
- Growth beyond the cap of 50 needs pagination added later.

### Option 2: Clerk protected API route in front of Sanity

The app calls `src/app/api/*+api.ts` routes, which verify the Clerk session and query Sanity with a read token.

**Pros**:
- The dataset could be private, and every read is authenticated and rate limitable.
- One place to change query shape without shipping an app update.

**Cons**:
- Adds a session requirement and a network hop to content that is not private, and couples the feed to auth working.
- Puts a Sanity token in a server runtime that the app has to keep configured for every environment.

### Option 3: Hand rolled fetch and hand built image URLs

No client library: call the HTTP query endpoint with `fetch` and append width parameters to `asset->url` by hand.

**Pros**:
- Zero dependencies, and the URL shape is visible in the query.

**Cons**:
- Reimplements retries, CDN handling and GROQ parameter encoding, which is exactly where subtle bugs live.
- Hand built URLs ignore hotspot and crop, so photos cut badly at card sizes.


## Rationale

The content is public, read only and carries no personal data, which removes the only reasons Option 2 exists: hiding the dataset and gating reads. For a browsing feed that a signed in guest opens on a phone, an extra session check and a server route add a failure mode (auth) between the guest and a photo. Option 3 loses on the boring technology test: the official client already handles parameter encoding, retries and CDN, and reimplementing it buys nothing. The cost this accepts is that the dataset stays public forever, so privacy has to be enforced by what is modelled there, which is why the no personal data rule stays a standing constraint.

Sanity's first party type generation was the alternative to hand written types. It was rejected because it ties app types to a generation step that only stays current if it runs after every schema deploy, and this feature has two queries over a model that is now fixed. The drift risk it removes is real but small here, and a review catches a projection edit that forgets its type.

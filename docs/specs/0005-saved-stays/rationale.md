# 0005. Saved stays: rationale

## Context

Roam's guests can already browse, search and ask about stays, but the heart on a card and on the stay detail gallery does nothing yet, and Trips is a placeholder. The scope asks for three things at once: a working heart on every card and on the detail screen, somewhere to find saves again, and a Saved count the profile can read. The last one matters because the profile feature is next and its count must agree with Trips.

The hard part is not the heart. It is where a guest's private list lives. Everything Roam serves today comes from one public Sanity dataset that the app reads directly with a CDN backed client. That dataset is world readable by design, so a save cannot go there. There is also no general database in the project: no SQL, no key value store, no user table. Clerk holds identity only. So this feature has to pick a private store from what the project already runs, keep it out of the app bundle, and keep the whole thing small enough that a guest never notices it.

The project's rules shape the answer before any option is weighed: secret keys never reach the bundle, API routes verify the Clerk session before doing any work, and a new service is not added without asking. The build approach is Tracer Bullet, so the first working slice has to run end to end through the store and the route rather than mocking either.

> ⚠️ Premise note: a CMS is not a user data store. Sanity has no per row access rules for end users, so every ownership check will live in our own API route, and a leaked management token would read every guest's saves. Clerk metadata would keep ownership inside the identity provider but caps out near 8 KB and turns a content relationship into identity data. Neither is a general database. For one small private list on a project that has no database yet, the private dataset is the cheapest honest answer, and this spec accepts the tradeoff, records it in Consequences, and leaves a Follow-up to move the data if a cross guest query or an erasure flow ever arrives. Worth knowing that this document copies the scope's own wording, which already calls for private data to stay out of the public content dataset.

## Options considered

### Option 1: A separate private Sanity dataset, reached only through API routes

Saves are documents in a second dataset on the same Sanity project. The app never talks to it directly. One API route verifies the Clerk session, then reads and writes with a server side read token and write token.

**Pros**:
- No new service, dependency or paid tier. The write token is already in `.env.example` for the seed script, and the SDK is already a dependency.
- Guest data leaves the public dataset entirely, so no public query, CDN edge or client bundle can expose it. This is exactly what the scope's done condition asks for.
- One GROQ query can order saves by `savedAt` and return the guest's ids, and the ids join straight back to stays in the public dataset.
- The dataset is visible and editable in Sanity tooling, which helps while the feature is young.

**Cons**:
- Access control is entirely application level. Sanity cannot say "guest A may read only guest A's rows".
- The dataset must be created and both tokens scoped by hand before the feature works.
- Storing user owned rows in a CMS is an unusual use of the tool, and a future "most saved stays" query would bake that in further.

### Option 2: Clerk private metadata on the user

Each guest's saved stay ids live in the user's `privateMetadata`, written through the Clerk Backend API from an API route.

**Pros**:
- Ownership sits with the identity provider, so there is no second store to own or secure.
- No new service and no new dataset to create, and the secret key already exists in every API route.
- Reading the list is one Backend API call with no extra query language.

**Cons**:
- Metadata is a small JSON blob, roughly 8 KB for the account in total, so a long list of saves eventually collides with other per user data.
- Saves become identity data, which makes any later move to a real store a migration rather than a new table.
- Every toggle is a read, modify, write of the whole blob through a rate limited third party API, so two devices saving at once can lose one of the saves.
- Ordering by save time means storing timestamps inside the blob and rewriting all of them on every change.

### Option 3: The device only

Saved ids sit in local storage on the phone, with no server at all.

**Pros**:
- Smallest possible build: no route, no dataset, no tokens, and the heart never waits on the network.
- Nothing private ever leaves the device, so the privacy question disappears.

**Cons**:
- Saves do not follow the guest to a second device or survive a reinstall, which contradicts the scope's "persists across launches" intent read broadly.
- The Saved count would be device local and could never agree with anything on the server.
- It needs a new native storage dependency, and a guest signed out and in again on a shared phone would inherit the previous guest's list.

### Option 4: A new Postgres database (Neon)

A `saved_stay` table with a unique index on `(guest_id, stay_id)`, reached through API routes.

**Pros**:
- The right long term shape for user owned data: constraints, indexes, transactional writes, a paging story, and a path to account deletion.
- Well understood operations, and a unique index enforces the one save per guest and stay rule in the database rather than in code.

**Cons**:
- A brand new service, connection string, provider account and operational surface for one small table, which the project's rules ask to avoid until it is needed.
- Adds cold start and connection handling to routes that today hold no database connection.
- Doubles the data layer: stays in Sanity, saves in SQL, so the Trips screen still needs a join across two systems.

## Rationale

Option 1 wins because it is the only option that is private, available on every device and adds no service, all at once. Option 3 fails the follow across devices goal and would grow a new dependency. Option 2 keeps ownership in the right place but its size limit and read, modify, write pattern make it fragile for a list that changes on every tap. Option 4 is the shape this feature would want if Roam already had a database, and it is the natural place to move to the day a cross guest query or an erasure flow appears; today it would mean standing up infrastructure for one small table.

Inside Option 1 the small decisions follow from the data model. A fixed document id (`savedStay.<guestId>.<stayId>`) makes duplicate prevention a property of the key rather than a lookup that two fast taps can race past. Writing with a create only call keeps the original save time, so a repeat save does not quietly move the stay to the top of Trips. Storing the stay as a plain value rather than a reference is forced by Sanity's rule that references cannot cross datasets, and it also means the public dataset never learns which guest is interested in which stay.

The rest are deliberate small calls made for this build. One provider mounted under Clerk, rather than a fetch per screen, keeps every heart, Trips and the future profile count reading the same numbers. Optimistic flipping with rollback keeps the tap instant while still ending in the truth. Ignoring a second tap while a write is in flight prevents a double tap from turning into a save then unsave. Pruning orphans on read avoids a background job for a case that is rare. The 200 save read cap is a guard, not real paging, and is recorded as a follow-up rather than pretended away.

The engineer's answers matched all of these, including the private dataset over Clerk metadata, the fixed document id, the shared provider, the newest first order, the local test suite and the manual Trips design built from existing tokens.

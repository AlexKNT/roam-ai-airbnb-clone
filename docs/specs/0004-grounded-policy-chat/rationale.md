# 0004 rationale. Grounded policy chat

## Context

> ⚠️ Premise note: the word chat sets an expectation of free conversation, while the grounding rule allows only exact text from the content dataset. Both can hold, but only if the screen never implies an answer it cannot source. The copy, the starter questions and the no answer state carry that weight, so they are treated as part of the contract rather than as decoration.

A stay's policies are the part of a booking a guest wants explained before they commit, and the part where a wrong answer costs real money. Roam already stores every one of those texts in Sanity: the cancellation policy body, the house rules list, the pets flag, the check in and check out times, and a set of factual fields about the stay. None of it is reachable by asking a question, so a guest has to read three separate cards and guess which one applies.

The product rule removes the easy path. Answers must show the stay's own fields and Roam's policy text word for word, with their source, and no language model writes answer text. That rules out the usual chat pattern of retrieving passages and having a model summarise them, and it makes matching a question to the right document the central problem.

`AGENTS.md` currently records two overlapping mechanisms for this area, Jev typed decisions and a Sanity Context endpoint in Knowledge Base mode. Only one of them can be the matching path, otherwise the build carries two services with two failure modes and an ambiguous source of truth. There is no compliance scope here: no payment, no health data, and nothing about a question is stored. The one privacy fact worth naming is that guest typed text leaves the device to a third party model service.

## Options considered

### Option 1: Jev topic judgment plus exact GROQ reads

Jev answers one true or false probability question per catalog topic in a single call. Code keeps the topics above a threshold, takes at most two, reads their exact text from Sanity by query, and prints it. A keyword fallback covers a failed Jev call.

**Pros**:
- Every answer body is a stored string, so the word for word rule holds by construction.
- One model call per question, no dashboard configuration, no organisation token, and no second service.
- The matching rules are a code constant, so they are auditable, testable and change with a pull request.

**Cons**:
- The catalog, not the dataset, decides what the chat can answer, so content alone cannot teach it a new topic.
- Matching quality depends on topic labels and their phrasings, which need real questions to tune.
- An experimental model API is now on the critical path, with a keyword fallback as the only safety net.

### Option 2: Sanity Context endpoint in Knowledge Base mode

The route sends the question to a Context endpoint and prints the passage it returns.

**Pros**:
- Follows the line already written in `AGENTS.md`, and the retrieval quality comes from Sanity rather than from a hand written catalog.
- Content editors can improve answers without a release.

**Cons**:
- Knowledge Base mode synthesises an answer, so the text is no longer the stored string and the word for word rule fails.
- Needs an organisation token, a deployed Studio and a dashboard created endpoint before a single question works, which is more setup than the whole rest of this feature.
- Moves the source of truth for what the chat can answer out of the repository and into a dashboard.

### Option 3: Jev narrows topics, Context endpoint locates the passage

Both services run, Jev choosing the candidate topics and Context returning the passage to print.

**Pros**:
- The strongest grounding, since retrieval sees the dataset rather than a fixed catalog.

**Cons**:
- Two paid services and two failure modes for one question, and the answer is only verbatim if Context is asked in a mode that returns text rather than an answer.
- Doubles the setup work and the operational surface for a first version of a single screen.

### Option 4: Embeddings similarity over topic labels

Dataset embeddings rank the topic labels against the question, with a threshold and no model call.

**Pros**:
- Cheapest per question, and it reuses a mechanism search already proved.
- No new service, no key, no experimental API.

**Cons**:
- Weak on rewording and on short questions, which is exactly how guests ask about policies.
- Embeddings rank rather than decide, so a threshold would have to carry the whole decision with no notion of nothing matched.

## Rationale

The word for word rule is the force that decides this. Both Context options put a model between the dataset and the screen, and the moment an answer is synthesised the source line stops being a citation and becomes a suggestion. Option 1 keeps the text as data end to end, which means the contract in the acceptance criteria is checkable by reading the response, not by judging whether a summary was faithful.

The second force is setup cost against a first slice. Option 1 needs two environment values, one of them a base URL that any later API route would add anyway, one route, and one catalog file. The Context options need a dashboard endpoint, an organisation token with a viewer role, and a deployed Studio before anything answers, and they still leave two services on the path of every question. For a single screen in an app that has no other API route yet, that is infrastructure ahead of need.

The honest cost is matching quality and dependence on an experimental API. That is why the keyword fallback is part of the decision rather than a follow up, and why the catalog keeps its question wording and criteria in one file next to the phrasings, so tuning after the Beta test is a one file edit. The third force is testability: with matching in code and text in the dataset, the risky logic is pure TypeScript that a test can pin down without a network call.

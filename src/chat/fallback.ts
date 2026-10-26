import { policyTopics } from './topics';

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function phraseMatches(normalized: string, phrase: string) {
  const needle = normalize(phrase);
  if (!needle) return false;

  return new RegExp(`(^| )${needle}( |$)`).test(normalized);
}

/**
 * The path when Jev cannot answer: whole word matching over the catalog's known
 * phrasings. It answers only when exactly one topic is the clear winner.
 */
export function matchKeywordTopic(question: string): string | null {
  const normalized = normalize(question);

  const scores = policyTopics.map((topic) => ({
    id: topic.id,
    score: topic.phrasings.filter((phrase) => phraseMatches(normalized, phrase)).length,
  }));

  const best = Math.max(0, ...scores.map((topic) => topic.score));
  if (best === 0) return null;

  const winners = scores.filter((topic) => topic.score === best);

  return winners.length === 1 ? winners[0].id : null;
}

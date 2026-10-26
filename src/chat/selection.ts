import {
  MAX_ANSWERS,
  NULL_CASE_MAX_PROBABILITY,
  policyTopicIds,
  TOPIC_THRESHOLD,
} from './topics';

export type TopicProbabilities = Readonly<Record<string, number>>;

type Scored = { id: string; order: number; probability: number };

function score(probabilities: TopicProbabilities, allowed: readonly string[]): Scored[] {
  return policyTopicIds
    .map((id, order) => ({ id, order, probability: probabilities[id] ?? 0 }))
    .filter((topic) => allowed.includes(topic.id))
    .sort((a, b) => b.probability - a.probability || a.order - b.order);
}

/** The topics at or above the threshold, strongest first, ties by catalog order. */
export function selectTopics(probabilities: TopicProbabilities): string[] {
  return score(probabilities, policyTopicIds)
    .filter((topic) => topic.probability >= TOPIC_THRESHOLD)
    .slice(0, MAX_ANSWERS)
    .map((topic) => topic.id);
}

/**
 * The suggestion after a reply found nothing: the strongest answerable topic,
 * offered only while the nothing fits probability stays low.
 */
export function closestTopic(
  probabilities: TopicProbabilities,
  nullProbability: number,
  answerableTopicIds: readonly string[],
): string | null {
  if (!(nullProbability < NULL_CASE_MAX_PROBABILITY)) return null;

  const [best] = score(probabilities, answerableTopicIds).filter(
    (topic) => topic.probability > 0,
  );

  return best?.id ?? null;
}

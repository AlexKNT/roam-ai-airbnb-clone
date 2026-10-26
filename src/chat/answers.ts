import { amenityLabelsFor } from '@/constants/amenity-labels';
import { formatPrice } from '@/utils/format';

import type { PolicyTopic } from './topics';

/** The source label every fact answer carries. */
export const STAY_FACT_SOURCE = 'This stay';

export type StayFacts = {
  pricePerNight: number;
  guests: number;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  amenities: readonly string[];
  checkInTime: string;
  checkOutTime: string;
  petsAllowed: boolean;
};

export type StayPolicyText = {
  cancellationPolicy: { title: string; body: string } | null;
  houseRules: { name: string; rules: readonly string[] } | null;
};

export type RoamPolicyText = { title: string; body: string };

export type AnswerContext = {
  facts: StayFacts;
  stay: StayPolicyText;
  roamPolicies: ReadonlyMap<string, RoamPolicyText>;
};

export type PolicyAnswer = {
  title: string;
  body: string;
  source: string;
  unavailable: boolean;
};

function countOf(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function listOf(items: readonly string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function missing(topic: PolicyTopic): PolicyAnswer {
  return {
    title: topic.label,
    body: `This stay does not list ${topic.label.toLowerCase()}.`,
    source: STAY_FACT_SOURCE,
    unavailable: false,
  };
}

function factAnswer(topic: PolicyTopic, facts: StayFacts): PolicyAnswer {
  const answer = (body: string): PolicyAnswer => ({
    title: topic.label,
    body,
    source: STAY_FACT_SOURCE,
    unavailable: false,
  });

  switch (topic.field) {
    case 'pricePerNight':
      return answer(`This stay is ${formatPrice(facts.pricePerNight)} per night.`);
    case 'guests':
      return answer(`This stay sleeps up to ${countOf(facts.guests, 'guest')}.`);
    case 'bedrooms':
      return facts.bedrooms === null
        ? missing(topic)
        : answer(`This stay has ${countOf(facts.bedrooms, 'bedroom')}.`);
    case 'beds':
      return facts.beds === null
        ? missing(topic)
        : answer(`This stay has ${countOf(facts.beds, 'bed')}.`);
    case 'baths':
      return facts.baths === null
        ? missing(topic)
        : answer(`This stay has ${countOf(facts.baths, 'bathroom')}.`);
    case 'amenities': {
      const labels = amenityLabelsFor(facts.amenities);

      return labels.length === 0
        ? missing(topic)
        : answer(`This stay lists these amenities: ${listOf(labels)}.`);
    }
    case 'checkInTime':
      return facts.checkInTime.trim()
        ? answer(`Check in at this stay is from ${facts.checkInTime.trim()}.`)
        : missing(topic);
    case 'checkOutTime':
      return facts.checkOutTime.trim()
        ? answer(`Check out at this stay is by ${facts.checkOutTime.trim()}.`)
        : missing(topic);
    case 'petsAllowed':
      return answer(
        facts.petsAllowed
          ? 'Pets are welcome at this stay.'
          : 'This stay does not allow pets.',
      );
    default:
      return missing(topic);
  }
}

/**
 * Every answer is the stay's own text or a fixed template filled from a named
 * field. Nothing here composes a sentence a model wrote.
 */
export function buildAnswer(topic: PolicyTopic, context: AnswerContext): PolicyAnswer {
  if (topic.kind === 'stay-fact') {
    return factAnswer(topic, context.facts);
  }

  if (topic.kind === 'stay-policy') {
    const policy = context.stay.cancellationPolicy;

    if (!policy?.body.trim()) {
      return { title: topic.label, body: '', source: topic.label, unavailable: true };
    }

    return { title: policy.title, body: policy.body, source: policy.title, unavailable: false };
  }

  if (topic.kind === 'house-rules') {
    const rules = context.stay.houseRules;

    if (!rules?.rules.length) {
      return { title: topic.label, body: '', source: topic.label, unavailable: true };
    }

    const source = rules.name.trim() || topic.label;

    return { title: source, body: rules.rules.join('\n'), source, unavailable: false };
  }

  const document = topic.roamTopic ? context.roamPolicies.get(topic.roamTopic) : undefined;

  if (!document?.body.trim()) {
    return { title: topic.label, body: '', source: topic.label, unavailable: true };
  }

  return {
    title: document.title,
    body: document.body,
    source: document.title,
    unavailable: false,
  };
}

/** A topic is answerable when this stay has text for it. */
export function isAnswerable(topic: PolicyTopic, context: AnswerContext): boolean {
  return !buildAnswer(topic, context).unavailable;
}

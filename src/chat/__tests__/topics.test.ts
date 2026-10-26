import { roamPolicyTopicIds } from '../../../studio/schemaTypes/roam-policy-topics';

import {
  findPolicyTopic,
  isKnownTopicId,
  policyTopics,
  starterQuestionsFor,
  type StayPolicySource,
} from '../topics';

const stayWithText: StayPolicySource = {
  cancellationPolicy: { title: 'Free cancellation', body: 'Cancel 24 hours ahead.' },
  houseRules: { name: 'House rules', rules: ['No smoking'] },
};

describe('policy topic catalog', () => {
  it('keeps every id unique and kebab case', () => {
    const ids = policyTopics.map((topic) => topic.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('gives every topic the source it reads', () => {
    for (const topic of policyTopics) {
      if (topic.kind === 'stay-policy') {
        expect(topic.reference).toBe('cancellationPolicy');
      }

      if (topic.kind === 'house-rules') {
        expect(topic.reference).toBe('houseRules');
      }

      if (topic.kind === 'stay-fact') {
        expect(topic.field).toBeDefined();
      }

      if (topic.kind === 'roam-policy') {
        expect(topic.roamTopic).toBe(topic.id);
      }

      expect(topic.phrasings.length).toBeGreaterThan(0);
    }
  });

  it('holds one topic per subject', () => {
    const fields = policyTopics
      .map((topic) => topic.field)
      .filter((field): field is NonNullable<typeof field> => field !== undefined);

    expect(new Set(fields).size).toBe(fields.length);
  });

  it('keeps the Studio topic list in step with the catalog', () => {
    const roamTopics = policyTopics
      .filter((topic) => topic.kind === 'roam-policy')
      .map((topic) => topic.roamTopic);

    expect(roamTopics).toEqual([...roamPolicyTopicIds]);
  });

  it('looks topics up by id and rejects anything else', () => {
    expect(findPolicyTopic('cancellation-policy')?.kind).toBe('stay-policy');
    expect(isKnownTopicId('cancellation-policy')).toBe(true);
    expect(isKnownTopicId('weather')).toBe(false);
  });
});

describe('starter questions', () => {
  it('offers three starters from answerable stay topics', () => {
    expect(starterQuestionsFor(stayWithText).map((starter) => starter.topicId)).toEqual([
      'cancellation-policy',
      'house-rules',
      'pets',
    ]);
  });

  it('hides a starter when the stay has no text for it', () => {
    expect(
      starterQuestionsFor({ ...stayWithText, cancellationPolicy: null }).map(
        (starter) => starter.topicId,
      ),
    ).toEqual(['house-rules', 'pets', 'check-in']);
  });

  it('hides a house rules starter when the rules list is empty', () => {
    expect(
      starterQuestionsFor({
        ...stayWithText,
        houseRules: { name: 'House rules', rules: [] },
      }).map((starter) => starter.topicId),
    ).toEqual(['cancellation-policy', 'pets', 'check-in']);
  });
});

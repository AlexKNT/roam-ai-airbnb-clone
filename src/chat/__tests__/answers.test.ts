import { buildAnswer, isAnswerable, type AnswerContext } from '../answers';
import { findPolicyTopic, type PolicyTopic } from '../topics';

const context: AnswerContext = {
  facts: {
    pricePerNight: 250,
    guests: 4,
    bedrooms: 2,
    beds: 3,
    baths: null,
    amenities: ['hot-tub', 'pool'],
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM',
    petsAllowed: true,
  },
  stay: {
    cancellationPolicy: {
      title: 'Free cancellation',
      body: 'Cancel 24 hours ahead for a full refund.',
    },
    houseRules: { name: 'House rules', rules: ['No smoking', 'No parties'] },
  },
  roamPolicies: new Map([
    [
      'refunds-and-deposits',
      {
        title: 'Roam refunds and deposits',
        body: 'Roam holds a refundable deposit until 48 hours after check out.',
      },
    ],
  ]),
};

function topic(id: string): PolicyTopic {
  const found = findPolicyTopic(id);
  if (!found) throw new Error(`No topic ${id}`);

  return found;
}

describe('buildAnswer', () => {
  it('prints a stay policy body unchanged with its title as the source', () => {
    expect(buildAnswer(topic('cancellation-policy'), context)).toEqual({
      title: 'Free cancellation',
      body: 'Cancel 24 hours ahead for a full refund.',
      source: 'Free cancellation',
      unavailable: false,
    });
  });

  it('joins the stored house rules into one line per rule', () => {
    expect(buildAnswer(topic('house-rules'), context)).toEqual({
      title: 'House rules',
      body: 'No smoking\nNo parties',
      source: 'House rules',
      unavailable: false,
    });
  });

  it('prints a Roam policy body unchanged with its title as the source', () => {
    expect(buildAnswer(topic('refunds-and-deposits'), context)).toEqual({
      title: 'Roam refunds and deposits',
      body: 'Roam holds a refundable deposit until 48 hours after check out.',
      source: 'Roam refunds and deposits',
      unavailable: false,
    });
  });

  it('fills a stay fact through its template', () => {
    expect(buildAnswer(topic('price'), context)).toEqual({
      title: 'Price per night',
      body: 'This stay is $250 per night.',
      source: 'This stay',
      unavailable: false,
    });
    expect(buildAnswer(topic('guests'), context).body).toBe(
      'This stay sleeps up to 4 guests.',
    );
    expect(buildAnswer(topic('amenities'), context).body).toBe(
      'This stay lists these amenities: Hot Tub and Pool.',
    );
    expect(buildAnswer(topic('pets'), context).body).toBe('Pets are welcome at this stay.');
    expect(buildAnswer(topic('check-in'), context).body).toBe(
      'Check in at this stay is from 3:00 PM.',
    );
  });

  it('says so when the stay does not list a field', () => {
    expect(buildAnswer(topic('baths'), context)).toEqual({
      title: 'Bathrooms',
      body: 'This stay does not list bathrooms.',
      source: 'This stay',
      unavailable: false,
    });
  });

  it('marks a topic unavailable when the stay has no text for it', () => {
    const emptyContext: AnswerContext = {
      ...context,
      stay: { cancellationPolicy: null, houseRules: { name: 'House rules', rules: [] } },
      roamPolicies: new Map(),
    };

    expect(buildAnswer(topic('cancellation-policy'), emptyContext)).toMatchObject({
      body: '',
      unavailable: true,
    });
    expect(buildAnswer(topic('house-rules'), emptyContext)).toMatchObject({
      body: '',
      unavailable: true,
    });
    expect(buildAnswer(topic('refunds-and-deposits'), emptyContext)).toMatchObject({
      body: '',
      unavailable: true,
    });
    expect(isAnswerable(topic('pets'), emptyContext)).toBe(true);
  });
});

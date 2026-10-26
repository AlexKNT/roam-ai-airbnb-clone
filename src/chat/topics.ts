/**
 * The one list of what the policy chat knows. A topic is a subject, the
 * document or stay field that answers it, the wording Jev judges it with, and
 * the phrasings the keyword fallback matches. Adding a policy is one entry
 * here plus its content.
 */

export type PolicyTopicKind = 'stay-policy' | 'house-rules' | 'roam-policy' | 'stay-fact';

export type StayFactField =
  | 'pricePerNight'
  | 'guests'
  | 'bedrooms'
  | 'beds'
  | 'baths'
  | 'amenities'
  | 'checkInTime'
  | 'checkOutTime'
  | 'petsAllowed';

export type PolicyTopic = {
  id: string;
  /** The heading for a fact answer, and the fallback name for the rest. */
  label: string;
  kind: PolicyTopicKind;
  /** The stay reference a `stay-policy` topic reads. */
  reference?: 'cancellationPolicy' | 'houseRules';
  /** The stay field a `stay-fact` topic reads. */
  field?: StayFactField;
  /** The `topic` value a `roam-policy` topic reads. */
  roamTopic?: string;
  /** The Noul Jev answers for this topic. */
  question: string;
  criteria: { true: string; false: string };
  /** Offered only when this stay can answer the topic. */
  starterQuestions: readonly string[];
  /** Words the keyword fallback matches, compared as whole words. */
  phrasings: readonly string[];
};

/** A Noul at or above this is a match. */
export const TOPIC_THRESHOLD = 0.7;
/** The suggestion is offered only while the nothing fits probability is below this. */
export const NULL_CASE_MAX_PROBABILITY = 0.3;
/** One reply carries at most this many topics. */
export const MAX_ANSWERS = 2;
/** A thread stops accepting questions here, failed turns included. */
export const MAX_TURNS = 25;
export const MAX_QUESTION_LENGTH = 300;
/** How many answered topics travel with the next question. */
export const RECENT_TOPIC_LIMIT = 3;
/** Jev has this long before the keyword fallback answers instead. */
export const JEV_TIMEOUT_MS = 2500;
export const RATE_LIMIT_MAX_QUESTIONS = 20;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export const NULL_CASE_ID = 'none-of-the-topics';

const followUpRule =
  'A follow up that names no new subject keeps the subject of the recent topics.';

function criteria(trueText: string, falseText: string) {
  return { true: `${trueText} ${followUpRule}`, false: falseText };
}

export const nullCaseQuestion =
  'Does the question ask about a subject that this stay and Roam have no text for?';

export const nullCaseCriteria = {
  true: 'The question asks about something this stay and Roam cannot answer, such as the weather, the host, or a general booking question.',
  false:
    'The question asks about cancelling, house rules, pets, a fact about this stay, or a Roam policy.',
};

export const policyTopics: readonly PolicyTopic[] = [
  {
    id: 'cancellation-policy',
    label: 'Cancellation policy',
    kind: 'stay-policy',
    reference: 'cancellationPolicy',
    question: "Does the question ask about cancelling this stay's booking or what is refunded?",
    criteria: criteria(
      'The question asks what happens to money or dates if the guest cancels or moves the booking.',
      'The question asks about something else, such as the house rules or the check in time.',
    ),
    starterQuestions: ['Can I cancel my booking?', 'What happens if I cancel late?'],
    phrasings: [
      'cancel',
      'cancelling',
      'cancellation',
      'refund',
      'refunded',
      'move dates',
      'change dates',
    ],
  },
  {
    id: 'house-rules',
    label: 'House rules',
    kind: 'house-rules',
    reference: 'houseRules',
    question: "Does the question ask about this stay's house rules?",
    criteria: criteria(
      'The question asks about what is allowed or expected inside the stay, such as smoking, parties, noise or visitors.',
      'The question asks about something else, such as cancellation or a fact about the stay.',
    ),
    starterQuestions: ['What are the house rules?'],
    phrasings: [
      'house rules',
      'house rule',
      'rules',
      'smoking',
      'smoke',
      'party',
      'parties',
      'noise',
      'quiet hours',
      'visitors',
    ],
  },
  {
    id: 'pets',
    label: 'Pets',
    kind: 'stay-fact',
    field: 'petsAllowed',
    question: 'Does the question ask whether pets are allowed at this stay?',
    criteria: criteria(
      'The question asks whether a pet, dog or cat may stay, or about bringing an animal.',
      'The question asks about something else, such as cancellation or house rules in general.',
    ),
    starterQuestions: ['Are pets allowed?'],
    phrasings: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'animal', 'animals'],
  },
  {
    id: 'price',
    label: 'Price per night',
    kind: 'stay-fact',
    field: 'pricePerNight',
    question: 'Does the question ask what this stay costs per night?',
    criteria: criteria(
      'The question asks about the nightly price, the rate or how much a night costs.',
      'The question asks about something else, such as cancellation or fees Roam charges.',
    ),
    starterQuestions: [],
    phrasings: [
      'price',
      'cost',
      'rate',
      'per night',
      'a night',
      'nightly',
      'how much',
      'expensive',
      'cheap',
    ],
  },
  {
    id: 'guests',
    label: 'Guests',
    kind: 'stay-fact',
    field: 'guests',
    question: 'Does the question ask how many guests this stay sleeps?',
    criteria: criteria(
      'The question asks how many people can stay or sleep here.',
      'The question asks about something else, such as the number of bedrooms.',
    ),
    starterQuestions: [],
    phrasings: ['guest', 'guests', 'people', 'sleeps', 'capacity', 'how many people'],
  },
  {
    id: 'bedrooms',
    label: 'Bedrooms',
    kind: 'stay-fact',
    field: 'bedrooms',
    question: 'Does the question ask how many bedrooms this stay has?',
    criteria: criteria(
      'The question asks about the number of bedrooms.',
      'The question asks about something else, such as the number of beds or baths.',
    ),
    starterQuestions: [],
    phrasings: ['bedroom', 'bedrooms'],
  },
  {
    id: 'beds',
    label: 'Beds',
    kind: 'stay-fact',
    field: 'beds',
    question: 'Does the question ask how many beds this stay has?',
    criteria: criteria(
      'The question asks about the number or kind of beds.',
      'The question asks about something else, such as the number of bedrooms.',
    ),
    starterQuestions: [],
    phrasings: ['bed', 'beds'],
  },
  {
    id: 'baths',
    label: 'Bathrooms',
    kind: 'stay-fact',
    field: 'baths',
    question: 'Does the question ask how many bathrooms this stay has?',
    criteria: criteria(
      'The question asks about bathrooms, baths or showers.',
      'The question asks about something else, such as the number of bedrooms.',
    ),
    starterQuestions: [],
    phrasings: ['bath', 'baths', 'bathroom', 'bathrooms', 'shower', 'showers'],
  },
  {
    id: 'amenities',
    label: 'Amenities',
    kind: 'stay-fact',
    field: 'amenities',
    question: 'Does the question ask which amenities this stay has, such as a hot tub or wifi?',
    criteria: criteria(
      'The question asks whether the stay has a feature such as a hot tub, pool, wifi or fireplace.',
      'The question asks about something else, such as the price or the house rules.',
    ),
    starterQuestions: [],
    phrasings: ['amenity', 'amenities', 'hot tub', 'wifi', 'internet', 'pool', 'fireplace', 'view'],
  },
  {
    id: 'check-in',
    label: 'Check in time',
    kind: 'stay-fact',
    field: 'checkInTime',
    question: 'Does the question ask what time guests can check in?',
    criteria: criteria(
      'The question asks when the guest can arrive or start the stay.',
      'The question asks about something else, such as the check out time.',
    ),
    starterQuestions: ['What time is check in?'],
    phrasings: ['check in', 'checkin', 'arrive', 'arrival', 'earliest'],
  },
  {
    id: 'check-out',
    label: 'Check out time',
    kind: 'stay-fact',
    field: 'checkOutTime',
    question: 'Does the question ask what time guests have to check out?',
    criteria: criteria(
      'The question asks when the guest has to leave or end the stay.',
      'The question asks about something else, such as the check in time.',
    ),
    starterQuestions: [],
    phrasings: ['check out', 'checkout', 'leave', 'leaving', 'departure', 'latest'],
  },
  {
    id: 'refunds-and-deposits',
    label: 'Roam refunds and deposits',
    kind: 'roam-policy',
    roamTopic: 'refunds-and-deposits',
    question: "Does the question ask about Roam's own refunds, deposits or damage charges?",
    criteria: criteria(
      'The question asks how Roam handles a deposit, a damage charge or a refund Roam decides, rather than the stay cancellation policy.',
      'The question asks about cancelling this stay, which the cancellation policy covers.',
    ),
    starterQuestions: [],
    phrasings: ['deposit', 'deposits', 'damage', 'roam refund'],
  },
  {
    id: 'identification-at-check-in',
    label: 'Identification at check in',
    kind: 'roam-policy',
    roamTopic: 'identification-at-check-in',
    question: 'Does the question ask what identification Roam requires at check in?',
    criteria: criteria(
      'The question asks about a passport, a licence or another identity document needed at check in.',
      'The question asks about the check in time, which is a fact about this stay.',
    ),
    starterQuestions: [],
    phrasings: ['identification', 'id', 'passport', 'licence', 'license', 'identity'],
  },
  {
    id: 'payment-and-fees',
    label: 'Payment and fees',
    kind: 'roam-policy',
    roamTopic: 'payment-and-fees',
    question: 'Does the question ask how payment works or which fees Roam charges?',
    criteria: criteria(
      'The question asks about paying, cards, service fees or taxes Roam charges.',
      'The question asks what the nightly price is, which is a fact about this stay.',
    ),
    starterQuestions: [],
    phrasings: ['payment', 'pay', 'card', 'fees', 'service fee', 'taxes'],
  },
];

export const policyTopicIds: readonly string[] = policyTopics.map((topic) => topic.id);

export function findPolicyTopic(id: string): PolicyTopic | undefined {
  return policyTopics.find((topic) => topic.id === id);
}

export function isKnownTopicId(id: string): boolean {
  return findPolicyTopic(id) !== undefined;
}

/** The stay text the client can see, used to hide starters a stay cannot answer. */
export type StayPolicySource = {
  cancellationPolicy: { title: string; body: string } | null;
  houseRules: { name: string; rules: readonly string[] } | null;
};

export function isStayTopicAvailable(topic: PolicyTopic, stay: StayPolicySource): boolean {
  if (topic.kind === 'stay-fact') return true;

  if (topic.reference === 'cancellationPolicy') {
    return Boolean(stay.cancellationPolicy?.body.trim());
  }

  if (topic.reference === 'houseRules') {
    return Boolean(stay.houseRules?.rules.length);
  }

  return false;
}

/**
 * One starter per answerable stay topic, in catalog order. Roam policies are
 * left out because the client has not read whether a document exists for them.
 */
export function starterQuestionsFor(
  stay: StayPolicySource,
  limit = 3,
): { topicId: string; question: string }[] {
  const starters: { topicId: string; question: string }[] = [];

  for (const topic of policyTopics) {
    if (starters.length >= limit) break;
    if (topic.kind === 'roam-policy') continue;
    if (!isStayTopicAvailable(topic, stay)) continue;

    const [question] = topic.starterQuestions;
    if (question) starters.push({ topicId: topic.id, question });
  }

  return starters;
}

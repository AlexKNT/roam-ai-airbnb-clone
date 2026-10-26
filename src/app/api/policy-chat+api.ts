import { verifyToken } from '@clerk/backend';
import { createClient, type SanityClient } from '@sanity/client';

import { buildAnswer, isAnswerable, type AnswerContext, type RoamPolicyText } from '@/chat/answers';
import { matchKeywordTopic } from '@/chat/fallback';
import { judgeQuestion } from '@/chat/jev';
import { closestTopic, selectTopics } from '@/chat/selection';
import {
  findPolicyTopic,
  MAX_QUESTION_LENGTH,
  policyTopics,
  RATE_LIMIT_MAX_QUESTIONS,
  RATE_LIMIT_WINDOW_MS,
  RECENT_TOPIC_LIMIT,
} from '@/chat/topics';

const SANITY_API_VERSION = '2025-02-19';

type StayRow = {
  pricePerNight: number;
  guests: number;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  amenities: string[] | null;
  checkInTime: string;
  checkOutTime: string;
  petsAllowed: boolean;
  cancellationPolicy: { title: string; body: string } | null;
  houseRules: { name: string; rules: string[] | null } | null;
};

const stayQuery = `*[_type == "stay" && slug.current == $slug][0]{
  pricePerNight,
  guests,
  bedrooms,
  beds,
  baths,
  "amenities": amenities,
  checkInTime,
  checkOutTime,
  petsAllowed,
  "cancellationPolicy": cancellationPolicy->{title, body},
  "houseRules": houseRules->{name, rules}
}`;

const roamPolicyQuery = `*[_type == "roamPolicy" && topic in $topics]{topic, title, body}`;

let sanity: SanityClient | null = null;

function requireSanity(): SanityClient {
  const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET?.trim();

  if (!projectId || !dataset) {
    throw new Error(
      'The policy chat route needs EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET.',
    );
  }

  sanity ??= createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    perspective: 'published',
  });

  return sanity;
}

function requireClerkSecret(): string {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error('The policy chat route needs CLERK_SECRET_KEY to verify sessions.');
  }

  return secretKey;
}

/** A sliding window per guest, kept in memory. */
const questionLog = new Map<string, number[]>();

function takeQuestionAllowance(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (questionLog.get(userId) ?? []).filter((at) => at > windowStart);

  if (recent.length >= RATE_LIMIT_MAX_QUESTIONS) {
    questionLog.set(userId, recent);
    return false;
  }

  recent.push(now);
  questionLog.set(userId, recent);

  return true;
}

function unauthorized(): Response {
  return new Response(null, { status: 401 });
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

async function readUserId(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  try {
    const payload = await verifyToken(token, { secretKey: requireClerkSecret() });

    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

function readRecentTopicIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const known = value
    .filter((id): id is string => typeof id === 'string')
    .filter((id) => findPolicyTopic(id) !== undefined);

  return known.slice(-RECENT_TOPIC_LIMIT);
}

export async function POST(request: Request): Promise<Response> {
  const userId = await readUserId(request);
  if (!userId) return unauthorized();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request' }, 422);
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const staySlug = typeof input.staySlug === 'string' ? input.staySlug.trim() : '';
  const question = typeof input.question === 'string' ? input.question.trim() : '';

  if (!staySlug) return json({ error: 'invalid_request' }, 422);
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return json({ error: 'invalid_question' }, 422);
  }

  if (!takeQuestionAllowance(userId)) {
    return json({ error: 'rate_limited' }, 429);
  }
  try {
    const stay = await requireSanity().fetch<StayRow | null>(stayQuery, { slug: staySlug });
    if (!stay) return json({ error: 'stay_not_found' }, 404);

    const roamRows = await requireSanity().fetch<
      { topic: string | null; title: string; body: string }[]
    >(roamPolicyQuery, {
      topics: policyTopics
        .map((topic) => topic.roamTopic)
        .filter((topic): topic is string => Boolean(topic)),
    });

    const roamPolicies = new Map<string, RoamPolicyText>();

    for (const row of roamRows) {
      if (row.topic && row.body.trim()) {
        roamPolicies.set(row.topic, { title: row.title, body: row.body });
      }
    }

    const context: AnswerContext = {
      facts: {
        pricePerNight: stay.pricePerNight,
        guests: stay.guests,
        bedrooms: stay.bedrooms,
        beds: stay.beds,
        baths: stay.baths,
        amenities: stay.amenities ?? [],
        checkInTime: stay.checkInTime,
        checkOutTime: stay.checkOutTime,
        petsAllowed: stay.petsAllowed,
      },
      stay: {
        cancellationPolicy: stay.cancellationPolicy,
        houseRules: stay.houseRules
          ? { name: stay.houseRules.name, rules: stay.houseRules.rules ?? [] }
          : null,
      },
      roamPolicies,
    };

    const recentTopicIds = readRecentTopicIds(input.recentTopicIds);
    const recentTopics = recentTopicIds.map((id) => findPolicyTopic(id)?.label ?? id);

    let probabilities: Record<string, number>;
    let nullProbability: number;
    let degraded = false;

    try {
      ({ probabilities, nullProbability } = await judgeQuestion(question, recentTopics));
    } catch {
      degraded = true;
      const matched = matchKeywordTopic(question);
      probabilities = Object.fromEntries(
        policyTopics.map((topic) => [topic.id, topic.id === matched ? 1 : 0]),
      );
      nullProbability = matched ? 0 : 1;
    }

    const matchedTopicIds = selectTopics(probabilities);
    const answerTopics = matchedTopicIds
      .map((id) => findPolicyTopic(id))
      .filter((topic) => topic !== undefined);

    const answers = answerTopics.map((topic) => ({
      topicId: topic.id,
      ...buildAnswer(topic, context),
    }));

    const answerable = policyTopics
      .filter((topic) => isAnswerable(topic, context))
      .map((topic) => topic.id);

    return json({
      status: answers.length > 0 ? 'answered' : 'unanswered',
      answers,
      closestTopicId:
        answers.length > 0 ? null : closestTopic(probabilities, nullProbability, answerable),
      degraded,
    });
  } catch {
    return json({ error: 'policy_chat_failed' }, 500);
  }
}

import { typeSafeAi } from '@ai-sdk/typesafe-ai';
import { experimental_decide } from 'ai';

import {
  JEV_TIMEOUT_MS,
  NULL_CASE_ID,
  nullCaseCriteria,
  nullCaseQuestion,
  policyTopics,
} from './topics';

type BooleanQuestion = {
  type: 'boolean';
  instructions: string;
  criteria: { true: string; false: string };
};

export type JevJudgment = {
  probabilities: Record<string, number>;
  nullProbability: number;
};

export const JEV_MODEL_ID = 'jev-latest';

function buildQuestions(): Record<string, BooleanQuestion> {
  const questions: Record<string, BooleanQuestion> = {};

  for (const topic of policyTopics) {
    questions[topic.id] = {
      type: 'boolean',
      instructions: topic.question,
      criteria: topic.criteria,
    };
  }

  questions[NULL_CASE_ID] = {
    type: 'boolean',
    instructions: nullCaseQuestion,
    criteria: nullCaseCriteria,
  };

  return questions;
}

/**
 * One request, one Noul per topic plus the nothing fits case. Throws on
 * failure or after `JEV_TIMEOUT_MS`, so the caller can fall back.
 */
export async function judgeQuestion(
  question: string,
  recentTopics: readonly string[],
): Promise<JevJudgment> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Jev did not answer in time.'));
    }, JEV_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      experimental_decide({
        model: typeSafeAi.decisionModel(JEV_MODEL_ID),
        state: { question, recentTopics },
        questions: buildQuestions(),
        abortSignal: controller.signal,
        maxRetries: 0,
      }),
      timedOut,
    ]);

    const probabilities: Record<string, number> = {};

    for (const topic of policyTopics) {
      const answer = result.answers[topic.id];
      probabilities[topic.id] = answer?.type === 'boolean' ? answer.probability : 0;
    }

    const nullAnswer = result.answers[NULL_CASE_ID];

    return {
      probabilities,
      nullProbability: nullAnswer?.type === 'boolean' ? nullAnswer.probability : 1,
    };
  } finally {
    clearTimeout(timer);
  }
}

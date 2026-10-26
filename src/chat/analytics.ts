import { posthog, posthogLogger } from '@/config/posthog';

import type { PolicyChatStatus } from './types';

export function trackPolicyChatOpened() {
  try {
    posthog?.capture('policy_chat_opened', {});
  } catch {
    // Analytics never blocks the chat.
  }
}

/** Topic ids, counts and flags only: never the question or any word from it. */
export function trackPolicyQuestionAsked(
  topicIds: readonly string[],
  answerCount: number,
  status: PolicyChatStatus | 'failed' | 'rate-limited',
  degraded: boolean,
) {
  try {
    posthog?.capture('policy_question_asked', {
      topicIds: [...topicIds],
      answerCount,
      status,
      degraded,
    });
  } catch {
    // Analytics never blocks the chat.
  }
}

let degradedReported = false;

/** One warning per session, carrying no question text. */
export function reportPolicyChatDegraded() {
  if (degradedReported) return;

  degradedReported = true;
  posthogLogger.warn('policy_chat_degraded', { reason: 'jev_unavailable' });
}

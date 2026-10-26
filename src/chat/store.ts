import { RECENT_TOPIC_LIMIT } from './topics';
import type { ChatTurn } from './types';

/**
 * Threads live for the session only, one per guest and stay. Nothing here is
 * written to storage and the route keeps no state of its own.
 */
const threads = new Map<string, ChatTurn[]>();

function threadKey(userId: string, slug: string) {
  return `${userId}::${slug}`;
}

export function readThread(userId: string, slug: string): ChatTurn[] {
  return threads.get(threadKey(userId, slug)) ?? [];
}

export function writeThread(userId: string, slug: string, turns: ChatTurn[]): void {
  threads.set(threadKey(userId, slug), turns);
}

export function clearPolicyChatThreads(): void {
  threads.clear();
}

/** The last answered topics, newest last, for a follow up. */
export function recentTopicIds(turns: readonly ChatTurn[]): string[] {
  const ids = turns
    .filter((turn) => turn.status === 'answered')
    .flatMap((turn) => turn.answers.map((answer) => answer.topicId));

  return ids.slice(-RECENT_TOPIC_LIMIT);
}

let turnCounter = 0;

export function nextTurnId(): string {
  turnCounter += 1;

  return `turn-${turnCounter}`;
}

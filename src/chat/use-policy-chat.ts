import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  reportPolicyChatDegraded,
  trackPolicyChatOpened,
  trackPolicyQuestionAsked,
} from './analytics';
import { nextTurnId, readThread, recentTopicIds, writeThread } from './store';
import {
  MAX_QUESTION_LENGTH,
  MAX_TURNS,
  starterQuestionsFor,
  type StayPolicySource,
} from './topics';
import type { ChatTurn, PolicyChatResponse } from './types';

export type PolicyChatController = {
  turns: ChatTurn[];
  draft: string;
  sending: boolean;
  capped: boolean;
  starters: { topicId: string; question: string }[];
  setDraft: (value: string) => void;
  ask: (question?: string) => void;
  retry: (turnId: string) => void;
};

type ThreadState = { key: string; turns: ChatTurn[] };

function threadKey(userId: string, slug: string) {
  return `${userId}::${slug}`;
}

function chatEndpoint() {
  const origin = process.env.EXPO_PUBLIC_API_ORIGIN?.trim().replace(/\/+$/, '');

  return origin ? `${origin}/api/policy-chat` : '/api/policy-chat';
}

export function usePolicyChat(
  slug: string,
  stay: StayPolicySource | null,
): PolicyChatController {
  const { getToken, userId } = useAuth();
  const key = userId ? threadKey(userId, slug) : '';
  const [thread, setThread] = useState<ThreadState>({ key: '', turns: [] });
  const [draft, setDraftValue] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  // A thread belongs to one guest and one stay, and comes back when they return.
  if (thread.key !== key) {
    setThread({ key, turns: userId ? readThread(userId, slug) : [] });
  }

  const turns = useMemo(
    () => (thread.key === key ? thread.turns : userId ? readThread(userId, slug) : []),
    [key, slug, thread, userId],
  );

  useEffect(() => {
    trackPolicyChatOpened();
  }, [slug]);

  /** Reads the stored thread, so a reply that lands late still finds its turn. */
  const readCurrent = useCallback(
    () => (userId ? readThread(userId, slug) : []),
    [slug, userId],
  );

  const commit = useCallback(
    (update: (current: ChatTurn[]) => ChatTurn[]) => {
      if (!userId) return;

      const next = update(readThread(userId, slug));

      writeThread(userId, slug, next);
      setThread({ key: threadKey(userId, slug), turns: next });
    },
    [slug, userId],
  );

  const replaceTurn = useCallback(
    (turnId: string, patch: Partial<ChatTurn>) => {
      commit((current) =>
        current.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)),
      );
    },
    [commit],
  );

  const send = useCallback(
    async (turn: ChatTurn) => {
      sendingRef.current = true;
      setSending(true);

      try {
        const token = await getToken();
        if (!token) throw new Error('No session token.');

        const response = await fetch(chatEndpoint(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            staySlug: slug,
            question: turn.question,
            recentTopicIds: turn.recentTopicIds,
          }),
        });

        if (response.status === 429) {
          replaceTurn(turn.id, { status: 'blocked' });
          trackPolicyQuestionAsked([], 0, 'rate-limited', false);
          return;
        }

        if (!response.ok) throw new Error(`Policy chat answered ${response.status}.`);

        const result = (await response.json()) as PolicyChatResponse;
        const answers = result.answers ?? [];

        replaceTurn(turn.id, {
          status: 'answered',
          answers,
          closestTopicId: result.closestTopicId ?? null,
          degraded: result.degraded === true,
        });

        trackPolicyQuestionAsked(
          answers.map((answer) => answer.topicId),
          answers.length,
          result.status,
          result.degraded === true,
        );

        if (result.degraded) reportPolicyChatDegraded();
      } catch {
        replaceTurn(turn.id, { status: 'failed' });
        trackPolicyQuestionAsked([], 0, 'failed', false);
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [getToken, replaceTurn, slug],
  );

  const ask = useCallback(
    (question?: string) => {
      if (sendingRef.current) return;

      const text = (question ?? draft).trim().slice(0, MAX_QUESTION_LENGTH);
      if (!text) return;

      const current = readCurrent();
      if (current.length >= MAX_TURNS) return;

      const turn: ChatTurn = {
        id: nextTurnId(),
        question: text,
        answers: [],
        status: 'pending',
        closestTopicId: null,
        degraded: false,
        recentTopicIds: recentTopicIds(current),
      };

      commit(() => [...current, turn]);
      if (question === undefined) setDraftValue('');
      void send(turn);
    },
    [commit, draft, readCurrent, send],
  );

  const retry = useCallback(
    (turnId: string) => {
      if (sendingRef.current) return;

      const turn = readCurrent().find((candidate) => candidate.id === turnId);
      if (!turn) return;

      replaceTurn(turnId, { status: 'pending' });
      void send(turn);
    },
    [readCurrent, replaceTurn, send],
  );

  const setDraft = useCallback((value: string) => {
    setDraftValue(value.slice(0, MAX_QUESTION_LENGTH));
  }, []);

  return {
    turns,
    draft,
    sending,
    capped: turns.length >= MAX_TURNS,
    starters: stay ? starterQuestionsFor(stay) : [],
    setDraft,
    ask,
    retry,
  };
}

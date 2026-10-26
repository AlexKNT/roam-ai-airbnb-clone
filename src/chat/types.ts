export type ChatAnswer = {
  topicId: string;
  title: string;
  body: string;
  source: string;
  unavailable: boolean;
};

export type ChatTurnStatus = 'pending' | 'answered' | 'failed' | 'blocked';

export type ChatTurn = {
  id: string;
  question: string;
  answers: ChatAnswer[];
  status: ChatTurnStatus;
  closestTopicId: string | null;
  degraded: boolean;
  /** The context this question was asked with, reused on retry. */
  recentTopicIds: string[];
};

export type PolicyChatStatus = 'answered' | 'unanswered';

export type PolicyChatResponse = {
  status: PolicyChatStatus;
  answers: ChatAnswer[];
  closestTopicId: string | null;
  degraded: boolean;
};

/**
 * The Roam policy topics the chat can answer. Kept beside the schema so the
 * Studio can offer them without importing app code; a jest test compares this
 * list with the catalog in src/chat/topics.ts.
 */
export const roamPolicyTopicIds = [
  'refunds-and-deposits',
  'identification-at-check-in',
  'payment-and-fees',
] as const

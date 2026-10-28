/** A stay id arrives from the client, so it is checked before it becomes part of a document id. */
export const MAX_STAY_ID_LENGTH = 128;

export function isStayId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_STAY_ID_LENGTH &&
    !/\s/.test(value)
  );
}

/**
 * One save per guest and stay, so a repeat write lands on the same document
 * instead of adding a second one.
 */
export function savedStayId(guestId: string, stayId: string): string {
  return `savedStay.${guestId}.${stayId}`;
}

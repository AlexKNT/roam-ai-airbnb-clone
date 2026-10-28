import { isStayId, MAX_STAY_ID_LENGTH, savedStayId } from '../saved-stay-id';

describe('savedStayId', () => {
  it('builds one fixed id from the guest and the stay', () => {
    expect(savedStayId('user_123', 'stay-cabin')).toBe('savedStay.user_123.stay-cabin');
  });

  it('answers the same id every time, so a repeat save lands on one document', () => {
    expect(savedStayId('user_123', 'stay-cabin')).toBe(savedStayId('user_123', 'stay-cabin'));
  });

  it('keeps two guests apart on the same stay', () => {
    expect(savedStayId('user_a', 'stay-cabin')).not.toBe(savedStayId('user_b', 'stay-cabin'));
  });
});

describe('isStayId', () => {
  it('accepts a plain Sanity stay id', () => {
    expect(isStayId('stay-brownstone-garden-flat')).toBe(true);
  });

  it('rejects an empty value', () => {
    expect(isStayId('')).toBe(false);
  });

  it('rejects anything that is not a string', () => {
    expect(isStayId(undefined)).toBe(false);
    expect(isStayId(null)).toBe(false);
    expect(isStayId(42)).toBe(false);
    expect(isStayId({ id: 'stay-cabin' })).toBe(false);
  });

  it('rejects whitespace anywhere in the id', () => {
    expect(isStayId('stay cabin')).toBe(false);
    expect(isStayId('stay-cabin ')).toBe(false);
    expect(isStayId('\tstay-cabin')).toBe(false);
  });

  it('accepts the longest allowed id and rejects one more character', () => {
    expect(isStayId('a'.repeat(MAX_STAY_ID_LENGTH))).toBe(true);
    expect(isStayId('a'.repeat(MAX_STAY_ID_LENGTH + 1))).toBe(false);
  });
});

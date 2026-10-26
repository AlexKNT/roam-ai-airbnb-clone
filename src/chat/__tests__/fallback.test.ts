import { matchKeywordTopic } from '../fallback';

describe('matchKeywordTopic', () => {
  it('matches a clearly worded cancellation question', () => {
    expect(matchKeywordTopic('Can I cancel my booking?')).toBe('cancellation-policy');
  });

  it('matches check in and check out apart', () => {
    expect(matchKeywordTopic('What time is check in?')).toBe('check-in');
    expect(matchKeywordTopic('When do I have to check out?')).toBe('check-out');
  });

  it('matches a feature question to amenities', () => {
    expect(matchKeywordTopic('Is there a hot tub?')).toBe('amenities');
  });

  it('answers nothing when no phrasing matches', () => {
    expect(matchKeywordTopic('Why is the sky blue?')).toBeNull();
  });

  it('answers nothing when two topics match equally well', () => {
    expect(matchKeywordTopic('Can I bring my dog to the party?')).toBeNull();
  });

  it('does not read a word inside a longer word', () => {
    expect(matchKeywordTopic('The bedding looks nice')).toBeNull();
  });
});

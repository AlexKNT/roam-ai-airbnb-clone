import {
  FIRST_NAME_MAX_LENGTH,
  LAST_NAME_MAX_LENGTH,
  PLACE_MAX_LENGTH,
  toProfileSaveInput,
  validateProfileDraft,
} from '../validation';

describe('validateProfileDraft', () => {
  it('accepts a first name alone, with the last name and place left empty', () => {
    expect(validateProfileDraft({ firstName: 'Joanna', lastName: '', place: '' })).toEqual({});
  });

  it('requires a first name once whitespace is trimmed away', () => {
    expect(validateProfileDraft({ firstName: '   ', lastName: '', place: '' })).toHaveProperty(
      'firstName',
    );
  });

  it('accepts a name at the limit and rejects one character more', () => {
    const atLimit = 'a'.repeat(FIRST_NAME_MAX_LENGTH);
    const overLimit = 'a'.repeat(FIRST_NAME_MAX_LENGTH + 1);

    expect(validateProfileDraft({ firstName: atLimit, lastName: '', place: '' })).toEqual({});
    expect(validateProfileDraft({ firstName: overLimit, lastName: '', place: '' })).toHaveProperty(
      'firstName',
    );
  });

  it('counts the last name against its own limit and keeps it optional', () => {
    expect(
      validateProfileDraft({
        firstName: 'Joanna',
        lastName: 'a'.repeat(LAST_NAME_MAX_LENGTH + 1),
        place: '',
      }),
    ).toHaveProperty('lastName');
  });

  it('accepts a place at the limit and rejects a longer one', () => {
    expect(
      validateProfileDraft({ firstName: 'Joanna', lastName: '', place: 'a'.repeat(PLACE_MAX_LENGTH) }),
    ).toEqual({});
    expect(
      validateProfileDraft({
        firstName: 'Joanna',
        lastName: '',
        place: 'a'.repeat(PLACE_MAX_LENGTH + 1),
      }),
    ).toHaveProperty('place');
  });

  it('rejects a place that runs onto a second line', () => {
    expect(
      validateProfileDraft({ firstName: 'Joanna', lastName: '', place: 'San Francisco\nCA' }),
    ).toHaveProperty('place');
  });

  it('treats a whitespace only place as empty rather than as content', () => {
    expect(validateProfileDraft({ firstName: 'Joanna', lastName: '', place: '   ' })).toEqual({});
  });
});

describe('toProfileSaveInput', () => {
  it('trims every value and drops an empty place', () => {
    expect(toProfileSaveInput({ firstName: '  Joanna ', lastName: ' Smith ', place: '  ' })).toEqual({
      firstName: 'Joanna',
      lastName: 'Smith',
      place: null,
    });
  });

  it('keeps the trimmed place when the guest wrote one', () => {
    expect(
      toProfileSaveInput({ firstName: 'Joanna', lastName: '', place: '  San Francisco, CA ' }),
    ).toEqual({ firstName: 'Joanna', lastName: '', place: 'San Francisco, CA' });
  });
});

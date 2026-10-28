import { personalInfoCopy } from '@/constants/copy';

export const FIRST_NAME_MAX_LENGTH = 50;
export const LAST_NAME_MAX_LENGTH = 50;
export const PLACE_MAX_LENGTH = 60;

export type ProfileDraft = {
  firstName: string;
  lastName: string;
  place: string;
};

export type ProfileDraftErrors = Partial<Record<keyof ProfileDraft, string>>;

/**
 * A whitespace only value counts as empty, so every rule reads the trimmed
 * value. A field's message is the first rule it breaks.
 */
export function validateProfileDraft(draft: ProfileDraft): ProfileDraftErrors {
  const errors: ProfileDraftErrors = {};
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const place = draft.place.trim();

  if (firstName.length === 0) {
    errors.firstName = personalInfoCopy.firstNameRequired;
  } else if (firstName.length > FIRST_NAME_MAX_LENGTH) {
    errors.firstName = personalInfoCopy.nameTooLong;
  }

  if (lastName.length > LAST_NAME_MAX_LENGTH) {
    errors.lastName = personalInfoCopy.nameTooLong;
  }

  if (place.length > PLACE_MAX_LENGTH) {
    errors.place = personalInfoCopy.placeTooLong;
  } else if (/[\r\n]/.test(draft.place)) {
    errors.place = personalInfoCopy.placeOneLine;
  }

  return errors;
}

/** An empty place is `null`, so the caller can drop the metadata key entirely. */
export function toProfileSaveInput(draft: ProfileDraft) {
  const place = draft.place.trim();

  return {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    place: place.length > 0 ? place : null,
  };
}

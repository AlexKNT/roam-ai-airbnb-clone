import { profileCopy } from '@/constants/copy';

/** The parts of a Clerk user the profile shows, so the helpers stay testable. */
export type ClerkProfileUser = {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  unsafeMetadata: Record<string, unknown>;
};

export type ProfileIdentity = {
  name: string;
  /** Letters for the avatar when Clerk holds no photo, or null for the person icon. */
  initials: string | null;
  imageUrl: string | null;
  /** The guest's own place line, hidden when empty. */
  place: string | null;
  email: string | null;
};

function clean(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function initialsOf(...parts: (string | null)[]): string | null {
  const initials = parts
    .filter((part): part is string => part !== null)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials.length > 0 ? initials.slice(0, 2) : null;
}

/** Nowhere does this fall back to a second guest's data: every value is the session's own. */
export function profileIdentityFrom(user: ClerkProfileUser | null | undefined): ProfileIdentity {
  const firstName = clean(user?.firstName);
  const lastName = clean(user?.lastName);
  const username = clean(user?.username);
  const email = clean(user?.primaryEmailAddress?.emailAddress);
  const name = [firstName, lastName].filter(Boolean).join(' ') || username || profileCopy.nameFallback;
  const initials =
    initialsOf(firstName, lastName) ??
    (email ? initialsOf(email.split('@')[0] ?? null) : null);

  return {
    name,
    initials,
    imageUrl: clean(user?.imageUrl),
    place: clean(user?.unsafeMetadata?.place),
    email,
  };
}

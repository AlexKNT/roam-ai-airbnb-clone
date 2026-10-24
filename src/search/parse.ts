import { amenitySynonyms, amenityValues, type Amenity } from '@/constants/amenities';
import type { StayType } from '@/sanity/types';

import { resolvePlace } from './places';
import type { StaySearchFilters, StaySearchParams } from './types';

type Token = {
  lower: string;
  used: boolean;
};

/**
 * Words that carry no mood of their own, so they never reach the embeddings.
 * "such as" in the spec: the list may grow, the rule does not change.
 */
const connectives = new Set([
  'a',
  'an',
  'and',
  'any',
  'at',
  'be',
  'below',
  'buck',
  'bucks',
  'dollar',
  'dollars',
  'for',
  'from',
  'in',
  'less',
  'max',
  'maximum',
  'most',
  'near',
  'night',
  'nights',
  'of',
  'on',
  'or',
  'our',
  'per',
  'please',
  'than',
  'the',
  'to',
  'under',
  'up',
  'want',
  'with',
  'within',
  'allowed',
  'welcome',
  'friendly',
]);

const comparatives = new Set([
  'under',
  'below',
  'less',
  'than',
  'max',
  'maximum',
  'up',
  'to',
  'at',
  'most',
  'within',
]);

const guestWords = new Set([
  'guest',
  'guests',
  'people',
  'person',
  'persons',
  'adult',
  'adults',
  'traveler',
  'travelers',
  'traveller',
  'travellers',
]);

const petWords = new Set(['pet', 'pets', 'dog', 'dogs', 'puppy', 'cat', 'cats']);

const negationWords = new Set(['no', 'without', 'never', 'not']);

const placeIntros = new Set(['in', 'near', 'around']);

const typeSynonyms: Record<StayType, readonly string[]> = {
  cabin: ['log cabin', 'cabin', 'cabins', 'chalet', 'chalets'],
  beach: ['beach house', 'beachfront', 'beaches', 'beach', 'seaside', 'coastal'],
  city: ['downtown', 'apartment', 'apartments', 'cities', 'urban', 'city', 'loft'],
  villa: ['villa', 'villas', 'mansion', 'mansions'],
};

type Phrase = { value: string; words: string[] };

function toPhrases(entries: [string, readonly string[]][]): Phrase[] {
  return entries
    .flatMap(([value, synonyms]) => synonyms.map((synonym) => ({ value, words: synonym.split(' ') })))
    .sort((left, right) => right.words.length - left.words.length);
}

const amenityPhrases = toPhrases(
  amenityValues.map((value) => [value, amenitySynonyms[value]] as [string, readonly string[]]),
);

const typePhrases = toPhrases(
  Object.entries(typeSynonyms) as [string, readonly string[]][],
);

function tokenize(sentence: string): Token[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9$\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((lower) => ({ lower, used: false }));
}

function markUsed(tokens: Token[], start: number, length: number) {
  for (let index = start; index < start + length && index < tokens.length; index += 1) {
    tokens[index].used = true;
  }
}

function matchesAt(tokens: Token[], start: number, words: string[]): boolean {
  if (start + words.length > tokens.length) return false;

  return words.every((word, offset) => {
    const token = tokens[start + offset];
    return !token.used && token.lower === word;
  });
}

function nextUnused(tokens: Token[], start: number): number | null {
  for (let index = start + 1; index < tokens.length; index += 1) {
    if (!tokens[index].used) return index;
  }

  return null;
}

function previousUnused(tokens: Token[], start: number): number | null {
  for (let index = start - 1; index >= 0; index -= 1) {
    if (!tokens[index].used) return index;
  }

  return null;
}

function amountOf(token: Token): { value: number; signed: boolean } | null {
  const signed = token.lower.includes('$');
  const digits = token.lower.replace(/[$,]/g, '');

  if (!/^\d{1,7}$/.test(digits)) return null;

  return { value: Number(digits), signed };
}

function knownPhraseLengthAt(tokens: Token[], start: number): number {
  const phrases = [...amenityPhrases, ...typePhrases];
  let longest = 0;

  for (const phrase of phrases) {
    if (matchesAt(tokens, start, phrase.words)) {
      longest = Math.max(longest, phrase.words.length);
    }
  }

  if (longest === 0 && !tokens[start].used && petWords.has(tokens[start].lower)) {
    return 1;
  }

  return longest;
}

/** "no pets", "without a pool": read as words to drop, never inverted. */
function consumeNegations(tokens: Token[]) {
  tokens.forEach((token, index) => {
    if (token.used || !negationWords.has(token.lower)) return;

    const next = nextUnused(tokens, index);
    if (next === null) return;

    const length = knownPhraseLengthAt(tokens, next);
    if (length === 0) return;

    token.used = true;
    markUsed(tokens, next, length);
  });
}

function readNumbers(tokens: Token[], filters: StaySearchFilters) {
  let maxPrice: number | undefined;
  let minGuests: number | undefined;

  tokens.forEach((token, index) => {
    if (token.used) return;

    const amount = amountOf(token);
    if (!amount) return;

    const after = nextUnused(tokens, index);
    const before = previousUnused(tokens, index);
    const beforeWord = before === null ? null : tokens[before].lower;

    const readsAsGuests =
      (after !== null && guestWords.has(tokens[after].lower)) ||
      (beforeWord === 'for' && !amount.signed && amount.value <= 20);

    if (readsAsGuests) {
      minGuests ??= amount.value;
      token.used = true;
      if (after !== null && guestWords.has(tokens[after].lower)) tokens[after].used = true;
      if (beforeWord === 'for' && before !== null) tokens[before].used = true;
      return;
    }

    maxPrice ??= amount.value;
    token.used = true;
    if (beforeWord !== null && comparatives.has(beforeWord) && before !== null) {
      tokens[before].used = true;
    }
  });

  if (maxPrice !== undefined) filters.maxPrice = maxPrice;
  if (minGuests !== undefined) filters.minGuests = minGuests;
}

function readGuestWords(tokens: Token[], filters: StaySearchFilters) {
  tokens.forEach((token, index) => {
    if (token.used || filters.minGuests !== undefined) return;

    if (token.lower === 'couple') {
      filters.minGuests = 2;
      token.used = true;
      return;
    }

    if (token.lower === 'solo') {
      filters.minGuests = 1;
      token.used = true;
      return;
    }

    if (token.lower === 'few') {
      const before = previousUnused(tokens, index);
      if (before === null || tokens[before].lower !== 'a') return;

      filters.minGuests = 3;
      token.used = true;
      tokens[before].used = true;
    }
  });
}

function readAmenities(tokens: Token[], filters: StaySearchFilters) {
  const found = new Set<Amenity>(filters.amenities ?? []);

  tokens.forEach((token, index) => {
    if (token.used) return;

    const phrase = amenityPhrases.find((entry) => matchesAt(tokens, index, entry.words));
    if (!phrase) return;

    found.add(phrase.value as Amenity);
    markUsed(tokens, index, phrase.words.length);
  });

  if (found.size > 0) filters.amenities = [...found];
}

function readPets(tokens: Token[], filters: StaySearchFilters) {
  tokens.forEach((token) => {
    if (token.used || !petWords.has(token.lower)) return;

    filters.petsOnly = true;
    token.used = true;
  });
}

function readType(tokens: Token[], filters: StaySearchFilters) {
  tokens.forEach((token, index) => {
    if (token.used) return;

    const phrase = typePhrases.find((entry) => matchesAt(tokens, index, entry.words));
    if (!phrase) return;

    filters.type ??= phrase.value as StayType;
    markUsed(tokens, index, phrase.words.length);
  });
}

function readPlace(tokens: Token[], filters: StaySearchFilters) {
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].used || !placeIntros.has(tokens[index].lower)) continue;

    const words: string[] = [];
    let cursor = index + 1;

    while (cursor < tokens.length && words.length < 3) {
      const token = tokens[cursor];
      if (token.used || !/^[a-z]+$/.test(token.lower)) break;
      if (token.lower === 'the' && words.length === 0) {
        cursor += 1;
        continue;
      }
      if (connectives.has(token.lower)) break;

      words.push(token.lower);
      cursor += 1;
    }

    if (words.length === 0) continue;

    filters.place = resolvePlace(words.join(' '));
    tokens[index].used = true;
    for (let taken = index + 1; taken < cursor; taken += 1) {
      tokens[taken].used = true;
    }
    return;
  }
}

function softTextOf(tokens: Token[]): string | null {
  const words = tokens
    .filter((token) => !token.used && !connectives.has(token.lower) && !/^\d+$/.test(token.lower))
    .map((token) => token.lower);

  const text = words.join(' ').trim();

  return text.length > 0 ? text : null;
}

/**
 * Reads one sentence into hard filters plus the mood text left over. It never
 * throws: a sentence it cannot read yields empty filters, every time.
 */
export function parseStayQuery(sentence: string): StaySearchParams {
  const tokens = tokenize(sentence);
  const filters: StaySearchFilters = {};

  try {
    consumeNegations(tokens);
    readNumbers(tokens, filters);
    readGuestWords(tokens, filters);
    readAmenities(tokens, filters);
    readPets(tokens, filters);
    readType(tokens, filters);
    readPlace(tokens, filters);
  } catch {
    return { filters: {}, softText: softTextOf(tokens) };
  }

  return { filters, softText: softTextOf(tokens) };
}

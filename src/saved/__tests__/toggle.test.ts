import {
  emptySavedStays,
  savedStaysReducer,
  withSave,
  type SavedStaysState,
} from '../toggle';

const ready: SavedStaysState = {
  guestId: 'user_123',
  status: 'ready',
  stayIds: ['stay-cabin', 'stay-beach'],
  inFlight: [],
  hasMore: false,
};

describe('withSave', () => {
  it('adds a new save to the front, the newest first', () => {
    expect(withSave(ready.stayIds, 'stay-city', true)).toEqual([
      'stay-city',
      'stay-cabin',
      'stay-beach',
    ]);
  });

  it('removes a save', () => {
    expect(withSave(ready.stayIds, 'stay-cabin', false)).toEqual(['stay-beach']);
  });

  it('keeps the list as it is when it already matches', () => {
    expect(withSave(ready.stayIds, 'stay-cabin', true)).toBe(ready.stayIds);
  });
});

describe('savedStaysReducer toggling', () => {
  it('flips the heart on the tap, before the write answers', () => {
    const next = savedStaysReducer(ready, { type: 'toggleStarted', stayId: 'stay-city' });

    expect(next.stayIds).toEqual(['stay-city', 'stay-cabin', 'stay-beach']);
    expect(next.inFlight).toEqual(['stay-city']);
  });

  it('unsaves on the tap when the stay is already saved', () => {
    const next = savedStaysReducer(ready, { type: 'toggleStarted', stayId: 'stay-cabin' });

    expect(next.stayIds).toEqual(['stay-beach']);
  });

  it('does nothing for a second tap while the write is still in flight', () => {
    const pending = savedStaysReducer(ready, { type: 'toggleStarted', stayId: 'stay-city' });
    const again = savedStaysReducer(pending, { type: 'toggleStarted', stayId: 'stay-city' });

    expect(again).toBe(pending);
    expect(again.stayIds).toEqual(['stay-city', 'stay-cabin', 'stay-beach']);
    expect(again.inFlight).toEqual(['stay-city']);
  });

  it('flips the heart back when the write fails', () => {
    const pending = savedStaysReducer(ready, { type: 'toggleStarted', stayId: 'stay-city' });
    const failed = savedStaysReducer(pending, {
      type: 'toggleFailed',
      stayId: 'stay-city',
      wasSaved: false,
    });

    expect(failed.stayIds).toEqual(['stay-cabin', 'stay-beach']);
    expect(failed.inFlight).toEqual([]);
  });

  it('restores an unsaved stay when its delete fails', () => {
    const pending = savedStaysReducer(ready, { type: 'toggleStarted', stayId: 'stay-cabin' });
    const failed = savedStaysReducer(pending, {
      type: 'toggleFailed',
      stayId: 'stay-cabin',
      wasSaved: true,
    });

    expect(failed.stayIds).toEqual(['stay-cabin', 'stay-beach']);
    expect(failed.inFlight).toEqual([]);
  });

  it('leaves the save in place and the guard open once the write lands', () => {
    const pending = savedStaysReducer(ready, { type: 'toggleStarted', stayId: 'stay-city' });
    const done = savedStaysReducer(pending, { type: 'toggleSucceeded', stayId: 'stay-city' });

    expect(done.stayIds).toEqual(['stay-city', 'stay-cabin', 'stay-beach']);
    expect(done.inFlight).toEqual([]);
  });

  it('answers a third tap only after the second write finished', () => {
    const first = savedStaysReducer(ready, { type: 'toggleStarted', stayId: 'stay-city' });
    const blocked = savedStaysReducer(first, { type: 'toggleStarted', stayId: 'stay-city' });
    const settled = savedStaysReducer(blocked, { type: 'toggleSucceeded', stayId: 'stay-city' });
    const second = savedStaysReducer(settled, { type: 'toggleStarted', stayId: 'stay-city' });

    expect(second.stayIds).toEqual(['stay-cabin', 'stay-beach']);
  });
});

describe('savedStaysReducer loading and session', () => {
  it('holds the ids the read returned', () => {
    const next = savedStaysReducer(emptySavedStays, {
      type: 'loadSucceeded',
      guestId: 'user_123',
      stayIds: ['stay-cabin'],
      hasMore: true,
    });

    expect(next.status).toBe('ready');
    expect(next.stayIds).toEqual(['stay-cabin']);
    expect(next.hasMore).toBe(true);
  });

  it('leaves every heart unsaved when the read fails', () => {
    const next = savedStaysReducer(emptySavedStays, {
      type: 'loadFailed',
      guestId: 'user_123',
    });

    expect(next.status).toBe('error');
    expect(next.stayIds).toEqual([]);
  });

  it('empties the list on sign out', () => {
    expect(savedStaysReducer(ready, { type: 'signedOut' })).toEqual(emptySavedStays);
  });

  it('does not restart a load that is already running for the same guest', () => {
    const loading = savedStaysReducer(emptySavedStays, {
      type: 'loadStarted',
      guestId: 'user_123',
    });

    expect(savedStaysReducer(loading, { type: 'loadStarted', guestId: 'user_123' })).toBe(loading);
  });
});

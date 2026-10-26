import { closestTopic, selectTopics } from '../selection';

describe('selectTopics', () => {
  it('keeps topics at or above the threshold, strongest first, up to two', () => {
    expect(
      selectTopics({
        'cancellation-policy': 0.9,
        'house-rules': 0.75,
        pets: 0.71,
        price: 0.69,
      }),
    ).toEqual(['cancellation-policy', 'house-rules']);
  });

  it('breaks a tie by catalog order', () => {
    expect(selectTopics({ pets: 0.8, 'house-rules': 0.8 })).toEqual([
      'house-rules',
      'pets',
    ]);
  });

  it('answers nothing when every topic sits below the threshold', () => {
    expect(selectTopics({ price: 0.4, pets: 0.69 })).toEqual([]);
  });

  it('discards ids that are not in the catalog', () => {
    expect(selectTopics({ weather: 0.99, pets: 0.8 })).toEqual(['pets']);
  });
});

describe('closestTopic', () => {
  it('offers the strongest answerable topic while the null case is low', () => {
    expect(closestTopic({ price: 0.4, pets: 0.2 }, 0.1, ['price', 'pets'])).toBe('price');
  });

  it('offers nothing when the null case is high', () => {
    expect(closestTopic({ price: 0.9 }, 0.3, ['price'])).toBeNull();
  });

  it('offers nothing when the strongest topic cannot be answered here', () => {
    expect(closestTopic({ price: 0.9, pets: 0.1 }, 0.1, ['pets'])).toBe('pets');
    expect(closestTopic({ price: 0.9 }, 0.1, ['pets'])).toBeNull();
  });
});

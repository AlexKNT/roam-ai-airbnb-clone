import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui/chip';
import type { SearchChip } from '@/search/chips';
import { layout, spacing } from '@/theme';

export type SearchChipsProps = {
  chips: SearchChip[];
  onRemove: (chip: SearchChip) => void;
};

/** The applied constraints, each one a tap away from being removed. */
export function SearchChips({ chips, onRemove }: SearchChipsProps) {
  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} selected onPress={() => onRemove(chip)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    marginHorizontal: -layout.screenGutter,
  },
  row: {
    gap: spacing[2],
    paddingHorizontal: layout.screenGutter,
  },
});

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { searchCopy, searchSortOptions } from '@/constants/copy';
import type { SearchSort } from '@/search/types';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

export type SortMenuProps = {
  value: SearchSort;
  onChange: (sort: SearchSort) => void;
};

export function SortMenu({ value, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const current = searchSortOptions.find((option) => option.value === value) ?? searchSortOptions[0];

  const choose = (next: SearchSort) => {
    setOpen(false);
    if (next !== value) onChange(next);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${searchCopy.sortPrefix} ${current.label}. ${searchCopy.sortLabel}`}
        onPress={() => setOpen(true)}
        hitSlop={spacing[2]}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        <AppText variant="caption" color="textSecondary">
          {searchCopy.sortPrefix}
        </AppText>
        <AppText variant="button">{current.label}</AppText>
        <Icon name="chevron-down" size="sm" color={color.textPrimary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <View style={styles.scrim}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={searchCopy.sortCloseLabel}
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />

          <View accessibilityViewIsModal style={styles.card}>
            <AppText variant="subheading">{searchCopy.sortMenuLabel}</AppText>

            {searchSortOptions.map((option) => {
              const selected = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => choose(option.value)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                  <AppText variant={selected ? 'button' : 'body'}>{option.label}</AppText>
                  {selected ? (
                    <Icon name="checkmark" size={iconSize.sm} color={color.textPrimary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenGutter,
    backgroundColor: color.scrim,
  },
  card: {
    width: '100%',
    maxWidth: layout.formMaxWidth,
    gap: spacing[1],
    padding: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  option: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
});

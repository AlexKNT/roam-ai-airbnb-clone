import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { stayDetailCopy } from '@/constants/copy';
import { color, layout, spacing } from '@/theme';
import { formatPrice } from '@/utils/format';

/** Height the bar takes from the bottom of the display, so the scroll can stay clear of it. */
export function stayBookingBarSpace(insetBottom: number) {
  return layout.controlHeight + spacing[4] * 3 + insetBottom;
}

export type StayBookingBarProps = {
  pricePerNight: number;
  onBook: () => void;
};

export function StayBookingBar({ pricePerNight, onBook }: StayBookingBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing[4] }]}>
      <View style={styles.price}>
        <AppText variant="heading">{formatPrice(pricePerNight)}</AppText>
        <AppText variant="caption" color="textSecondary">
          {stayDetailCopy.perNight}
        </AppText>
      </View>

      <Button label={stayDetailCopy.book} onPress={onBook} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingTop: spacing[4],
    paddingHorizontal: layout.screenGutter,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  price: {
    flexShrink: 0,
  },
  action: {
    flex: 1,
  },
});

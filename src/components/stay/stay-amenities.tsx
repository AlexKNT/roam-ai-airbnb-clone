import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { amenityIconFor } from '@/constants/amenities';
import { stayDetailCopy } from '@/constants/copy';
import { color, iconSize, spacing } from '@/theme';

export type StayAmenitiesProps = {
  labels: readonly string[];
};

export function StayAmenities({ labels }: StayAmenitiesProps) {
  if (labels.length === 0) return null;

  return (
    <View
      accessible
      accessibilityLabel={`${stayDetailCopy.amenities}: ${labels.join(', ')}`}
      style={styles.row}>
      {labels.map((label) => (
        <View key={label} style={styles.item}>
          <Icon
            name={amenityIconFor(label) ?? 'sparkles-outline'}
            size={iconSize.md}
            color={color.textPrimary}
          />
          <AppText variant="caption" align="center" numberOfLines={2}>
            {label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
});

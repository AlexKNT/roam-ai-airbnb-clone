import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { stayDetailCopy } from '@/constants/copy';
import { color, iconSize, layout, radius, spacing } from '@/theme';

export type StayRatingProps = {
  rating: number;
  reviewCount: number;
  style?: StyleProp<ViewStyle>;
};

export function StayRating({ rating, reviewCount, style }: StayRatingProps) {
  return (
    <View
      accessible
      accessibilityLabel={stayDetailCopy.rating(rating, reviewCount)}
      style={[styles.box, style]}>
      <View style={styles.score}>
        <Icon name="star" size={iconSize.sm} color={color.primary} />
        <AppText variant="subheading">{rating.toFixed(1)}</AppText>
      </View>
      <AppText variant="caption" color="textSecondary">
        {`(${reviewCount})`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: layout.ratingBoxWidth,
    height: layout.ratingBoxHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    borderRadius: radius.md,
    backgroundColor: color.surfaceGray,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});

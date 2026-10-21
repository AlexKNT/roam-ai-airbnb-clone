import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { Tag } from '@/components/ui/tag';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

export type ListingCardLayout = 'hero' | 'row';

export type ListingCardProps = {
  image: string;
  title: string;
  place: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  amenities?: readonly string[];
  saved?: boolean;
  onPress?: () => void;
  layout?: ListingCardLayout;
  style?: StyleProp<ViewStyle>;
};

const amenityIcons: Record<string, AppIconName> = {
  wifi: 'wifi',
  'hot tub': 'bathtub-outline',
  'pet friendly': 'paw',
  fireplace: 'fire',
  mountain: 'image-filter-hdr',
  beach: 'waves',
  pool: 'pool',
};

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function ListingCard({
  image,
  title,
  place,
  rating,
  reviewCount,
  pricePerNight,
  amenities = [],
  saved = false,
  onPress,
  layout = 'hero',
  style,
}: ListingCardProps) {
  const row = layout === 'row';
  const price = priceFormatter.format(pricePerNight);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${place}, ${price} per night`}
      accessibilityState={{ selected: saved }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        row && styles.cardRow,
        pressed && styles.pressed,
        style,
      ]}>
      <View style={row ? styles.imageBoxRow : styles.imageBox}>
        <Image
          source={{ uri: image }}
          style={row ? styles.imageRow : styles.image}
          contentFit="cover"
          transition={150}
          accessibilityLabel={title}
        />
        <View style={styles.savedBadge}>
          <Icon
            name={saved ? 'heart' : 'heart-outline'}
            size={iconSize.sm}
            color={saved ? color.dangerInk : color.textPrimary}
          />
        </View>
      </View>

      <View style={row ? styles.contentRow : styles.content}>
        <AppText variant="button" numberOfLines={2}>
          {title}
        </AppText>

        <View style={styles.metaRow}>
          <Icon name="location-outline" size={iconSize.sm} color={color.textSecondary} />
          <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.flex}>
            {place}
          </AppText>
        </View>

        <View style={styles.metaRow}>
          <Icon name="star" size={iconSize.sm} color={color.primary} />
          <AppText variant="caption" color="textSecondary">
            {`${rating.toFixed(1)} (${reviewCount})`}
          </AppText>
        </View>

        {amenities.length > 0 ? (
          <View style={styles.amenities}>
            {amenities.map((amenity) => (
              <Tag key={amenity} label={amenity} icon={amenityIcons[amenity.toLowerCase()]} />
            ))}
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <AppText variant="button">{price}</AppText>
          <AppText variant="caption" color="textSecondary">
            / night
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.xl,
    padding: spacing[3],
    gap: spacing[3],
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing[4],
    padding: spacing[4],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  imageBox: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  imageBoxRow: {
    width: layout.cardThumb,
    height: layout.cardThumb,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  imageRow: {
    width: '100%',
    height: '100%',
  },
  savedBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[2],
  },
  contentRow: {
    flex: 1,
    gap: spacing[2],
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  flex: {
    flexShrink: 1,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    marginTop: spacing[1],
  },
});

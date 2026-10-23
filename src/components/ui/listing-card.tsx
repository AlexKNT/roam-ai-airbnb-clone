import { Image } from 'expo-image';
import { useId } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Tag } from '@/components/ui/tag';
import { amenityIconFor } from '@/constants/amenities';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';
import { formatPrice } from '@/utils/format';

export type ListingCardLayout = 'hero' | 'row';

export type ListingCardProps = {
  /** `null` when the stay has no resolvable cover image, which renders a placeholder. */
  image?: string | null;
  imageAlt?: string;
  title: string;
  place: string;
  rating: number;
  reviewCount?: number;
  pricePerNight?: number;
  amenities?: readonly string[];
  saved?: boolean;
  onPress?: () => void;
  layout?: ListingCardLayout;
  style?: StyleProp<ViewStyle>;
};

const absoluteFill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

function PhotoScrim() {
  const gradientId = useId().replace(/:/g, '');
  const fill = `url(#${gradientId})`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.35" stopColor={color.darkInk} stopOpacity={0} />
            <Stop offset="1" stopColor={color.darkInk} stopOpacity={0.6} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={fill} />
      </Svg>
    </View>
  );
}

function ImageFallback({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.imageFallback, style]}>
      <Icon name="image-outline" size={iconSize.md} color={color.textSecondary} />
      <AppText variant="caption" color="textSecondary" numberOfLines={2} align="center">
        {label}
      </AppText>
    </View>
  );
}

export function ListingCard({
  image,
  imageAlt,
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
  const alt = imageAlt ?? title;
  const ratingLabel =
    reviewCount === undefined ? rating.toFixed(1) : `${rating.toFixed(1)} (${reviewCount})`;

  if (!row) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${place}, rated ${rating.toFixed(1)}`}
        onPress={onPress}
        style={({ pressed }) => [styles.hero, pressed && styles.pressed, style]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={150}
            accessibilityLabel={alt}
          />
        ) : (
          <ImageFallback label={alt} style={styles.heroFallback} />
        )}

        {image ? <PhotoScrim /> : null}

        <View style={styles.ratingBadge}>
          <Icon name="star" size={iconSize.sm} color={color.primary} />
          <AppText variant="caption">{rating.toFixed(1)}</AppText>
        </View>

        <View style={styles.heroCopy}>
          <View style={styles.metaRow}>
            <Icon name="location-outline" size={iconSize.sm} color={color.surface} />
            <AppText variant="caption" numberOfLines={1} style={styles.onPhoto}>
              {place}
            </AppText>
          </View>
          <AppText variant="heading" numberOfLines={2} style={styles.onPhoto}>
            {title}
          </AppText>
        </View>

        <View style={styles.heroAction}>
          <Icon name="arrow-top-right" size={iconSize.md} color={color.textPrimary} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${place}${pricePerNight === undefined ? '' : `, ${formatPrice(pricePerNight)} per night`}`}
      accessibilityState={{ selected: saved }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      <View style={styles.imageBoxRow}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.imageRow}
            contentFit="cover"
            transition={150}
            accessibilityLabel={alt}
          />
        ) : (
          <ImageFallback label={alt} style={styles.imageRow} />
        )}
        <View style={styles.savedBadge}>
          <Icon
            name={saved ? 'heart' : 'heart-outline'}
            size={iconSize.sm}
            color={saved ? color.dangerInk : color.textPrimary}
          />
        </View>
      </View>

      <View style={styles.contentRow}>
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
            {ratingLabel}
          </AppText>
        </View>

        {amenities.length > 0 ? (
          <View style={styles.amenities}>
            {amenities.map((amenity) => (
              <Tag key={amenity} label={amenity} icon={amenityIconFor(amenity)} />
            ))}
          </View>
        ) : null}

        {pricePerNight === undefined ? null : (
          <View style={styles.priceRow}>
            <AppText variant="button">{formatPrice(pricePerNight)}</AppText>
            <AppText variant="caption" color="textSecondary">
              / night
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    aspectRatio: layout.heroCardAspect,
    justifyContent: 'flex-end',
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: color.surfaceGray,
  },
  heroImage: {
    ...absoluteFill,
  },
  heroFallback: {
    ...absoluteFill,
    borderRadius: radius.xl,
  },
  heroCopy: {
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingRight: layout.heroCardAction + spacing[6],
  },
  onPhoto: {
    color: color.surface,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    height: layout.ratingBadgeHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: color.surface,
  },
  heroAction: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[4],
    width: layout.heroCardAction,
    height: layout.heroCardAction,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.xl,
    padding: spacing[3],
    gap: spacing[3],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  imageBoxRow: {
    width: layout.cardThumb,
    height: layout.cardThumb,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  imageRow: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: color.surfaceGray,
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

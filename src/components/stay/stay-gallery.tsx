import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { stayDetailCopy } from '@/constants/copy';
import type { StayImage } from '@/sanity/types';
import { color, elevation, iconSize, layout, radius, spacing } from '@/theme';

export type StayGalleryProps = {
  images: readonly StayImage[];
  fallback?: StayImage | null;
  name: string;
  /** Zero based page the guest is looking at. */
  position: number;
  onPositionChange: (position: number) => void;
  onBack: () => void;
  onShare: () => void;
  onSave: () => void;
};

export function StayGallery({
  images,
  fallback,
  name,
  position,
  onPositionChange,
  onBack,
  onShare,
  onSave,
}: StayGalleryProps) {
  const insets = useSafeAreaInsets();
  // Width is measured so one page is exactly one screen wide, which paging needs.
  const [width, setWidth] = useState(0);
  const pages = images.length > 0 ? images : fallback ? [fallback] : [];
  const height = width / layout.galleryAspect;

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next > 0 && next !== width) setWidth(next);
      }}>
      {pages.length > 0 && width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const page = Math.round(event.nativeEvent.contentOffset.x / width);
            onPositionChange(Math.min(Math.max(page, 0), pages.length - 1));
          }}
          scrollEventThrottle={16}>
          {pages.map((image, index) =>
            image.url ? (
              <Image
                key={`${image.url}-${index}`}
                source={{ uri: image.url }}
                style={{ width, height }}
                contentFit="cover"
                transition={150}
                accessibilityLabel={image.alt || stayDetailCopy.galleryImage(name, index + 1)}
              />
            ) : (
              <View key={`empty-${index}`} style={[styles.fallback, { width, height }]}>
                <Icon name="image-outline" size={iconSize.lg} color={color.textSecondary} />
                <AppText variant="caption" color="textSecondary" align="center">
                  {image.alt || stayDetailCopy.galleryImage(name, index + 1)}
                </AppText>
              </View>
            ),
          )}
        </ScrollView>
      ) : (
        <View style={styles.fallback}>
          <Icon name="image-outline" size={iconSize.lg} color={color.textSecondary} />
          <AppText variant="caption" color="textSecondary" align="center">
            {name}
          </AppText>
        </View>
      )}

      <View style={[styles.topRow, { top: insets.top + spacing[2] }]} pointerEvents="box-none">
        <IconButton
          icon="arrow-back"
          label={stayDetailCopy.back}
          size={layout.galleryAction}
          onPress={onBack}
          style={styles.action}
        />
        <View style={styles.actions}>
          <IconButton
            icon="tray-arrow-up"
            label={stayDetailCopy.share}
            size={layout.galleryAction}
            onPress={onShare}
            style={styles.action}
          />
          <IconButton
            icon="heart-outline"
            label={stayDetailCopy.save}
            size={layout.galleryAction}
            onPress={onSave}
            style={styles.action}
          />
        </View>
      </View>

      {pages.length > 0 ? (
        <View style={styles.counter}>
          <AppText variant="label" style={styles.counterText}>
            {`${Math.min(position + 1, pages.length)} / ${pages.length}`}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    aspectRatio: layout.galleryAspect,
    overflow: 'hidden',
    backgroundColor: color.surfaceGray,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[6],
    backgroundColor: color.surfaceGray,
  },
  topRow: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  action: {
    backgroundColor: color.surface,
    ...elevation.floating,
  },
  counter: {
    position: 'absolute',
    right: spacing[4],
    bottom: radius.xl + spacing[3],
    height: layout.ratingBadgeHeight,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: color.scrim,
  },
  counterText: {
    color: color.surface,
  },
});

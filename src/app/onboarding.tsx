import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Logo } from '@/components/ui/logo';
import { posthogLogger } from '@/config/posthog';
import { onboardingCopy } from '@/constants/copy';
import { useOnboardingSeen } from '@/onboarding/use-onboarding-seen';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

const slides = onboardingCopy.slides;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();
  const { seen, markSeen } = useOnboardingSeen();
  const [index, setIndex] = useState(0);
  // Pages are exactly one slide wide, so the width is measured rather than assumed.
  const [size, setSize] = useState({ width: 0, height: 0 });
  const showing = isLoaded && seen === false && !isSignedIn;

  useEffect(() => {
    if (showing) posthogLogger.info('onboarding_screen_displayed', { screen: 'onboarding' });
  }, [showing]);

  if (!isLoaded || seen === null) return null;
  if (isSignedIn) return <Redirect href="/" />;
  if (seen) return <Redirect href="/sign-in" />;

  const slide = slides[index];

  return (
    <View style={styles.root}>
      <View
        style={styles.hero}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          if (width !== size.width || height !== size.height) setSize({ width, height });
        }}>
        {size.width > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const page = Math.round(event.nativeEvent.contentOffset.x / size.width);
              const next = Math.min(Math.max(page, 0), slides.length - 1);
              if (next !== index) setIndex(next);
            }}
            scrollEventThrottle={16}>
            {slides.map((item) => (
              <Image
                key={item.id}
                source={{ uri: item.photo }}
                style={{ width: size.width, height: size.height }}
                contentFit="cover"
                transition={150}
                alt=""
                accessible={false}
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.pin}>
          <Icon name="location" size={iconSize.sm} color={color.surface} />
          <AppText variant="caption" style={styles.pinText}>
            {slide.place}
          </AppText>
        </View>
      </View>

      <View
        style={[styles.topBar, { paddingTop: insets.top + spacing[2] }]}
        pointerEvents="box-none">
        <Logo size={48} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={onboardingCopy.skip}
          onPress={() => void markSeen()}
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
          <AppText variant="subheading">{onboardingCopy.skip}</AppText>
        </Pressable>
      </View>

      <View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}>
        <View
          style={styles.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={onboardingCopy.slideProgress}
          accessibilityValue={{ min: 1, max: slides.length, now: index + 1 }}>
          {slides.map((item, position) => (
            <View
              key={item.id}
              style={[styles.dot, position === index && styles.dotActive]}
            />
          ))}
        </View>

        <AppText variant="heading" accessibilityRole="header">
          {slide.title}
        </AppText>
        <AppText variant="body" color="textSecondary" style={styles.body}>
          {slide.body}
        </AppText>

        <Button
          label={onboardingCopy.start}
          icon="arrow-forward"
          onPress={() => void markSeen()}
          style={styles.start}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.surface,
  },
  hero: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: color.surfaceGray,
  },
  pin: {
    position: 'absolute',
    left: spacing[5],
    bottom: layout.onboardingSheetRadius + spacing[4],
    height: layout.onboardingPinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: color.scrim,
  },
  pinText: {
    color: color.surface,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: layout.screenGutter,
    right: layout.screenGutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    height: layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    borderRadius: radius.pill,
    backgroundColor: color.glass,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  sheet: {
    marginTop: -layout.onboardingSheetRadius,
    paddingTop: spacing[8],
    paddingHorizontal: layout.screenGutter,
    borderTopLeftRadius: layout.onboardingSheetRadius,
    backgroundColor: color.surface,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.touchTarget,
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  dot: {
    width: layout.onboardingDot,
    height: layout.onboardingDot,
    borderRadius: radius.pill,
    backgroundColor: color.border,
  },
  dotActive: {
    width: layout.onboardingDotActive,
    backgroundColor: color.lavender,
  },
  body: {
    marginTop: spacing[3],
  },
  start: {
    marginTop: spacing[8],
  },
});

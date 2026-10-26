import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StayAmenities } from '@/components/stay/stay-amenities';
import { StayBookingBar, stayBookingBarSpace } from '@/components/stay/stay-booking-bar';
import { StayGallery } from '@/components/stay/stay-gallery';
import { StayHostRow } from '@/components/stay/stay-host-row';
import { StayRating } from '@/components/stay/stay-rating';
import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { PolicyCard } from '@/components/ui/policy-card';
import { posthogLogger } from '@/config/posthog';
import { stayCopy, stayDetailCopy } from '@/constants/copy';
import { useStay } from '@/sanity/use-stay';
import { color, iconSize, layout, radius, spacing } from '@/theme';

const amenityLimit = 4;

export default function StayScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const stay = useStay(slug);
  const insets = useSafeAreaInsets();

  const [position, setPosition] = useState(0);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [loadedSlug, setLoadedSlug] = useState(slug);

  // The route is reused when the guest opens a second stay, so its view state starts over.
  if (loadedSlug !== slug) {
    setLoadedSlug(slug);
    setPosition(0);
    setPolicyOpen(false);
    setNotice(null);
  }

  const stayId = stay.status === 'ready' ? stay.data?._id : null;

  useEffect(() => {
    if (!stayId) return;

    posthogLogger.info('stay_detail_viewed', { stayId });
  }, [stayId]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  if (stay.status !== 'ready' || !stay.data) {
    return (
      <View style={[styles.stateRoot, { paddingTop: insets.top + spacing[2] }]}>
        <IconButton icon="arrow-back" label={stayDetailCopy.back} onPress={goBack} />

        <View style={styles.stateBody}>
          {stay.status === 'loading' ? (
            <>
              <ActivityIndicator color={color.primary} />
              <AppText variant="caption" color="textSecondary">
                {stayDetailCopy.loading}
              </AppText>
            </>
          ) : null}

          {stay.status === 'error' ? (
            <>
              <Alert tone="error" message={stay.error ?? stayCopy.loadError} />
              <Button label={stayCopy.retry} onPress={stay.retry} variant="secondary" />
            </>
          ) : null}

          {stay.status === 'notFound' ? (
            <>
              <AppText variant="heading">{stayCopy.notFoundTitle}</AppText>
              <AppText variant="body" color="textSecondary">
                {stayCopy.notFoundDescription}
              </AppText>
            </>
          ) : null}
        </View>
      </View>
    );
  }

  const detail = stay.data;
  const policy = detail.cancellationPolicy;
  const rules = detail.houseRules;

  const shareStay = async () => {
    try {
      await Share.share({
        message: stayDetailCopy.shareMessage(detail.name, detail.place),
      });
    } catch {
      // A dismissed share sheet needs no follow up.
    }
  };

  const showNotice = (title: string, message: string) => {
    setNotice({ title, message });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: stayBookingBarSpace(insets.bottom) + spacing[3] }}>
        <StayGallery
          images={detail.gallery}
          fallback={detail.coverImage}
          name={detail.name}
          position={position}
          onPositionChange={setPosition}
          onBack={goBack}
          onShare={shareStay}
          onSave={() => showNotice(stayDetailCopy.saveNoticeTitle, stayDetailCopy.saveNotice)}
        />

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <AppText variant="heading" style={styles.title}>
              {detail.name}
            </AppText>
            <StayRating rating={detail.rating} reviewCount={detail.reviewCount} />
          </View>

          <View style={styles.placeRow}>
            <Icon name="location-outline" size={iconSize.sm} color={color.textSecondary} />
            <AppText variant="body" color="textSecondary" style={styles.flex}>
              {detail.place}
            </AppText>
          </View>

          <View style={styles.amenities}>
            <StayAmenities labels={detail.amenities.slice(0, amenityLimit)} />
          </View>

          <View style={styles.divider} />

          <View style={styles.cards}>
            <PolicyCard
              icon="chatbubble-ellipses-outline"
              title={stayDetailCopy.policyChatTitle}
              description={stayDetailCopy.policyChatDescription}
              onPress={() => router.push({ pathname: '/stay/[slug]/chat', params: { slug } })}
            />

            {policy ? (
              <PolicyCard
                icon="document-text-outline"
                title={policy.title}
                description={policy.summary}
                expanded={policyOpen}
                onPress={() => setPolicyOpen((open) => !open)}>
                <AppText variant="caption" color="textSecondary">
                  {policy.body}
                </AppText>
              </PolicyCard>
            ) : null}
          </View>

          {detail.host ? (
            <View style={styles.hostSection}>
              <StayHostRow
                name={detail.host.name}
                avatar={detail.host.avatar}
                superhost={detail.host.superhost}
                onPress={() => showNotice(stayDetailCopy.hostNoticeTitle, stayDetailCopy.hostNotice)}
              />
            </View>
          ) : null}

          {detail.summary ? (
            <View style={styles.section}>
              <AppText variant="body" color="textSecondary">
                {detail.summary}
              </AppText>
            </View>
          ) : null}

          <View style={styles.section}>
            <AppText variant="subheading">{stayDetailCopy.stayDetails}</AppText>
            <AppText variant="caption" color="textSecondary">
              {stayDetailCopy.facts({
                guests: detail.guests,
                bedrooms: detail.bedrooms,
                beds: detail.beds,
                baths: detail.baths,
                petsAllowed: detail.petsAllowed,
              })}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {stayDetailCopy.checkInOut(detail.checkInTime, detail.checkOutTime)}
            </AppText>
          </View>

          {rules ? (
            <View style={styles.section}>
              <AppText variant="subheading">{rules.name || stayDetailCopy.houseRules}</AppText>
              {rules.rules.map((rule) => (
                <View key={rule} style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <AppText variant="body" color="textSecondary" style={styles.flex}>
                    {rule}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <StayBookingBar
        pricePerNight={detail.pricePerNight}
        onBook={() => showNotice(stayDetailCopy.bookingNoticeTitle, stayDetailCopy.bookingNotice)}
      />

      <Notice
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        dismissLabel={stayDetailCopy.noticeDismiss}
        onClose={() => setNotice(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.surface,
  },
  stateRoot: {
    flex: 1,
    paddingHorizontal: layout.screenGutter,
    backgroundColor: color.surface,
  },
  stateBody: {
    gap: spacing[3],
    marginTop: spacing[8],
  },
  sheet: {
    marginTop: -radius.xl,
    paddingTop: radius.xl + spacing[5],
    paddingHorizontal: layout.screenGutter,
    paddingBottom: spacing[8],
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  title: {
    flex: 1,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  amenities: {
    marginTop: spacing[5],
  },
  divider: {
    height: 1,
    marginTop: spacing[5],
    backgroundColor: color.border,
  },
  cards: {
    gap: spacing[3],
    marginTop: spacing[5],
  },
  hostSection: {
    marginTop: spacing[5],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  section: {
    gap: spacing[2],
    marginTop: spacing[6],
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  ruleDot: {
    width: spacing[1],
    height: spacing[1],
    marginTop: spacing[2] + spacing[1],
    borderRadius: radius.pill,
    backgroundColor: color.textSecondary,
  },
  flex: {
    flexShrink: 1,
  },
});

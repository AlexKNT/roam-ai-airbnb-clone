import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { ListingCard } from '@/components/ui/listing-card';
import { Logo } from '@/components/ui/logo';
import { Notice } from '@/components/ui/notice';
import { PolicyCard } from '@/components/ui/policy-card';
import { ProfileRow } from '@/components/ui/profile-row';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { Tag } from '@/components/ui/tag';
import { StayAmenities } from '@/components/stay/stay-amenities';
import { StayBookingBar } from '@/components/stay/stay-booking-bar';
import { StayGallery } from '@/components/stay/stay-gallery';
import { StayHostRow } from '@/components/stay/stay-host-row';
import { StayRating } from '@/components/stay/stay-rating';
import { color, layout, radius, spacing } from '@/theme';

const sampleStay = {
  image: 'https://picsum.photos/seed/roam-cabin/800/600',
  title: 'Modern Cabin with Hot Tub',
  place: 'Lake Arrowhead, CA',
  rating: 4.9,
  reviewCount: 342,
  pricePerNight: 280,
  amenities: ['Hot Tub', 'Pet Friendly'],
};

const sampleGallery = [1, 2, 3].map((index) => ({
  url: `https://picsum.photos/seed/roam-stay-${index}/900/700`,
  alt: `Cabin view ${index}`,
}));

const sampleHostAvatar = {
  url: 'https://picsum.photos/seed/roam-host/160/160',
  alt: 'Alex Rivera',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" color="textSecondary">
        {title}
      </AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function ComponentGalleryScreen() {
  const [search, setSearch] = useState('Cabins in California');
  const [inputValue, setInputValue] = useState('Joanna Smith');
  const [galleryPosition, setGalleryPosition] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen bottomInset="none">
      <View style={styles.header}>
        <AppText variant="heading">Components</AppText>
        <AppText variant="body" color="textSecondary">
          Every primitive and variant in one place.
        </AppText>
      </View>

      <Section title="Logo">
        <View style={styles.row}>
          <Logo size={32} />
          <Logo size={48} />
          <Logo size={56} />
        </View>
      </Section>

      <Section title="Type">
        <AppText variant="display">Display</AppText>
        <AppText variant="heading">Heading</AppText>
        <AppText variant="subheading">Subheading</AppText>
        <AppText variant="body">Body copy sits at sixteen with a relaxed line height.</AppText>
        <AppText variant="caption" color="textSecondary">
          Caption
        </AppText>
        <AppText variant="button">Button</AppText>
        <AppText variant="label">Label</AppText>
      </Section>

      <Section title="Buttons">
        <Button label="Book this stay" onPress={() => {}} icon="arrow-forward" />
        <Button
          label="Continue with Google"
          onPress={() => {}}
          variant="secondary"
          icon="logo-google"
        />
        <View style={styles.row}>
          <Button label="Loading" onPress={() => {}} loading />
          <Button label="Disabled" onPress={() => {}} disabled />
        </View>
      </Section>

      <Section title="Icon buttons">
        <View style={styles.row}>
          <IconButton icon="heart-outline" label="Save this stay" onPress={() => {}} />
          <IconButton icon="share-outline" label="Share this stay" onPress={() => {}} />
          <IconButton icon="search" label="Search" onPress={() => {}} tone="plain" />
        </View>
      </Section>

      <Section title="Inputs">
        <Input
          label="Full name"
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Enter your name"
          icon="person-outline"
        />
        <Input
          label="Email address"
          value=""
          onChangeText={() => {}}
          placeholder="you@example.com"
          icon="mail-outline"
          helper="We only use this to sign you in."
        />
        <Input
          label="Password"
          value="hunter2hunter2"
          onChangeText={() => {}}
          secure
          icon="lock-closed-outline"
        />
        <Input
          label="Email address"
          value="not-an-email"
          onChangeText={() => {}}
          icon="mail-outline"
          error="Enter a valid email address."
        />
        <Input label="Disabled" value="" onChangeText={() => {}} placeholder="Not editable" disabled />
      </Section>

      <Section title="Search">
        <SearchField value={search} onChangeText={setSearch} onFilterPress={() => {}} />
      </Section>

      <Section title="Chips">
        <View style={styles.row}>
          <Chip label="Cabins" selected tone="lavender" icon="home" />
          <Chip label="Under $300" />
          <Chip label="Pet Friendly" />
        </View>
        <View style={styles.row}>
          <Chip label="All Stays" selected tone="primary" icon="home" />
          <Chip label="Cabins" icon="pine-tree" />
          <Chip label="Beach" icon="waves" />
          <Chip label="City" icon="business-outline" />
          <Chip label="Villas" icon="palm-tree" />
        </View>
      </Section>

      <View style={styles.section}>
        <AppText variant="caption" color="textSecondary">
          Stay gallery
        </AppText>
        <View style={styles.bleed}>
          <StayGallery
            images={sampleGallery}
            name="Modern Cabin with Hot Tub"
            position={galleryPosition}
            onPositionChange={setGalleryPosition}
            onBack={() => {}}
            onShare={() => {}}
            onSave={() => {}}
          />
        </View>
      </View>

      <Section title="Listing card, hero">
        <ListingCard {...sampleStay} saved onPress={() => {}} />
      </Section>

      <Section title="Listing card, row">
        <ListingCard {...sampleStay} layout="row" onPress={() => {}} />
      </Section>

      <Section title="Policy cards">
        <PolicyCard
          icon="chatbubble-ellipses-outline"
          title="Ask about policies"
          description="Cancellation, house rules, pets, check-in and more."
          onPress={() => {}}
        />
        <PolicyCard
          icon="document-text-outline"
          title="Free cancellation"
          description="Full refund up to 7 days before check-in."
          onPress={() => {}}
        />
      </Section>

      <Section title="Stay pieces">
        <View style={styles.row}>
          <StayRating rating={4.9} reviewCount={342} />
          <StayAmenities labels={['Hot Tub', 'Pet Friendly']} />
        </View>
        <StayAmenities labels={['Hot Tub', 'Pet Friendly', 'Fast Wi Fi', 'Forest Views']} />
        <StayHostRow
          name="Alex Rivera"
          avatar={sampleHostAvatar}
          superhost
          onPress={() => {}}
        />
        <View style={styles.barFrame}>
          <StayBookingBar pricePerNight={289} onBook={() => {}} />
        </View>
      </Section>

      <Section title="Profile rows">
        <View style={styles.group}>
          <ProfileRow icon="person-outline" label="Personal info" onPress={() => {}} />
          <ProfileRow icon="card-outline" label="Payment methods" onPress={() => {}} />
          <ProfileRow icon="briefcase-outline" label="Trips" onPress={() => {}} last />
        </View>
      </Section>

      <Section title="Alerts">
        <Alert tone="success" message="Account created successfully" onDismiss={() => {}} />
        <Alert tone="error" message="Something went wrong. Please try again." onDismiss={() => {}} />
        <Button label="Open a notice" onPress={() => setNoticeOpen(true)} variant="secondary" />
        <Notice
          visible={noticeOpen}
          title="Booking is coming soon"
          message="You will be able to book this stay in a later update."
          dismissLabel="Got it"
          onClose={() => setNoticeOpen(false)}
        />
      </Section>

      <Section title="Tags">
        <View style={styles.row}>
          <Tag label="Guest favorite" icon="star" tone="lavender" />
          <Tag label="New" tone="mint" />
          <Tag label="20% off" tone="blush" />
          <Tag label="Superhost" tone="sky" />
          <Tag label="Neutral" />
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  section: {
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  sectionBody: {
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: color.surface,
    borderRadius: radius.xl,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[3],
  },
  group: {
    gap: spacing[1],
  },
  bleed: {
    marginHorizontal: -layout.screenGutter,
    overflow: 'hidden',
  },
  barFrame: {
    height: layout.controlHeight + spacing[8],
  },
});

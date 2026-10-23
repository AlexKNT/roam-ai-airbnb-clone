module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    posthogProjectToken: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    sanityProjectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID,
    sanityDataset: process.env.EXPO_PUBLIC_SANITY_DATASET,
  },
});

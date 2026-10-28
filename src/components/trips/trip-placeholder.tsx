import { StyleSheet, View } from 'react-native';

import { color, layout, radius, spacing } from '@/theme';

/** The shape of a saved stay row, drawn while Trips waits for it. */
export function TripPlaceholder() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.card}>
      <View style={styles.thumb} />
      <View style={styles.lines}>
        <View style={[styles.line, styles.wide]} />
        <View style={styles.line} />
        <View style={[styles.line, styles.short]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  thumb: {
    width: layout.cardThumb,
    height: layout.cardThumb,
    borderRadius: radius.lg,
    backgroundColor: color.surfaceGray,
  },
  lines: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[3],
  },
  line: {
    height: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: color.surfaceGray,
  },
  wide: {
    width: '70%',
  },
  short: {
    width: '45%',
  },
});

import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { color, iconSize, spacing } from '@/theme';

export type SourceLineProps = {
  /** Already formatted, e.g. `Source: Free cancellation`. */
  label: string;
};

export function SourceLine({ label }: SourceLineProps) {
  return (
    <View style={styles.row}>
      <Icon name="document-text-outline" size={iconSize.sm} color={color.textMuted} />
      <AppText variant="caption" color="textMuted" style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  text: {
    flex: 1,
  },
});

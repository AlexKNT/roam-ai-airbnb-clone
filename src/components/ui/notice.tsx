import { Modal, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { color, layout, radius, spacing } from '@/theme';

export type NoticeProps = {
  visible: boolean;
  title: string;
  message: string;
  dismissLabel: string;
  onClose: () => void;
};

/**
 * A short message the app owes the guest. React Native's own alert is a no op on
 * web, so the dialog is drawn here and works the same on every platform.
 */
export function Notice({ visible, title, message, dismissLabel, onClose }: NoticeProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View accessibilityViewIsModal style={styles.card}>
          <AppText variant="subheading">{title}</AppText>
          <AppText variant="body" color="textSecondary">
            {message}
          </AppText>
          <Button label={dismissLabel} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenGutter,
    backgroundColor: color.scrim,
  },
  card: {
    width: '100%',
    maxWidth: layout.formMaxWidth,
    gap: spacing[4],
    padding: spacing[5],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
});

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
  /** Adds a second, confirming action. Without it the dialog keeps its one button. */
  confirmLabel?: string;
  onConfirm?: () => void;
  /** Paints the confirming action in the danger tokens, for an action that removes data. */
  destructive?: boolean;
  confirmLoading?: boolean;
};

/**
 * A short message the app owes the guest. React Native's own alert is a no op on
 * web, so the dialog is drawn here and works the same on every platform.
 */
export function Notice({
  visible,
  title,
  message,
  dismissLabel,
  onClose,
  confirmLabel,
  onConfirm,
  destructive = false,
  confirmLoading = false,
}: NoticeProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View accessibilityViewIsModal style={styles.card}>
          <AppText variant="subheading">{title}</AppText>
          <AppText variant="body" color="textSecondary">
            {message}
          </AppText>

          {confirmLabel && onConfirm ? (
            <View style={styles.actions}>
              <Button
                label={dismissLabel}
                onPress={onClose}
                variant="secondary"
                disabled={confirmLoading}
                style={styles.action}
              />
              <Button
                label={confirmLabel}
                onPress={onConfirm}
                variant={destructive ? 'danger' : 'primary'}
                loading={confirmLoading}
                style={styles.action}
              />
            </View>
          ) : (
            <Button label={dismissLabel} onPress={onClose} />
          )}
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
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  action: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
});

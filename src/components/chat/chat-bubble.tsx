import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, radius, spacing } from '@/theme';

export type ChatBubbleProps = {
  /** The question, spoken as one turn. */
  label: string;
  children: ReactNode;
};

export function ChatBubble({ label, children }: ChatBubbleProps) {
  return (
    <View accessible accessibilityLabel={label} style={styles.guest}>
      {children}
    </View>
  );
}

export type AnswerCardProps = {
  /** Title, exact text and source, read together as one answer. */
  label: string;
  children: ReactNode;
};

export function AnswerCard({ label, children }: AnswerCardProps) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={styles.answer}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  guest: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: color.surfaceGray,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
  },
  answer: {
    gap: spacing[2],
    padding: spacing[4],
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
  },
});

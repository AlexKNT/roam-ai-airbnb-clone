import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { color, layout, radius, spacing, type } from '@/theme';

export type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Cabins in California',
  onFilterPress,
  style,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, focused && styles.focused, style]}>
      <Icon name="search" color={color.textSecondary} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        style={styles.input}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filters"
        onPress={onFilterPress}
        disabled={!onFilterPress}
        hitSlop={spacing[2]}>
        <Icon name="options-outline" color={color.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: layout.controlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: color.surfaceGray,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: color.focusRing,
  },
  input: {
    flex: 1,
    ...type.body,
    color: color.textPrimary,
    paddingVertical: 0,
  },
});

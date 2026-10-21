import { forwardRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, layout, opacity, radius, spacing, type } from '@/theme';

export type InputProps = {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  placeholder?: string;
  icon?: AppIconName;
  secure?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
  onSubmitEditing?: () => void;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  style?: StyleProp<ViewStyle>;
};

export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input(
  {
    value,
    onChangeText,
    label,
    placeholder,
    icon,
    secure = false,
    error,
    helper,
    disabled = false,
    onSubmitEditing,
    keyboardType,
    autoComplete,
    textContentType,
    autoCapitalize,
    style,
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const invalid = Boolean(error);

  return (
    <View style={[styles.root, style]}>
      {label ? (
        <AppText variant="caption" color="textPrimary">
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          invalid && styles.fieldInvalid,
          disabled && styles.fieldDisabled,
        ]}>
        {icon ? <Icon name={icon} color={color.textSecondary} /> : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={color.textMuted}
          editable={!disabled}
          secureTextEntry={secure && !revealed}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          style={styles.input}
        />

        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((current) => !current)}
            hitSlop={spacing[2]}>
            <Icon name={revealed ? 'eye-off-outline' : 'eye-outline'} color={color.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" color="dangerInk">
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" color="textMuted">
          {helper}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    gap: spacing[2],
  },
  field: {
    height: layout.controlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: color.surfaceGray,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldFocused: {
    borderColor: color.focusRing,
  },
  fieldInvalid: {
    borderColor: color.dangerInk,
  },
  fieldDisabled: {
    opacity: opacity.disabled,
  },
  input: {
    flex: 1,
    ...type.body,
    color: color.textPrimary,
    paddingVertical: 0,
  },
});

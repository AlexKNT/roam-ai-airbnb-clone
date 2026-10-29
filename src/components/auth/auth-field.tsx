import { forwardRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { authCopy } from '@/constants/copy';
import { color, iconSize, layout, opacity, radius, spacing, type } from '@/theme';

export type AuthFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: AppIconName;
  placeholder?: string;
  secure?: boolean;
  disabled?: boolean;
  onSubmitEditing?: () => void;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

/** The auth screens stack the label inside the box, above the value, as `auth.png` shows. */
export const AuthField = forwardRef<ComponentRef<typeof TextInput>, AuthFieldProps>(
  function AuthField(
    {
      label,
      value,
      onChangeText,
      icon,
      placeholder,
      secure = false,
      disabled = false,
      onSubmitEditing,
      keyboardType,
      autoComplete,
      textContentType,
      autoCapitalize,
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);

    return (
      <View>
        <View
          style={[
            styles.box,
            focused && styles.boxFocused,
            disabled ? styles.boxDisabled : null,
          ]}>
          <Icon name={icon} size={iconSize.md} color={color.textPrimary} />

          <View style={styles.field}>
            <AppText variant="fieldLabel" numberOfLines={1}>
              {label}
            </AppText>

            <TextInput
              ref={ref}
              value={value}
              onChangeText={onChangeText}
              accessibilityLabel={label}
              placeholder={placeholder}
              placeholderTextColor={color.textMuted}
              editable={!disabled}
              accessibilityState={{ disabled }}
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
          </View>

          {secure ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={revealed ? authCopy.hidePassword : authCopy.showPassword}
              onPress={() => setRevealed((current) => !current)}
              hitSlop={spacing[3]}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Icon
                name={revealed ? 'eye-outline' : 'eye-off-outline'}
                size={iconSize.md}
                color={color.textPrimary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  box: {
    minHeight: layout.controlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[1],
    backgroundColor: color.surfaceGray,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  boxFocused: {
    borderColor: color.focusRing,
  },
  boxDisabled: {
    opacity: opacity.disabled,
  },
  field: {
    flex: 1,
  },
  input: {
    ...type.body,
    color: color.textPrimary,
    paddingVertical: 0,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});

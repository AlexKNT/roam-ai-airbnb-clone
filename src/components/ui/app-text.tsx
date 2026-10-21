import { forwardRef, type ComponentRef } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { color, type, type ColorToken, type TypeVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
};

export const AppText = forwardRef<ComponentRef<typeof Text>, AppTextProps>(function AppText(
  { variant = 'body', color: tone = 'textPrimary', align, style, ...rest },
  ref,
) {
  return (
    <Text
      ref={ref}
      style={[type[variant], { color: color[tone], textAlign: align }, style]}
      {...rest}
    />
  );
});

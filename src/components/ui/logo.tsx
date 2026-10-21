import { AppText } from '@/components/ui/app-text';
import { brand } from '@/constants/copy';

export type LogoProps = {
  size?: 32 | 48 | 56;
};

export function Logo({ size = 32 }: LogoProps) {
  return (
    <AppText
      variant="display"
      style={{ fontSize: size, lineHeight: size, letterSpacing: -1 }}>
      {brand.name}
    </AppText>
  );
}

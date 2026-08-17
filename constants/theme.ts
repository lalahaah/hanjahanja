/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#1CB0F6';
const tintColorDark = '#1CB0F6';

// 듀오링고풍 팔레트: 통통한 초록 포인트 + 파란 보조색 + 카드 기반 레이아웃
export const Colors = {
  light: {
    text: '#3C3C3C',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#AFAFAF',
    tabIconDefault: '#AFAFAF',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    cardBorder: '#E5E5E5',
    primary: '#58CC02',
    primaryDark: '#58A700',
    primaryDisabled: '#E5E5E5',
    primaryDisabledDark: '#CFCFCF',
    secondary: '#1CB0F6',
    secondaryDark: '#1899D6',
    danger: '#FF4B4B',
  },
  dark: {
    text: '#F0F0F0',
    background: '#131F24',
    tint: tintColorDark,
    icon: '#7A8A94',
    tabIconDefault: '#7A8A94',
    tabIconSelected: tintColorDark,
    card: '#202F36',
    cardBorder: '#2B3940',
    primary: '#58CC02',
    primaryDark: '#4CAF00',
    primaryDisabled: '#3A464C',
    primaryDisabledDark: '#2B3940',
    secondary: '#1CB0F6',
    secondaryDark: '#1899D6',
    danger: '#FF6B6B',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

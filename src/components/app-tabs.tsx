import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Translate</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="text.bubble.fill" md="translate" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="speak">
        <NativeTabs.Trigger.Label>Speak</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="mic.fill" md="mic" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="flashcards">
        <NativeTabs.Trigger.Label>Flashcards</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="rectangle.stack.fill" md="style" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

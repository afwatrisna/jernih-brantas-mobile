import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const invoke = (callback: () => Promise<void>) => {
  if (Platform.OS !== "web") void callback();
};

export const haptic = {
  light: () => invoke(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => invoke(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: () => invoke(() => Haptics.selectionAsync()),
  success: () => invoke(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => invoke(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

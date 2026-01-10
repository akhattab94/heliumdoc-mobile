// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

/**
 * SF Symbols to Material Icons mappings for HealthPlus app.
 */
const MAPPING: Record<string, MaterialIconName> = {
  // Tab bar icons
  "house.fill": "home",
  "heart.text.square.fill": "health-and-safety",
  "gift.fill": "card-giftcard",
  "doc.text.fill": "description",
  "person.fill": "person",
  // Navigation icons
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "magnifyingglass": "search",
  // Feature icons
  "stethoscope": "medical-services",
  "video.fill": "videocam",
  "building.2.fill": "business",
  "star.fill": "star",
  "clock.fill": "schedule",
  "calendar": "event",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  // Specialty icons
  "heart.fill": "favorite",
  "brain.head.profile": "psychology",
  "figure.walk": "directions-walk",
  "eye.fill": "visibility",
  "lungs.fill": "air",
  "stomach.fill": "restaurant",
  // Misc icons
  "bell.fill": "notifications",
  "gearshape.fill": "settings",
  "arrow.right.square.fill": "logout",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
};

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] || "help";
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}

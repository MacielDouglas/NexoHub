export const NAV_ICON_NAMES = [
  "clipboard",
  "calendar",
  "sparkles",
  "building",
  "book",
  "music",
  "microphone",
  "users",
  "settings",
] as const;

export type NavIconName = (typeof NAV_ICON_NAMES)[number];

import type { NavIconName } from "@/components/nav/nav-icons";

export const SETTINGS_SECTION_IDS = [
  "meetings",
  "cleaning",
  "assignments",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  shortLabel: string;
  description: string;
  iconName: NavIconName;
};

export const SETTINGS_SECTIONS = [
  {
    id: "meetings",
    label: "Reuniões",
    shortLabel: "Reuniões",
    description: "Horários semanais e eventos especiais",
    iconName: "calendar",
  },
  {
    id: "cleaning",
    label: "Limpeza",
    shortLabel: "Limpeza",
    description: "Tipos de limpeza e setores",
    iconName: "sparkles",
  },
  {
    id: "assignments",
    label: "Designações",
    shortLabel: "Designações",
    description: "Atribuição de tarefas em breve",
    iconName: "clipboard",
  },
] as const satisfies readonly SettingsSection[];

export function settingsBasePath(slug: string): string {
  return `/org/${slug}/settings`;
}

export function settingsTabPath(slug: string, tab: SettingsSectionId): string {
  return `${settingsBasePath(slug)}?tab=${tab}`;
}

export function isSettingsTab(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);
}

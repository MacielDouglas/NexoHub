import { BottomNav } from "@/components/nav/bottom-nav";
import {
  SETTINGS_SECTIONS,
  settingsTabPath,
} from "@/features/settings/nav/settings-nav";

type Props = {
  slug: string;
  canManageSettings: boolean;
};

export function SettingsBottomNav({ slug, canManageSettings }: Props) {
  const items = canManageSettings
    ? SETTINGS_SECTIONS.map((section) => ({
        id: section.id,
        shortLabel: section.shortLabel,
        label: section.label,
        iconName: section.iconName,
        href: settingsTabPath(slug, section.id),
      }))
    : [];

  return (
    <BottomNav
      ariaLabel="Seções de configuração"
      items={items}
      active={{ mode: "query", param: "tab", defaultValue: "meetings" }}
    />
  );
}

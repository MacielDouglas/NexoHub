import { SideNav } from "@/components/nav/side-nav";
import {
  SETTINGS_SECTIONS,
  settingsTabPath,
} from "@/features/settings/nav/settings-nav";

type Props = {
  slug: string;
  canManageSettings: boolean;
};

export function SettingsSideNav({ slug, canManageSettings }: Props) {
  const items = canManageSettings
    ? SETTINGS_SECTIONS.map((section) => ({
        id: section.id,
        label: section.label,
        description: section.description,
        iconName: section.iconName,
        href: settingsTabPath(slug, section.id),
      }))
    : [];

  return (
    <SideNav
      ariaLabel="Seções de configuração"
      items={items}
      active={{ mode: "query", param: "tab", defaultValue: "meetings" }}
    />
  );
}

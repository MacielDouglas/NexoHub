import { SideNav } from "@/components/nav/side-nav";
import {
  SETTINGS_SECTIONS,
  settingsTabPath,
} from "@/features/settings/nav/settings-nav";

type Props = {
  slug: string;
};

export function SettingsSideNav({ slug }: Props) {
  const items = SETTINGS_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    description: section.description,
    iconName: section.iconName,
    href: settingsTabPath(slug, section.id),
  }));

  return (
    <SideNav
      ariaLabel="Seções de configuração"
      items={items}
      active={{ mode: "query", param: "tab", defaultValue: "meetings" }}
    />
  );
}

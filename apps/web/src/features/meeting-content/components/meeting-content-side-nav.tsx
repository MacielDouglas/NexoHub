import { SideNav } from "@/components/nav/side-nav";
import {
  MEETING_CONTENT_SECTIONS,
  meetingContentTabPath,
} from "@/features/meeting-content/nav/meeting-content-nav";

type Props = {
  slug: string;
};

export function MeetingContentSideNav({ slug }: Props) {
  const items = MEETING_CONTENT_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    description: section.description,
    iconName: section.iconName,
    href: meetingContentTabPath(slug, section.id),
  }));

  return (
    <SideNav
      ariaLabel="meetingContent.navAria"
      items={items}
      active={{
        mode: "query",
        param: "tab",
        defaultValue: "apostila",
      }}
    />
  );
}

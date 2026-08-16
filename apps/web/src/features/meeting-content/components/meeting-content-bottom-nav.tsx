import { BottomNav } from "@/components/nav/bottom-nav";
import {
  MEETING_CONTENT_SECTIONS,
  meetingContentTabPath,
} from "@/features/meeting-content/nav/meeting-content-nav";

type Props = {
  slug: string;
};

export function MeetingContentBottomNav({ slug }: Props) {
  const items = MEETING_CONTENT_SECTIONS.map((section) => ({
    id: section.id,
    shortLabel: section.shortLabel,
    label: section.label,
    iconName: section.iconName,
    href: meetingContentTabPath(slug, section.id),
  }));

  return (
    <BottomNav
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

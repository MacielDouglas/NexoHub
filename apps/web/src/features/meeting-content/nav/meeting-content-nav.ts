import type { NavIconName } from "@/components/nav/nav-icons";

export const MEETING_CONTENT_SECTION_IDS = [
  "apostila",
  "sentinela",
  "discursos",
  "canticos",
] as const;

export type MeetingContentSectionId =
  (typeof MEETING_CONTENT_SECTION_IDS)[number];

export type ContentSection = {
  id: MeetingContentSectionId;
  label: string;
  shortLabel: string;
  description: string;
  iconName: NavIconName;
};

export const MEETING_CONTENT_SECTIONS = [
  {
    id: "apostila",
    label: "meetingContent.nav.apostila",
    shortLabel: "meetingContent.nav.apostila",
    description: "meetingContent.nav.apostilaDesc",
    iconName: "book",
  },
  {
    id: "sentinela",
    label: "meetingContent.nav.sentinela",
    shortLabel: "meetingContent.nav.sentinela",
    description: "meetingContent.nav.sentinelaDesc",
    iconName: "calendar",
  },
  {
    id: "discursos",
    label: "meetingContent.nav.discursos",
    shortLabel: "meetingContent.nav.discursos",
    description: "meetingContent.nav.discursosDesc",
    iconName: "microphone",
  },
  {
    id: "canticos",
    label: "meetingContent.nav.canticos",
    shortLabel: "meetingContent.nav.canticos",
    description: "meetingContent.nav.canticosDesc",
    iconName: "music",
  },
] as const satisfies readonly ContentSection[];

export function meetingContentBasePath(slug: string): string {
  return `/org/${slug}/meetings?view=content`;
}

export function meetingContentTabPath(
  slug: string,
  section: MeetingContentSectionId,
): string {
  return `${meetingContentBasePath(slug)}&tab=${section}`;
}

export function isMeetingContentTab(
  value: string,
): value is MeetingContentSectionId {
  return MEETING_CONTENT_SECTION_IDS.includes(value as MeetingContentSectionId);
}

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
    label: "Apostila",
    shortLabel: "Apostila",
    description: "Reunião da semana",
    iconName: "book",
  },
  {
    id: "sentinela",
    label: "Sentinela",
    shortLabel: "Sentinela",
    description: "Estudo da Sentinela",
    iconName: "calendar",
  },
  {
    id: "discursos",
    label: "Discursos",
    shortLabel: "Discursos",
    description: "Discursos públicos",
    iconName: "microphone",
  },
  {
    id: "canticos",
    label: "Cânticos",
    shortLabel: "Cânticos",
    description: "Cânticos",
    iconName: "music",
  },
] as const satisfies readonly ContentSection[];

export function meetingContentBasePath(slug: string): string {
  return `/org/${slug}/meeting-content`;
}

export function meetingContentTabPath(
  slug: string,
  section: MeetingContentSectionId,
): string {
  return `${meetingContentBasePath(slug)}?tab=${section}`;
}

export function isMeetingContentTab(
  value: string,
): value is MeetingContentSectionId {
  return MEETING_CONTENT_SECTION_IDS.includes(value as MeetingContentSectionId);
}

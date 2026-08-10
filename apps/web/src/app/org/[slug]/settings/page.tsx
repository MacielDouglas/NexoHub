import { headers } from "next/headers";
import { SettingsPageView } from "@/features/settings/components/settings-page-view";
import {
  isSettingsTab,
  type SettingsSectionId,
} from "@/features/settings/nav/settings-nav";
import { getServerT } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { SPECIAL_EVENT_TYPES } from "@/lib/special-events";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
  defaultSentinelaConductorId: string | null;
};

type SpecialEvent = {
  id: string;
  type: string;
  date: Date | string;
  endDate: Date | string | null;
  time: string | null;
  location: string | null;
};

type Person = {
  id: string;
  name: string;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const member = await getUserOrg(requestHeaders);

  // Layout already validates and redirects if no member
  if (!member) {
    return null;
  }

  const canManageSettings = member.role === "owner" || member.role === "admin";
  const isMember = member.role === "member";

  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab: SettingsSectionId =
    rawTab && isSettingsTab(rawTab) ? rawTab : "meetings";

  let configs: MeetingConfig[] = [];
  let events: SpecialEvent[] = [];
  let conductorCandidates: Person[] = [];

  if (canManageSettings) {
    const [configsData, eventsData, conductorCandidatesData] =
      await Promise.all([
        prisma.meetingConfig.findMany({
          where: {
            organizationId: member.organization.id,
          },
          orderBy: {
            type: "asc",
          },
          select: {
            id: true,
            type: true,
            dayOfWeek: true,
            startTime: true,
            isActive: true,
            defaultSentinelaConductorId: true,
          },
        }),
        prisma.specialEvent.findMany({
          where: {
            organizationId: member.organization.id,
          },
          orderBy: {
            date: "asc",
          },
          select: {
            id: true,
            type: true,
            date: true,
            endDate: true,
            time: true,
            location: true,
          },
        }),
        prisma.person.findMany({
          where: {
            organizationId: member.organization.id,
            active: true,
            OR: [{ condutorEstudoBiblico: true }, { anciao: true }],
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
      ]);

    configs = configsData;
    events = eventsData;
    conductorCandidates = conductorCandidatesData;
  }

  const t = getServerT(session?.user.language ?? "pt");

  return (
    <SettingsPageView
      slug={member.organization.slug}
      isSuperUser={member.isSuperUser}
      canManageSettings={canManageSettings}
      isMember={isMember}
      tab={tab}
      configs={configs.map((config) => ({
        ...config,
        startTime: config.startTime,
      }))}
      conductorCandidates={conductorCandidates}
      events={events.map((event) => ({
        ...event,
        date:
          event.date instanceof Date
            ? event.date.toISOString().slice(0, 10)
            : event.date,
        endDate: event.endDate
          ? event.endDate instanceof Date
            ? event.endDate.toISOString().slice(0, 10)
            : event.endDate
          : null,
      }))}
      labels={{
        title: t("settings.title"),
        subtitle: t("settings.subtitle"),
        account: t("settings.account"),
        adminAccess: t("settings.adminAccess"),
        exitOrg: t("settings.exitOrg"),
        signOut: t("settings.signOut"),
      }}
      eventTypeLabels={Object.fromEntries(
        SPECIAL_EVENT_TYPES.map((type) => [
          type,
          t(`settings.specialEventTypes.${type}`),
        ]),
      )}
    />
  );
}

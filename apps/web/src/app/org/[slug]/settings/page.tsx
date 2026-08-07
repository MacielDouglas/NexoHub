// import { headers } from "next/headers";
// import { redirect } from "next/navigation";
// import { SettingsClient } from "@/components/settings-client";
// import { auth } from "@/lib/auth";
// import { getUserOrg } from "@/lib/org-utils";

// export default async function SettingsPage() {
//   const session = await auth.api.getSession({ headers: await headers() });

//   if (!session) {
//     redirect("/login");
//   }

//   const member = await getUserOrg(await headers());

//   if (!member) {
//     if (session.user.globalRole === "super_user") {
//       redirect("/admin");
//     }
//     if (session.user.globalRole === "owner") {
//       redirect("/create-org");
//     }
//     redirect("/welcome");
//   }

//   if (member.role !== "owner") {
//     redirect("/app");
//   }

//   return <SettingsClient isSuperUser={member.isSuperUser} />;
// }

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export default async function SettingsPage({ searchParams }: PageProps) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const member = await getUserOrg(requestHeaders);

  if (!member) {
    if (session.user.globalRole === "super_user") {
      redirect("/admin");
    }

    if (session.user.globalRole === "owner") {
      redirect("/create-org");
    }

    redirect("/welcome");
  }

  if (member.role !== "owner") {
    redirect("/app");
  }

  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab: SettingsSectionId =
    rawTab && isSettingsTab(rawTab) ? rawTab : "meetings";

  const [configs, events, conductorCandidates] = await Promise.all([
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

  const t = getServerT(session.user.language);

  return (
    <SettingsPageView
      slug={member.organization.slug}
      isSuperUser={member.isSuperUser}
      tab={tab}
      configs={configs.map((config) => ({
        ...config,
        startTime: config.startTime,
      }))}
      conductorCandidates={conductorCandidates}
      events={events.map((event) => ({
        ...event,
        date: event.date.toISOString().slice(0, 10),
        endDate: event.endDate
          ? event.endDate.toISOString().slice(0, 10)
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

"use client";

import { useTranslation } from "react-i18next";
import type { SettingsSectionId } from "@/features/settings/nav/settings-nav";
import { AccountSection } from "./account-section";
import { CleaningClient } from "./cleaning-client";
import { MeetingDayCard } from "./meeting-day-card";
import { SettingsSectionShell } from "./settings-section-shell";
import { SpecialEventsSection } from "./special-events-section";

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
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
};

type Person = {
  id: string;
  name: string;
};

type Props = {
  slug: string;
  isSuperUser: boolean;
  canManageSettings: boolean;
  isMember: boolean;
  tab: SettingsSectionId;
  configs: MeetingConfig[];
  conductorCandidates: Person[];
  events: SpecialEvent[];
  labels: {
    title: string;
    subtitle: string;
    account: string;
    adminAccess: string;
    exitOrg: string;
    signOut: string;
  };
  eventTypeLabels: Record<string, string>;
};

export function SettingsPageView({
  slug,
  isSuperUser,
  canManageSettings,
  isMember,
  tab,
  configs,
  conductorCandidates,
  events,
  labels,
  eventTypeLabels,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{labels.title}</h1>
        <p className="mt-1 text-muted-foreground">{labels.subtitle}</p>
      </div>

      {canManageSettings ? (
        <>
          {tab === "meetings" ? (
            <>
              <SettingsSectionShell
                title={t("settings.meetingDays")}
                description={t("settings.meetingDaysSubtitle")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <MeetingDayCard
                    slug={slug}
                    type="midweek"
                    config={configs.find((c) => c.type === "midweek")}
                  />
                  <MeetingDayCard
                    slug={slug}
                    type="weekend"
                    config={configs.find((c) => c.type === "weekend")}
                    conductorCandidates={conductorCandidates}
                  />
                </div>
              </SettingsSectionShell>

              <SettingsSectionShell
                title={t("settings.specialEvents")}
                description={t("settings.specialEventsSubtitle")}
              >
                <SpecialEventsSection
                  slug={slug}
                  events={events}
                  eventTypeLabels={eventTypeLabels}
                />
              </SettingsSectionShell>
            </>
          ) : null}

          {tab === "cleaning" ? (
            <SettingsSectionShell
              title={t("cleaning.title")}
              description={t("cleaning.subtitle")}
            >
              <CleaningClient />
            </SettingsSectionShell>
          ) : null}

          {tab === "assignments" ? (
            <SettingsSectionShell
              title={t("settings.nav.assignments")}
              description={t("settings.nav.assignmentsDesc")}
            >
              <p className="text-sm text-muted-foreground">
                {t("settings.assignmentsPlaceholder")}
              </p>
            </SettingsSectionShell>
          ) : null}
        </>
      ) : isMember ? (
        <div className="rounded-2xl bg-card p-6 ring-1 ring-white/10">
          <p className="text-sm text-muted-foreground">
            {t("settings.noPermission")}
          </p>
        </div>
      ) : null}

      <AccountSection
        slug={slug}
        isSuperUser={isSuperUser}
        accountLabel={labels.account}
        adminLabel={labels.adminAccess}
        signOutLabel={labels.signOut}
        exitOrgLabel={labels.exitOrg}
      />
    </div>
  );
}

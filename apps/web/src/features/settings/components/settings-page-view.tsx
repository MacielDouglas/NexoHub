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
};

type SpecialEvent = {
  id: string;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
};

type Props = {
  slug: string;
  isSuperUser: boolean;
  tab: SettingsSectionId;
  configs: MeetingConfig[];
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
  tab,
  configs,
  events,
  labels,
  eventTypeLabels,
}: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{labels.title}</h1>
        <p className="mt-1 text-muted-foreground">{labels.subtitle}</p>
      </div>

      {tab === "meetings" ? (
        <>
          <SettingsSectionShell
            title="Dias de reuniões"
            description="Configure os dois dias fixos de reunião da congregação. Todo o aplicativo usa essas informações como referência."
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
              />
            </div>
          </SettingsSectionShell>

          <SettingsSectionShell
            title="Eventos especiais"
            description="Cadastre os eventos especiais opcionais do ano."
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
          title="Limpeza"
          description="Configure os tipos de limpeza e os setores da congregação."
        >
          <CleaningClient />
        </SettingsSectionShell>
      ) : null}

      {tab === "assignments" ? (
        <SettingsSectionShell
          title="Designações"
          description="Atribuição de tarefas em breve."
        >
          <p className="text-sm text-muted-foreground">
            Esta área ainda está em construção.
          </p>
        </SettingsSectionShell>
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

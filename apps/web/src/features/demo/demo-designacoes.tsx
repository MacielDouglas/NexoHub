"use client";

import { Brush, MonitorSpeaker, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toDateKey } from "@/lib/cleaning-assignment";
import { cn } from "@/lib/utils";

const ROLES = [
  { key: "som", icon: Volume2 },
  { key: "video", icon: MonitorSpeaker },
  { key: "palco", icon: MonitorSpeaker },
  { key: "mic", icon: MonitorSpeaker },
  { key: "indicador", icon: MonitorSpeaker },
] as const;

const DEMO_PEOPLE = [
  "Carlos Mendes",
  "André Ferreira",
  "João Batista",
  "Pedro Lima",
  "Marcos Oliveira",
  "Lucas Pereira",
  "Rafael Souza",
  "Diego Martins",
  "Gustavo Almeida",
  "Felipe Costa",
];

const DEMO_MEN = [
  "Carlos Mendes",
  "André Ferreira",
  "João Batista",
  "Pedro Lima",
  "Marcos Oliveira",
  "Lucas Pereira",
  "Rafael Souza",
  "Diego Martins",
  "Gustavo Almeida",
  "Felipe Costa",
];

const DEMO_WOMEN = [
  "Maria Souza",
  "Ana Ribeiro",
  "Beatriz Lima",
  "Juliana Castro",
  "Fernanda Rocha",
  "Patrícia Nunes",
  "Camila Duarte",
  "Larissa Cardoso",
];

type Pool = "men" | "women" | "mixed";

const CLEANING_SECTORS = [
  {
    key: "auditorium",
    nameKey: "cleaning.defaults.meeting.auditorium.name",
    pool: "mixed",
  },
  {
    key: "bathroomMale",
    nameKey: "cleaning.defaults.meeting.bathroomMale.name",
    pool: "men",
  },
  {
    key: "bathroomFemale",
    nameKey: "cleaning.defaults.meeting.bathroomFemale.name",
    pool: "women",
  },
  {
    key: "supplies",
    nameKey: "cleaning.defaults.meeting.supplies.name",
    pool: "mixed",
  },
  {
    key: "trash",
    nameKey: "cleaning.defaults.meeting.trash.name",
    pool: "mixed",
  },
] as const;

const CLEANING_POOLS: Record<Pool, string[]> = {
  men: DEMO_MEN,
  women: DEMO_WOMEN,
  mixed: [...DEMO_MEN, ...DEMO_WOMEN],
};

type Tab = "meeting" | "cleaning";

function meetingDatesOfMonth(): Date[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 2 || dow === 0) dates.push(date);
  }
  return dates;
}

export function DemoDesignacoes() {
  const { t, i18n } = useTranslation();
  const dateLocale = (i18n.language ?? "pt").startsWith("es")
    ? "es-ES"
    : "pt-BR";
  const [tab, setTab] = useState<Tab>("meeting");

  const dates = useMemo(() => meetingDatesOfMonth(), []);

  const meetingRows = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    let cursor = firstDay.getDate() + firstDay.getDay();
    return ROLES.map((role) => ({
      role: role.key,
      icon: role.icon,
      entries: dates.map((date) => {
        const idx = cursor % DEMO_PEOPLE.length;
        cursor += role.key === "mic" ? 2 : 1;
        return { date, person: DEMO_PEOPLE[idx] };
      }),
    }));
  }, [dates]);

  const cleaningRows = useMemo(() => {
    const cursors: Record<Pool, number> = { men: 0, women: 0, mixed: 0 };
    return CLEANING_SECTORS.map((sector) => ({
      key: sector.key,
      nameKey: sector.nameKey,
      entries: dates.map((date) => {
        const pool = CLEANING_POOLS[sector.pool];
        const idx = cursors[sector.pool] % pool.length;
        cursors[sector.pool] += 1;
        return { date, person: pool[idx] };
      }),
    }));
  }, [dates]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    const label = now.toLocaleDateString(dateLocale, {
      month: "long",
      year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [dateLocale]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "meeting", label: t("designations.tabMeeting") },
    { key: "cleaning", label: t("designations.tabCleaning") },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("designations.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("designations.subtitle")}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={t("designations.title")}
        className="flex w-fit max-w-full items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm"
      >
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "cleaning" ? (
        <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-white/10">
          <table className="w-full min-w-160 border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("cleaning.sector")}
                </th>
                {cleaningRows[0].entries.map((e) => (
                  <th
                    key={toDateKey(e.date)}
                    className="px-3 py-3 text-center font-semibold text-foreground tabular-nums"
                  >
                    {formatDay(e.date, dateLocale)}
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {formatDate(e.date, dateLocale)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cleaningRows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <Brush
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      {t(row.nameKey)}
                    </span>
                  </td>
                  {row.entries.map((e) => (
                    <td
                      key={toDateKey(e.date)}
                      className="px-3 py-3 text-center"
                    >
                      <span
                        className={cn(
                          "inline-block rounded-lg px-2 py-1 text-xs font-medium",
                          isToday(e.date)
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {e.person}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-white/10">
          <table className="w-full min-w-160 border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("designations.pdf.date")}
                </th>
                {meetingRows[0].entries.map((e) => (
                  <th
                    key={toDateKey(e.date)}
                    className="px-3 py-3 text-center font-semibold text-foreground tabular-nums"
                  >
                    {formatDay(e.date, dateLocale)}
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {formatDate(e.date, dateLocale)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meetingRows.map((row) => (
                <tr
                  key={row.role}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <row.icon
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      {t(`designations.roles.${row.role}`)}
                    </span>
                  </td>
                  {row.entries.map((e) => (
                    <td
                      key={toDateKey(e.date)}
                      className="px-3 py-3 text-center"
                    >
                      <span
                        className={cn(
                          "inline-block rounded-lg px-2 py-1 text-xs font-medium",
                          isToday(e.date)
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {e.person}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">{monthLabel}</p>
    </div>
  );
}

function formatDay(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    day: "2-digit",
  });
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    month: "short",
    weekday: "short",
  });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return toDateKey(date) === toDateKey(now);
}

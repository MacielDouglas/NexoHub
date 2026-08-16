"use client";

import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  addDays,
  eachDayInRange,
  startOfWeek,
  toDateKey,
} from "@/lib/cleaning-assignment";
import { cn } from "@/lib/utils";

type MeetingType = "midweek" | "weekend";

type Row = {
  key: string;
  label: string;
  assigned: string;
};

type DemoMeeting = {
  type: MeetingType;
  title: string;
  subtitle: string;
  rows: Row[];
};

export function DemoMeetings() {
  const { t, i18n } = useTranslation();
  const dateLocale = (i18n.language ?? "pt").startsWith("es")
    ? "es-ES"
    : "pt-BR";

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date()),
  );
  const [cardTab, setCardTab] = useState<MeetingType>("midweek");

  const midweekDate = addDays(weekStart, 2);
  const weekendDate = addDays(weekStart, 4);

  const meetings: DemoMeeting[] = [
    {
      type: "midweek",
      title: t("meetings.types.midweek"),
      subtitle: `${formatDate(midweekDate, dateLocale)} · 19:30`,
      rows: [
        {
          key: "presidente",
          label: t("meetings.roles.presidente"),
          assigned: "Carlos Mendes",
        },
        {
          key: "canticoInicial",
          label: t("meetings.roles.canticoInicial"),
          assigned: "Cântico 45",
        },
        {
          key: "palavrasIntroducao",
          label: t("meetings.roles.palavrasIntroducao"),
          assigned: "André Ferreira",
        },
        {
          key: "tesouros",
          label: t("demo.meetings.tesouros"),
          assigned: "João Batista",
        },
        {
          key: "ministerio",
          label: t("demo.meetings.ministerio"),
          assigned: "Pedro Lima",
        },
        {
          key: "vidaCrista",
          label: t("demo.meetings.vidaCrista"),
          assigned: "Marcos Oliveira",
        },
        {
          key: "canticoFinal",
          label: t("meetings.roles.canticoFinal"),
          assigned: "Cântico 60",
        },
        {
          key: "oracao",
          label: t("meetings.roles.oracao"),
          assigned: "Lucas Pereira",
        },
      ],
    },
    {
      type: "weekend",
      title: t("meetings.types.weekend"),
      subtitle: `${formatDate(weekendDate, dateLocale)} · 10:00`,
      rows: [
        {
          key: "presidente",
          label: t("meetings.roles.presidente"),
          assigned: "Rafael Souza",
        },
        {
          key: "canticoInicial",
          label: t("meetings.roles.canticoInicial"),
          assigned: "Cântico 12",
        },
        {
          key: "discurso",
          label: t("meetings.roles.discurso"),
          assigned: "“Seja Forte e Tenha Boa Coragem”",
        },
        {
          key: "orador",
          label: t("meetings.roles.orador"),
          assigned: "Gustavo Almeida (Cong. Central)",
        },
        {
          key: "canticoMeio",
          label: t("meetings.roles.canticoMeio"),
          assigned: "Cântico 75",
        },
        {
          key: "condutorSentinela",
          label: t("meetings.roles.condutor"),
          assigned: "Carlos Mendes",
        },
        {
          key: "leitorSentinela",
          label: t("meetings.roles.leitor"),
          assigned: "Diego Martins",
        },
        {
          key: "canticoFinal",
          label: t("meetings.roles.canticoFinal"),
          assigned: "Cântico 90",
        },
      ],
    },
  ];

  const days = eachDayInRange(weekStart, addDays(weekStart, 6));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("meetings.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("meetings.subtitle")}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            aria-label={t("meetings.prevWeek")}
            className="flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("meetings.today")}
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            aria-label={t("meetings.nextWeek")}
            className="flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-base font-semibold text-foreground tabular-nums">
          {t("meetings.weekOf")} {formatWeekRange(weekStart, dateLocale)}
        </p>
      </div>

      <div className="rounded-2xl bg-card p-3 ring-1 ring-white/10 sm:p-4">
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, i) => {
            const isMidweek = toDateKey(day) === toDateKey(midweekDate);
            const isWeekend = toDateKey(day) === toDateKey(weekendDate);
            const isToday = toDateKey(day) === toDateKey(new Date());
            return (
              <div
                key={toDateKey(day)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border border-white/10 px-1 py-2 text-center",
                  isToday && "bg-primary/10",
                )}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {t(`meetings.weekdays.${(i + 6) % 7}`)}
                </span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {day.getDate().toString().padStart(2, "0")}
                </span>
                <div className="flex min-h-5 flex-col items-center gap-0.5">
                  {isMidweek && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <CalendarDays className="size-3" aria-hidden="true" />
                    </span>
                  )}
                  {isWeekend && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <CalendarCheck2 className="size-3" aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3 text-primary" aria-hidden="true" />
            {t("meetings.types.midweek")}
          </span>
          <span className="flex items-center gap-1">
            <CalendarCheck2
              className="size-3 text-primary"
              aria-hidden="true"
            />
            {t("meetings.types.weekend")}
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={t("meetings.title")}
        className="flex w-fit max-w-full items-center gap-1 rounded-full bg-card p-1 ring-1 ring-white/10"
      >
        {(
          [
            { key: "midweek", label: t("meetings.tabMidweek") },
            { key: "weekend", label: t("meetings.tabWeekend") },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={cardTab === item.key}
            onClick={() => setCardTab(item.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              cardTab === item.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {meetings
        .filter((m) => m.type === cardTab)
        .map((meeting) => (
          <section
            key={meeting.type}
            className="overflow-hidden rounded-2xl bg-card ring-1 ring-white/10"
            aria-label={meeting.title}
          >
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {meeting.title}
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                {meeting.subtitle}
              </p>
            </header>
            <ul className="divide-y divide-white/5">
              {meeting.rows.map((row) => (
                <li
                  key={row.key}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3"
                >
                  <span className="min-w-0 text-sm text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {row.assigned}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatWeekRange(weekStart: Date, locale: string): string {
  const end = addDays(weekStart, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  return `${fmt(weekStart)} – ${fmt(end)}/${weekStart.getFullYear()}`;
}

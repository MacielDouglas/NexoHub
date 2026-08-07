"use client";

import {
  Brush,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  type LucideIcon,
  MonitorSpeaker,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

export type OverviewItem = {
  id: string;
  kind: "meeting" | "designation" | "cleaning";
  date: string;
  titleKey: string | null;
  title: string | null;
  subtitleKey: string | null;
  subtitle: string | null;
  task?: string | null;
};

type NextMeeting = {
  type: string;
  date: string;
  time: string;
};

type Props = {
  personName: string | null;
  weekStart: string;
  weekEnd: string;
  today: string;
  nextMeeting: NextMeeting | null;
  weekAssignments: OverviewItem[];
  upcoming: OverviewItem[];
  pastMonth: OverviewItem[];
};

const KIND_VARIANT: Record<
  OverviewItem["kind"],
  "default" | "secondary" | "outline"
> = {
  meeting: "default",
  designation: "secondary",
  cleaning: "outline",
};

const KIND_ICON: Record<OverviewItem["kind"], LucideIcon> = {
  meeting: CalendarDays,
  designation: MonitorSpeaker,
  cleaning: Brush,
};

const KIND_ICON_CLASS: Record<OverviewItem["kind"], string> = {
  meeting: "bg-primary/15 text-primary",
  designation: "bg-white/10 text-foreground",
  cleaning: "bg-green-500/15 text-green-400",
};

export function OverviewClient({
  personName,
  weekStart,
  weekEnd,
  today,
  nextMeeting,
  weekAssignments,
  upcoming,
  pastMonth,
}: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = (i18n.language ?? "pt").startsWith("es")
    ? "es-ES"
    : "pt-BR";

  const formatDate = (key: string): string =>
    new Date(`${key}T00:00:00`).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("overview.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("overview.subtitle")}</p>
      </header>

      <section
        className="rounded-2xl bg-card ring-1 ring-white/10"
        aria-label={t("overview.currentWeek")}
      >
        <div className="flex items-center gap-2 px-5 pt-5">
          <CalendarRange className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("overview.currentWeek")}
          </h2>
          <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
        </div>

        <div className="space-y-3 p-5 pt-3 sm:p-6 sm:pt-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="text-sm text-muted-foreground">
              {t("overview.weekRange")}{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatDate(weekStart)} – {formatDate(weekEnd)}
              </span>
            </p>

            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl">
                {weekAssignments.length}
              </p>
              <p className="max-w-[10rem] text-xs font-medium uppercase tracking-wider leading-tight text-muted-foreground">
                {t("overview.weekCountLabel")}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-white/5">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <CalendarClock
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {t("overview.nextMeeting")}
              {nextMeeting ? (
                <RelativeBadge today={today} date={nextMeeting.date} />
              ) : null}
            </p>
            {nextMeeting ? (
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t(`meetings.types.${nextMeeting.type}`)}
                </span>
                {" · "}
                <span className="tabular-nums">
                  {formatDate(nextMeeting.date)}
                </span>
                {nextMeeting.time ? ` · ${nextMeeting.time}` : ""}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("overview.noNextMeeting")}
              </p>
            )}
          </div>
        </div>
      </section>

      {!personName ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-white/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted-foreground">
            {t("overview.noPerson")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-2 md:gap-6">
            <AssignmentGroup
              icon={Sparkles}
              title={t("overview.yourAssignments")}
              items={weekAssignments}
              empty={t("overview.noAssignments")}
              formatDate={formatDate}
            />

            <AssignmentGroup
              icon={CalendarClock}
              title={t("overview.upcoming")}
              items={upcoming}
              empty={t("overview.noUpcoming")}
              formatDate={formatDate}
            />
          </div>

          <AssignmentGroup
            icon={CalendarRange}
            title={t("overview.pastMonth")}
            items={pastMonth}
            empty={t("overview.noPast")}
            formatDate={formatDate}
          />
        </>
      )}
    </div>
  );
}

function AssignmentGroup({
  icon: Icon,
  title,
  items,
  empty,
  formatDate,
}: {
  icon: LucideIcon;
  title: string;
  items: OverviewItem[];
  empty: string;
  formatDate: (key: string) => string;
}) {
  return (
    <section aria-label={title}>
      <div className="flex items-center gap-2 px-1">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
      </div>

      {items.length === 0 ? (
        <div className="mt-2 flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40 px-4 py-8 text-center ring-1 ring-white/5">
          <p className="text-sm text-muted-foreground">{empty}</p>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} formatDate={formatDate} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemRow({
  item,
  formatDate,
}: {
  item: OverviewItem;
  formatDate: (key: string) => string;
}) {
  const { t } = useTranslation();
  const title = item.titleKey ? t(item.titleKey) : (item.title ?? "");
  const subtitle = item.subtitleKey ? t(item.subtitleKey) : item.subtitle;
  const Icon = KIND_ICON[item.kind];

  const isCleaningWithTask = item.kind === "cleaning" && item.task;

  return (
    <li className="rounded-2xl bg-card ring-1 ring-white/10">
      {isCleaningWithTask ? (
        <details className="group p-3 sm:p-4">
          <summary className="flex items-center gap-3 list-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${KIND_ICON_CLASS[item.kind]}`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              {title ? (
                <p className="truncate text-sm font-medium text-foreground">
                  {title}
                </p>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={KIND_VARIANT[item.kind]}>
                {t(`overview.kinds.${item.kind}`)}
              </Badge>
              <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {formatDate(item.date)}
              </span>
              <ChevronDown
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </div>
          </summary>

          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-foreground">{item.task}</p>
          </div>
        </details>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-white/10 sm:p-4">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${KIND_ICON_CLASS[item.kind]}`}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            {title ? (
              <p className="truncate text-sm font-medium text-foreground">
                {title}
              </p>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={KIND_VARIANT[item.kind]}>
              {t(`overview.kinds.${item.kind}`)}
            </Badge>
            <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {formatDate(item.date)}
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

function RelativeBadge({ today, date }: { today: string; date: string }) {
  const { t } = useTranslation();
  const diff = Math.round(
    (new Date(`${date}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86_400_000,
  );

  if (diff === 0) {
    return <Badge>{t("overview.today")}</Badge>;
  }
  if (diff === 1) {
    return <Badge variant="outline">{t("overview.tomorrow")}</Badge>;
  }
  if (diff > 1) {
    return (
      <Badge variant="outline">{t("overview.inDays", { count: diff })}</Badge>
    );
  }
  return null;
}

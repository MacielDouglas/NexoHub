"use client";

import {
  Brush,
  CalendarClock,
  CalendarDays,
  type LucideIcon,
  MonitorSpeaker,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type OverviewItem = {
  id: string;
  kind: "meeting" | "designation" | "cleaning";
  date: string;
  titleKey: string | null;
  title: string | null;
  subtitleKey: string | null;
  subtitle: string | null;
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
  meeting: "bg-primary/10 text-primary",
  designation: "bg-secondary text-secondary-foreground",
  cleaning: "bg-muted text-muted-foreground",
};

export function OverviewClient({
  personName,
  weekStart,
  weekEnd,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("overview.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("overview.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            {t("overview.currentWeek")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("overview.weekRange")}{" "}
            <span className="font-medium text-foreground">
              {formatDate(weekStart)} – {formatDate(weekEnd)}
            </span>
          </p>
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="size-4 text-primary" />
              {t("overview.nextMeeting")}
            </p>
            {nextMeeting ? (
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t(`meetings.types.${nextMeeting.type}`)}
                </span>
                {" · "}
                {formatDate(nextMeeting.date)}
                {nextMeeting.time ? ` · ${nextMeeting.time}` : ""}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("overview.noNextMeeting")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!personName ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <UserRound className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              {t("overview.noPerson")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-muted-foreground" />
                  {t("overview.yourAssignments")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weekAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("overview.noAssignments")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {weekAssignments.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        formatDate={formatDate}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("overview.upcoming")}</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("overview.noUpcoming")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {upcoming.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        formatDate={formatDate}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("overview.pastMonth")}</CardTitle>
            </CardHeader>
            <CardContent>
              {pastMonth.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("overview.noPast")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {pastMonth.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      formatDate={formatDate}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
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

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${KIND_ICON_CLASS[item.kind]}`}
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
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDate(item.date)}
        </span>
      </div>
    </li>
  );
}

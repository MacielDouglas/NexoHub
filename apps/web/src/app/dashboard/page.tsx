"use client";

import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.statMeetings")}
          </p>
          <p className="mt-1 text-3xl font-semibold">2</p>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.statConfigs")}
          </p>
          <p className="mt-1 text-3xl font-semibold">2</p>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.statParts")}
          </p>
          <p className="mt-1 text-3xl font-semibold">5</p>
        </div>
      </div>
    </div>
  );
}

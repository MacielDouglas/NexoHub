"use client";

import { ArrowLeft, ChevronRight, Home, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DiscursosClient } from "@/features/discursos/discursos-client";
import { SubOrgDetailClient } from "@/features/sub-org/sub-org-detail-client";

type SubOrg = {
  id: string;
  name: string;
  description: string | null;
  _count: { people: number };
};

type Props = {
  slug: string;
  role: string;
  organizationId: string;
  selected: "main" | string | null;
};

export function GroupsDiscursosClient({
  slug,
  role,
  organizationId,
  selected,
}: Props) {
  const { t } = useTranslation();
  const [subOrgs, setSubOrgs] = useState<SubOrg[]>([]);
  const [loading, setLoading] = useState(true);

  const groupsHref = `/org/${slug}/meetings?view=groups`;

  const fetchSubOrgs = useCallback(async () => {
    const res = await fetch(`/api/sub-orgs?orgId=${organizationId}`);
    if (res.ok) {
      const data = await res.json();
      setSubOrgs(data.subOrgs ?? []);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchSubOrgs();
  }, [fetchSubOrgs]);

  if (selected === "main") {
    return (
      <div className="space-y-4">
        <Link
          href={groupsHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("people.subOrg.back")}
        </Link>
        <DiscursosClient role={role} organizationId={organizationId} />
      </div>
    );
  }

  if (selected) {
    return (
      <SubOrgDetailClient
        role={role}
        _organizationId={organizationId}
        subOrgId={selected}
        backHref={groupsHref}
      />
    );
  }

  if (loading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("people.subOrg.subtitle")}
          </p>
        </div>
      </div>

      <Link
        href={`/org/${slug}/meetings?view=groups&subOrg=main`}
        className="flex items-center justify-between rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-primary/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted">
            <Home className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{t("people.mainCongregation")}</p>
            <p className="text-sm text-muted-foreground">
              {t("people.mainCongregationTalks")}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>

      {subOrgs.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 ring-1 ring-border text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("people.subOrg.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subOrgs.map((subOrg) => (
            <Link
              key={subOrg.id}
              href={`/org/${slug}/meetings?view=groups&subOrg=${subOrg.id}`}
              className="flex items-center justify-between rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted">
                  <Users className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">{subOrg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("people.subOrg.peopleCount", {
                      count: subOrg._count.people,
                    })}
                    {subOrg.description && ` · ${subOrg.description}`}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

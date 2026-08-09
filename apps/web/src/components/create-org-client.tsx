"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { I18nSync } from "@/components/i18n-sync";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateOrgClient({ lang }: { lang?: string | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro");
        return;
      }
      toast.success(t("createOrg.success"));
      router.push("/app");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#0c0c12] via-[#14141c] to-[#1a1410] p-6 safe-top safe-bottom">
      <I18nSync lang={lang} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(236,112,0,0.18) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,112,0,0.10) 0, transparent 40%)",
        }}
      />
      <div className="absolute top-5 right-6 flex items-center gap-2">
        <SignOutButton light />
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-md">
        <Card className="rounded-3xl border-0 bg-card shadow-2xl ring-1 ring-white/10">
          <CardHeader className="items-center text-center">
            <div className="bank-hero-glow mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <span className="text-3xl font-bold text-primary-foreground">
                N
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {t("createOrg.title")}
            </CardTitle>
            <CardDescription className="mx-auto max-w-sm">
              {t("createOrg.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">{t("createOrg.nameLabel")}</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("createOrg.namePlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || submitting}
              className="h-12 w-full rounded-full text-[17px] font-semibold"
            >
              {submitting ? t("common.loading") : t("createOrg.submit")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

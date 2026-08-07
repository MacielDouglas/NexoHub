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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function WelcomeClient({ lang }: { lang?: string | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRedeem() {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tokens/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro");
        return;
      }
      toast.success(t("welcome.success"));
      router.push(data?.next ?? "/app");
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
        <Card className="border-0 bg-card shadow-2xl ring-1 ring-white/10">
          <CardHeader className="items-center text-center">
            <div className="bank-hero-glow mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <span className="text-3xl font-bold text-primary-foreground">
                N
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {t("welcome.title")}
            </CardTitle>
            <CardDescription className="mx-auto max-w-sm">
              {t("welcome.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <ul className="w-full space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{t("welcome.feature1")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{t("welcome.feature2")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{t("welcome.feature3")}</span>
              </li>
            </ul>

            <div className="w-full space-y-3">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                  pattern="\d{6}"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleRedeem}
                disabled={code.length !== 6 || submitting}
                className="h-12 w-full rounded-xl text-[17px] font-semibold"
              >
                {submitting ? t("common.loading") : t("welcome.enter")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t("welcome.codeHint")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

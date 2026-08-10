"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { authClient } from "@/lib/auth-client";

export function LoginClient() {
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/app",
      });
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#0c0c12] via-[#14141c] to-[#1a1410] p-6 safe-top safe-bottom">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(236,112,0,0.18) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,112,0,0.10) 0, transparent 40%)",
        }}
      />
      <div className="absolute top-5 right-6">
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-card p-8 shadow-2xl ring-1 ring-white/10">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="bank-hero-glow flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <span className="text-3xl font-bold text-primary-foreground">
                N
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Nexohub
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("common.appTagline")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="flex h-13 w-full items-center justify-center gap-3 rounded-full bg-primary px-6 text-[17px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1H12v3.7h5.35c-.55 2.45-2.7 4-5.35 4-3.2 0-5.8-2.7-5.8-5.8S8.8 7.2 12 7.2c1.5 0 2.9.55 3.95 1.45l2.75-2.75C17.2 4.35 14.7 3.3 12 3.3 7.15 3.3 3.3 7.15 3.3 12s3.85 8.7 8.7 8.7c5.2 0 8.4-3.65 8.4-8.7 0-.5-.05-1.1-.15-1.6z"
              />
            </svg>
            {isSigningIn ? t("login.signingIn") : t("login.signInWithGoogle")}
          </button>

          <div className="mt-4">
            <Link
              href="/demo"
              className="flex h-13 w-full items-center justify-center gap-3 rounded-full bg-muted px-6 text-[17px] font-semibold text-muted-foreground transition-opacity hover:opacity-90 active:opacity-80"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 16a6 6 0 0 0-6 6" />
              </svg>
              {t("login.demo")}
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("login.terms")}
          </p>
        </div>
      </div>
    </div>
  );
}

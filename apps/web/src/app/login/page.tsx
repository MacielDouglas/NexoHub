"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/language-switcher";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#2563EB] via-[#3B5BDB] to-[#7C3AED] p-6">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, transparent 40%)",
        }}
      />
      <div className="absolute top-5 right-6">
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-[#2563EB] to-[#7C3AED] shadow-lg">
              <span className="text-3xl font-bold text-white">N</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Nexohub
            </h1>
            <p className="text-sm text-gray-500">{t("common.appTagline")}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#2563EB] px-6 text-[17px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1H12v3.7h5.35c-.55 2.45-2.7 4-5.35 4-3.2 0-5.8-2.6-5.8-5.8S8.8 7.2 12 7.2c1.5 0 2.9.55 3.95 1.45l2.75-2.75C17.2 4.35 14.7 3.3 12 3.3 7.15 3.3 3.3 7.15 3.3 12s3.85 8.7 8.7 8.7c5.2 0 8.4-3.65 8.4-8.7 0-.5-.05-1.1-.15-1.6z"
              />
            </svg>
            {isSigningIn ? t("login.signingIn") : t("login.signInWithGoogle")}
          </button>

          <p className="mt-6 text-center text-xs text-gray-400">
            {t("login.terms")}
          </p>
        </div>
      </div>
    </div>
  );
}

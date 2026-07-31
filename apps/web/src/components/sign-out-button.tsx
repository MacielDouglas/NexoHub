"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ light = false }: { light?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    await fetch("/api/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={light ? "text-white hover:bg-white/10 hover:text-white" : ""}
    >
      <LogOut className="size-4" />
      {t("nav.signOut")}
    </Button>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginClient } from "@/components/login-client";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse o Nexohub com sua conta Google para organizar reuniões, pessoas e designações da sua congregação.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/app");
  }

  return <LoginClient />;
}

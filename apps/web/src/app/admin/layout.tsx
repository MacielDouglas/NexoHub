import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { I18nSync } from "@/components/i18n-sync";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (session.user.globalRole !== "super_user") {
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <I18nSync lang={session.user.language} />
      {children}
    </div>
  );
}

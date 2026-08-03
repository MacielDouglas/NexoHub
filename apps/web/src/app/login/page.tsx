import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginClient } from "@/components/login-client";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}

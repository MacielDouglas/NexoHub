import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin-client";
import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (session.user.globalRole !== "super_user") {
    redirect("/app");
  }

  return <AdminClient />;
}

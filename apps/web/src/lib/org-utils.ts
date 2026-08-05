import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ACTIVE_ORG_COOKIE = "nexohub_active_org";

export type OrgMember = {
  id: string;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  isSuperUser: boolean;
};

export async function getUserOrg(headers: Headers): Promise<OrgMember | null> {
  const session = await auth.api.getSession({ headers });

  if (!session) return null;

  if (session.user.globalRole === "super_user") {
    const orgId = readActiveOrg(headers);
    if (!orgId) return null;
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true, logo: true },
    });
    if (!organization) return null;
    return {
      id: `super-${organization.id}`,
      role: "owner",
      organizationId: organization.id,
      organization,
      isSuperUser: true,
    };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, logo: true },
      },
    },
  });

  if (!member) return null;

  return {
    id: member.id,
    role: member.role,
    organizationId: member.organizationId,
    organization: member.organization,
    isSuperUser: false,
  };
}

export function canManageConfig(role: string | null): boolean {
  return role === "owner";
}

export function canManageSchedules(role: string | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageMeetingContent(role: string | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: string | null): boolean {
  return role === "owner" || role === "admin";
}

export function readActiveOrg(headers: Headers): string | null {
  const cookieHeader = headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ACTIVE_ORG_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(ACTIVE_ORG_COOKIE.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function isSuperUser(session: {
  user: { globalRole?: string | null };
}): boolean {
  return session.user.globalRole === "super_user";
}

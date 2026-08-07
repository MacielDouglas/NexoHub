"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import {
  ANNUAL_EVENT_TYPES,
  SPECIAL_EVENT_FIELDS,
  type SpecialEventType,
} from "@/lib/special-events";

async function requireOwner() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const member = await getUserOrg(requestHeaders);

  if (!member) {
    if (session.user.globalRole === "super_user") {
      redirect("/admin");
    }

    if (session.user.globalRole === "owner") {
      redirect("/create-org");
    }

    redirect("/welcome");
  }

  if (member.role !== "owner") {
    redirect("/app");
  }

  return { session, member };
}

function settingsPath(slug: string, tab: string) {
  return `/org/${slug}/settings?tab=${tab}`;
}

export async function saveMeetingConfigAction(formData: FormData) {
  const { member } = await requireOwner();

  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "");
  const redirectTab = String(formData.get("redirectTab") ?? "meetings");
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = String(formData.get("startTime") ?? "");
  const defaultSentinelaConductorId = String(
    formData.get("defaultSentinelaConductorId") ?? "",
  );

  if (!["midweek", "weekend"].includes(type)) {
    redirect(settingsPath(member.organization.slug, redirectTab));
  }

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    redirect(settingsPath(member.organization.slug, redirectTab));
  }

  if (!startTime) {
    redirect(settingsPath(member.organization.slug, redirectTab));
  }

  let defaultConductorData:
    | { defaultSentinelaConductorId: string }
    | { defaultSentinelaConductorId: null } = {
    defaultSentinelaConductorId: null,
  };

  if (defaultSentinelaConductorId) {
    const conductor = await prisma.person.findFirst({
      where: {
        id: defaultSentinelaConductorId,
        organizationId: member.organization.id,
      },
      select: { id: true },
    });
    if (conductor) {
      defaultConductorData = {
        defaultSentinelaConductorId: conductor.id,
      };
    }
  }

  if (id) {
    await prisma.meetingConfig.update({
      where: {
        id,
        organizationId: member.organization.id,
      },
      data: {
        dayOfWeek,
        startTime,
        isActive: true,
        ...defaultConductorData,
      },
    });
  } else {
    await prisma.meetingConfig.create({
      data: {
        organizationId: member.organization.id,
        type,
        dayOfWeek,
        startTime,
        isActive: true,
        ...defaultConductorData,
      },
    });
  }

  revalidatePath(`/org/${member.organization.slug}/settings`);
  redirect(settingsPath(member.organization.slug, redirectTab));
}

export async function saveSpecialEventAction(formData: FormData) {
  const { member } = await requireOwner();

  const id = String(formData.get("id") ?? "");
  const redirectTab = String(formData.get("redirectTab") ?? "meetings");
  const type = String(formData.get("type") ?? "") as SpecialEventType;
  const date = String(formData.get("date") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const time = String(formData.get("time") ?? "");
  const location = String(formData.get("location") ?? "");

  const fields = SPECIAL_EVENT_FIELDS[type];

  if (!fields || !date) {
    redirect(settingsPath(member.organization.slug, redirectTab));
  }

  const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_KEY_RE.test(date) || (endDate && !DATE_KEY_RE.test(endDate))) {
    redirect(settingsPath(member.organization.slug, redirectTab));
  }

  if ((ANNUAL_EVENT_TYPES as readonly string[]).includes(type)) {
    const existing = await prisma.specialEvent.findFirst({
      where: {
        organizationId: member.organization.id,
        type,
        id: id ? { not: id } : undefined,
        date: {
          gte: new Date(`${date.slice(0, 4)}-01-01T00:00:00.000Z`),
          lte: new Date(`${date.slice(0, 4)}-12-31T23:59:59.999Z`),
        },
      },
      select: { id: true },
    });

    if (existing) {
      redirect(settingsPath(member.organization.slug, redirectTab));
    }
  }

  const payload = {
    type,
    date: new Date(`${date}T00:00:00.000Z`),
    endDate:
      fields.endDate && endDate ? new Date(`${endDate}T00:00:00.000Z`) : null,
    time: fields.time && time ? time : null,
    location: fields.location && location ? location : null,
    organizationId: member.organization.id,
  };

  if (id) {
    await prisma.specialEvent.update({
      where: {
        id,
        organizationId: member.organization.id,
      },
      data: payload,
    });
  } else {
    await prisma.specialEvent.create({
      data: payload,
    });
  }

  revalidatePath(`/org/${member.organization.slug}/settings`);
  redirect(settingsPath(member.organization.slug, redirectTab));
}

export async function deleteSpecialEventAction(formData: FormData) {
  const { member } = await requireOwner();

  const id = String(formData.get("id") ?? "");
  const redirectTab = String(formData.get("redirectTab") ?? "meetings");

  if (!id) {
    redirect(settingsPath(member.organization.slug, redirectTab));
  }

  await prisma.specialEvent.delete({
    where: {
      id,
      organizationId: member.organization.id,
    },
  });

  revalidatePath(`/org/${member.organization.slug}/settings`);
  redirect(settingsPath(member.organization.slug, redirectTab));
}

export async function signOutAction() {
  redirect("/login");
}

export async function exitOrgAction() {
  const { member } = await requireOwner();

  if (!member.isSuperUser) {
    redirect(`/org/${member.organization.slug}/settings`);
  }

  redirect("/admin");
}

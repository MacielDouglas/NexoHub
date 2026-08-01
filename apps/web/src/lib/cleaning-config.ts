import { DEFAULT_SECTORS } from "@/lib/cleaning-defaults";
import { prisma } from "@/lib/prisma";

export async function getOrCreateCleaningConfig(organizationId: string) {
  const existing = await prisma.cleaningConfig.findUnique({
    where: { organizationId },
    include: { sectors: { orderBy: { sortOrder: "asc" } } },
  });

  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const config = await tx.cleaningConfig.create({
      data: { organizationId },
    });
    await tx.cleaningSector.createMany({
      data: DEFAULT_SECTORS.map((d) => ({
        cleaningConfigId: config.id,
        type: d.type,
        defaultKey: d.key,
        unit: d.unit,
        peopleCount: d.peopleCount ?? null,
        allowYoung: d.allowYoung ?? false,
        gender: d.gender ?? "any",
        sortOrder: d.sortOrder,
      })),
    });
    return tx.cleaningConfig.findUniqueOrThrow({
      where: { organizationId },
      include: { sectors: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

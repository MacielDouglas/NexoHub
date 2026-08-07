import { parseDateKey } from "@/lib/cleaning-assignment";
import {
  DESIGNATION_ROLES,
  type DesignationRole,
  ROLE_PRIVILEGE,
} from "@/lib/designation-assignment";
import { prisma } from "@/lib/prisma";

export type DesignationAssignmentInput = {
  date: string;
  role: DesignationRole;
  sector: string | null;
  personId: string;
};

export async function validateDesignationProgram(args: {
  organizationId: string;
  enabledSectors: DesignationRole[];
  dates: string[];
  assignments: DesignationAssignmentInput[];
  excludeProgramIds?: Set<string>;
}): Promise<{ error: string; status: number } | null> {
  const {
    organizationId,
    enabledSectors,
    dates,
    assignments,
    excludeProgramIds,
  } = args;

  const uniqueDates = new Set(dates);
  if (uniqueDates.size !== dates.length) {
    return { error: "Datas duplicadas no programa", status: 400 };
  }

  const dateSet = new Set(dates);
  for (const a of assignments) {
    if (!dateSet.has(a.date)) {
      return {
        error: "Designação fora do intervalo de datas",
        status: 400,
      };
    }
  }

  const enabledRoles = new Set(enabledSectors);
  const disabledRole = assignments.find((a) => !enabledRoles.has(a.role));
  if (disabledRole) {
    return {
      error: `Setor desativado não pode ter designações (${disabledRole.role})`,
      status: 400,
    };
  }

  const personIds = [...new Set(assignments.map((a) => a.personId))];
  const people = await prisma.person.findMany({
    where: {
      id: { in: personIds },
      organizationId,
    },
    select: { id: true, sex: true, active: true, ...privilegeSelect() },
  });
  const peopleById = new Map(people.map((p) => [p.id, p]));

  const invalid = assignments.find((a) => {
    const person = peopleById.get(a.personId);
    if (!person) return true;
    if (!person.active || person.sex !== "MALE") return true;
    const privilege = ROLE_PRIVILEGE[a.role];
    return person[privilege as keyof typeof person] !== true;
  });
  if (invalid) {
    return {
      error: `Pessoa inválida ou sem privilégio para a designação (${invalid.role})`,
      status: 400,
    };
  }

  const perDate = new Map<string, Set<string>>();
  for (const a of assignments) {
    const set = perDate.get(a.date) ?? new Set<string>();
    if (set.has(a.personId)) {
      return {
        error: "A mesma pessoa não pode ser designada duas vezes no mesmo dia",
        status: 400,
      };
    }
    set.add(a.personId);
    perDate.set(a.date, set);
  }

  const sortedDates = dates.slice().sort((a, b) => a.localeCompare(b));
  const start = parseDateKey(sortedDates[0]);
  const end = parseDateKey(sortedDates[sortedDates.length - 1]);

  const otherPrograms = await prisma.designationProgram.findMany({
    where: {
      organizationId,
      startDate: { lte: end },
      endDate: { gte: start },
      ...(excludeProgramIds && excludeProgramIds.size > 0
        ? { id: { notIn: [...excludeProgramIds] } }
        : {}),
    },
    include: {
      assignments: {
        select: { date: true },
      },
    },
  });

  const occupied = new Set<string>();
  for (const program of otherPrograms) {
    for (const a of program.assignments) {
      occupied.add(a.date.toISOString().slice(0, 10));
    }
  }
  const overlap = dates.find((d) => occupied.has(d));
  if (overlap) {
    return {
      error: "Já existe um programa de designações nesta data",
      status: 409,
    };
  }

  return null;
}

function privilegeSelect() {
  return Object.fromEntries(
    DESIGNATION_ROLES.map((role) => [ROLE_PRIVILEGE[role], true]),
  );
}

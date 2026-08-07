import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseDateKey } from "@/lib/cleaning-assignment";
import { validateDesignationProgram } from "@/lib/designation-validation";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageSchedules, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { designationProgramUpdateSchema } from "@/lib/schemas";

type Params = Promise<{ id: string }>;

function serializeAssignment(a: {
  id: string;
  date: Date;
  role: string;
  sector: string | null;
  personId: string;
  person: { id: string; name: string };
}) {
  return {
    id: a.id,
    date: a.date.toISOString().slice(0, 10),
    role: a.role,
    sector: a.sector,
    personId: a.personId,
    personName: a.person.name,
  };
}

function serializeProgram(p: {
  id: string;
  startDate: Date;
  endDate: Date;
  enabledSectors: unknown;
  createdAt: Date;
  assignments: Array<{
    id: string;
    date: Date;
    role: string;
    sector: string | null;
    personId: string;
    person: { id: string; name: string };
  }>;
}) {
  return {
    id: p.id,
    startDate: p.startDate.toISOString().slice(0, 10),
    endDate: p.endDate.toISOString().slice(0, 10),
    enabledSectors: Array.isArray(p.enabledSectors)
      ? (p.enabledSectors as string[])
      : [],
    createdAt: p.createdAt.toISOString(),
    assignments: p.assignments.map(serializeAssignment),
  };
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.designationProgram.findFirst({
    where: { id, organizationId: member.organizationId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Programa não encontrado" },
      { status: 404 },
    );
  }

  try {
    const body = designationProgramUpdateSchema.parse(
      await readJsonRequest(request),
    );
    const dates = body.dates.slice().sort((a, b) => a.localeCompare(b));
    const start = parseDateKey(dates[0]);
    const end = parseDateKey(dates[dates.length - 1]);

    const validationError = await validateDesignationProgram({
      organizationId: member.organizationId,
      enabledSectors: body.enabledSectors,
      dates,
      assignments: body.assignments.map((a) => ({
        date: a.date,
        role: a.role,
        sector: a.sector ?? null,
        personId: a.personId,
      })),
      excludeProgramIds: new Set([id]),
    });
    if (validationError) {
      return NextResponse.json(
        { error: validationError.error },
        { status: validationError.status },
      );
    }

    const program = await prisma.$transaction(async (tx) => {
      await tx.designationAssignment.deleteMany({ where: { programId: id } });
      return tx.designationProgram.update({
        where: { id },
        data: {
          startDate: start,
          endDate: end,
          enabledSectors: body.enabledSectors,
          assignments: {
            create: body.assignments.map((a) => ({
              date: parseDateKey(a.date),
              role: a.role,
              sector: a.sector ?? null,
              personId: a.personId,
            })),
          },
        },
        include: {
          assignments: {
            include: { person: { select: { id: true, name: true } } },
            orderBy: [{ date: "asc" }, { role: "asc" }],
          },
        },
      });
    });

    return NextResponse.json({ program: serializeProgram(program) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.designationProgram.findFirst({
    where: { id, organizationId: member.organizationId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Programa não encontrado" },
      { status: 404 },
    );
  }

  await prisma.designationProgram.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

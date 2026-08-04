import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { getUserOrg } from "@/lib/org-utils";
import {
  PersonSectionSchema,
  showDesignacoes,
  showPrivilegioServico,
  showPrivilegios,
  showPrivilegiosServico,
  validateFamilyRules,
} from "@/lib/people";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const person = await prisma.person.findFirst({
    where: { id, organizationId: member.organizationId },
    include: {
      family: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!person) {
    return NextResponse.json(
      { error: "Pessoa não encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ person });
}

async function requireManagePeople(
  member: Awaited<ReturnType<typeof getUserOrg>>,
) {
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (member.role !== "owner" && member.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas Owner e Admin podem gerenciar pessoas" },
      { status: 403 },
    );
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const permError = await requireManagePeople(member);
  if (permError) return permError;

  const { id } = await params;

  const existing = await prisma.person.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Pessoa não encontrada" },
      { status: 404 },
    );
  }

  let raw: unknown;
  try {
    raw = await readJsonRequest(request);
  } catch (error) {
    return handleApiError(error);
  }

  const parse = PersonSectionSchema.partial().safeParse(raw);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parse.error.flatten() },
      { status: 422 },
    );
  }

  const input = parse.data;
  const merged = { ...existing, ...input, id: undefined, createdAt: undefined };

  if (input.userId !== undefined && input.userId) {
    const existingPerson = await prisma.person.findFirst({
      where: { userId: input.userId, id: { not: id } },
    });
    if (existingPerson) {
      return NextResponse.json(
        { error: "Este usuário já está vinculado a outra pessoa" },
        { status: 400 },
      );
    }
    const memberExists = await prisma.member.findFirst({
      where: { userId: input.userId, organizationId: member.organizationId },
    });
    if (!memberExists) {
      return NextResponse.json(
        { error: "Usuário não é membro desta organização" },
        { status: 400 },
      );
    }
  }

  const sex = (input.sex ?? existing.sex) as "MALE" | "FEMALE";
  const batizado = input.batizado ?? existing.batizado;
  const privilegioServico =
    input.privilegioServico ?? existing.privilegioServico;
  const young = input.young ?? existing.young;
  const chefeFamilia = input.chefeFamilia ?? existing.chefeFamilia;
  const casada = input.casada ?? existing.casada;
  const familyId = input.familyId ?? existing.familyId;
  const familyName = input.familyName ?? null;

  if (!showPrivilegioServico(sex, batizado)) {
    merged.privilegioServico = false;
  }
  if (!showDesignacoes(sex)) {
    merged.leituraBiblia = false;
    merged.microfoneVolante = false;
    merged.som = false;
    merged.video = false;
    merged.palco = false;
  }
  if (!showPrivilegios(sex, batizado)) {
    merged.leitorEstudoBiblico = false;
    merged.leitorSentinela = false;
    merged.indicador = false;
    merged.oracao = false;
  }
  if (!showPrivilegiosServico(sex, batizado, privilegioServico)) {
    merged.anciao = false;
    merged.presidenteVidaMinisterio = false;
    merged.discursoTesouros = false;
    merged.joiasEspirituais = false;
    merged.nossaVidaCrista = false;
    merged.necessidadesLocais = false;
    merged.condutorEstudoBiblico = false;
    merged.presidenteFimSemana = false;
    merged.discursoPublico = false;
    merged.condutorSentinela = false;
  }

  const families = await prisma.family.findMany({
    where: { organizationId: member.organizationId },
    include: {
      people: {
        where: { casada: true, id: { not: id } },
        select: { id: true, sex: true },
      },
    },
  });

  const familiesWithMarried = families.map((f) => ({
    id: f.id,
    name: f.name,
    chefeId: f.chefeId,
    marriedMaleId: f.people.find((p) => p.sex === "MALE")?.id ?? null,
    marriedFemaleId: f.people.find((p) => p.sex === "FEMALE")?.id ?? null,
  }));

  const formData = {
    ...merged,
    sex,
    batizado,
    young,
    chefeFamilia,
    casada,
    familyId,
    familyName,
    privilegioServico: merged.privilegioServico,
  };

  const validationError = validateFamilyRules(
    formData,
    familiesWithMarried,
    id,
  );
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let newFamilyId = familyId;
  let createFamily = false;
  let createdFamilyId: string | null = null;

  if (chefeFamilia && familyName?.trim()) {
    const nameTrimmed = familyName.trim();
    const existingFamily = families.find(
      (f) => f.name.toLowerCase() === nameTrimmed.toLowerCase(),
    );
    if (existingFamily && existingFamily.chefeId !== id) {
      return NextResponse.json(
        { error: "Já existe uma família com este nome" },
        { status: 400 },
      );
    }

    if (existingFamily && existingFamily.chefeId === id) {
      if (existingFamily.name !== nameTrimmed) {
        await prisma.family.update({
          where: { id: existingFamily.id },
          data: { name: nameTrimmed },
        });
      }
      newFamilyId = existingFamily.id;
    } else if (!existingFamily) {
      const newFamily = await prisma.family.create({
        data: {
          organizationId: member.organizationId,
          name: nameTrimmed,
          chefeId: id,
        },
      });
      createdFamilyId = newFamily.id;
      newFamilyId = newFamily.id;
      createFamily = true;
    }
  }

  if (input.userId === "") input.userId = null;

  const updateData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (
      key === "familyName" ||
      key === "createdAt" ||
      key === "id" ||
      key === "organizationId" ||
      key === "updatedAt"
    )
      continue;
    if (key === "userId") {
      updateData[key] = value ?? null;
      continue;
    }
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  if (createFamily && createdFamilyId) {
    updateData.familyId = createdFamilyId;
    updateData.chefeFamilia = true;
    updateData.casada = casada;
  } else {
    updateData.familyId = newFamilyId ?? null;
  }

  const updated = await prisma.person.update({
    where: { id },
    data: updateData,
    include: {
      family: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (chefeFamilia && updated.familyId) {
    await prisma.family.update({
      where: { id: updated.familyId },
      data: { chefeId: updated.id },
    });
  }

  if (!chefeFamilia && existing.familyId && existing.chefeFamilia) {
    const familyPeopleCount = await prisma.person.count({
      where: { familyId: existing.familyId, id: { not: id } },
    });
    if (familyPeopleCount === 0) {
      await prisma.family
        .delete({ where: { id: existing.familyId } })
        .catch(() => {});
    } else {
      await prisma.family.update({
        where: { id: existing.familyId },
        data: { chefeId: null },
      });
    }
  }

  revalidatePath(`/org/${member.organization.slug}/people`);

  return NextResponse.json({ person: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const permError = await requireManagePeople(member);
  if (permError) return permError;

  const { id } = await params;

  const person = await prisma.person.findFirst({
    where: { id, organizationId: member.organizationId },
    include: { family: { include: { _count: { select: { people: true } } } } },
  });

  if (!person) {
    return NextResponse.json(
      { error: "Pessoa não encontrada" },
      { status: 404 },
    );
  }

  if (person.chefeFamilia && person.family && person.family._count.people > 1) {
    return NextResponse.json(
      {
        error:
          "Não é possível remover o chefe de família enquanto houver outros membros na família. Reatribua o chefe ou mova os membros primeiro.",
      },
      { status: 400 },
    );
  }

  const familyId = person.familyId;

  await prisma.person.delete({ where: { id } });

  if (familyId) {
    const remaining = await prisma.person.count({
      where: { familyId },
    });
    if (remaining === 0) {
      await prisma.family.delete({ where: { id: familyId } }).catch(() => {});
    } else {
      const family = await prisma.family.findUnique({
        where: { id: familyId },
        select: { chefeId: true },
      });
      if (family?.chefeId === id) {
        await prisma.family.update({
          where: { id: familyId },
          data: { chefeId: null },
        });
      }
    }
  }

  revalidatePath(`/org/${member.organization.slug}/people`);

  return NextResponse.json({ message: "Pessoa removida" });
}

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

export async function GET() {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orgId = member.organizationId;

  const [people, families] = await Promise.all([
    prisma.person.findMany({
      where: { organizationId: orgId },
      include: {
        family: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.family.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        chefeId: true,
        _count: { select: { people: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const peopleWithStats = people.map((p) => {
    const { user, family, ...rest } = p;
    return {
      ...rest,
      sex: p.sex,
      family: family ? { id: family.id, name: family.name } : null,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    };
  });

  const total = people.length;
  const active = people.filter((p) => p.active).length;
  const familiesCount = families.length;
  const homens = people.filter((p) => p.sex === "MALE").length;
  const mulheres = people.filter((p) => p.sex === "FEMALE").length;
  const comPrivServico = people.filter((p) => p.privilegioServico).length;

  return NextResponse.json({
    people: peopleWithStats,
    families,
    stats: {
      total,
      active,
      families: familiesCount,
      homens,
      mulheres,
      comPrivServico,
    },
  });
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

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const permError = await requireManagePeople(member);
  if (permError) return permError;

  let data: unknown;
  try {
    data = await readJsonRequest(request);
  } catch (error) {
    return handleApiError(error);
  }

  const parse = PersonSectionSchema.safeParse(data);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parse.error.flatten() },
      { status: 422 },
    );
  }

  const input = parse.data;

  if (input.userId) {
    const existingPerson = await prisma.person.findUnique({
      where: { userId: input.userId },
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

  if (!showPrivilegioServico(input.sex, input.batizado)) {
    input.privilegioServico = false;
  }
  if (!showDesignacoes(input.sex)) {
    input.leituraBiblia = false;
    input.microfoneVolante = false;
    input.som = false;
    input.video = false;
    input.palco = false;
  }
  if (!showPrivilegios(input.sex, input.batizado)) {
    input.leitorEstudoBiblico = false;
    input.leitorSentinela = false;
    input.indicador = false;
    input.oracao = false;
  }
  if (
    !showPrivilegiosServico(input.sex, input.batizado, input.privilegioServico)
  ) {
    input.anciao = false;
    input.presidenteVidaMinisterio = false;
    input.discursoTesouros = false;
    input.joiasEspirituais = false;
    input.nossaVidaCrista = false;
    input.necessidadesLocais = false;
    input.condutorEstudoBiblico = false;
    input.presidenteFimSemana = false;
    input.discursoPublico = false;
    input.condutorSentinela = false;
  }

  const families = await prisma.family.findMany({
    where: { organizationId: member.organizationId },
    include: {
      people: {
        where: { casada: true },
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

  const validationError = validateFamilyRules(
    input,
    familiesWithMarried,
    undefined,
  );
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let familyId = input.familyId;
  const familyName = input.familyName;

  if (input.chefeFamilia && familyName?.trim()) {
    const nameTrimmed = familyName.trim();
    const existing = await prisma.family.findFirst({
      where: {
        organizationId: member.organizationId,
        name: { equals: nameTrimmed, mode: "insensitive" },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma família com este nome" },
        { status: 400 },
      );
    }
    const newFamily = await prisma.family.create({
      data: {
        organizationId: member.organizationId,
        name: nameTrimmed,
      },
    });
    familyId = newFamily.id;
  }

  if (input.casada && !familyId) {
    return NextResponse.json(
      { error: "Pessoa casada deve pertencer a uma família" },
      { status: 400 },
    );
  }

  if (input.chefeFamilia && !familyId) {
    return NextResponse.json(
      { error: "Chefe de família deve criar ou selecionar uma família" },
      { status: 400 },
    );
  }

  const personData = {
    organizationId: member.organizationId,
    name: input.name,
    sex: input.sex,
    active: input.active,
    young: input.young,
    batizado: input.batizado,
    limpeza: input.limpeza,
    estudante: input.estudante,
    privilegioServico: input.privilegioServico,
    chefeFamilia: input.chefeFamilia,
    casada: input.casada,
    familyId,
    iniciarConversas: input.iniciarConversas,
    cultivarInteresse: input.cultivarInteresse,
    fazerDiscipulos: input.fazerDiscipulos,
    explicarCrencas: input.explicarCrencas,
    leituraBiblia: input.leituraBiblia,
    microfoneVolante: input.microfoneVolante,
    som: input.som,
    video: input.video,
    palco: input.palco,
    leitorEstudoBiblico: input.leitorEstudoBiblico,
    leitorSentinela: input.leitorSentinela,
    indicador: input.indicador,
    oracao: input.oracao,
    anciao: input.anciao,
    presidenteVidaMinisterio: input.presidenteVidaMinisterio,
    discursoTesouros: input.discursoTesouros,
    joiasEspirituais: input.joiasEspirituais,
    nossaVidaCrista: input.nossaVidaCrista,
    necessidadesLocais: input.necessidadesLocais,
    condutorEstudoBiblico: input.condutorEstudoBiblico,
    presidenteFimSemana: input.presidenteFimSemana,
    discursoPublico: input.discursoPublico,
    condutorSentinela: input.condutorSentinela,
    userId: input.userId ?? null,
  };

  const person = await prisma.person.create({
    data: personData,
    include: {
      family: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (input.chefeFamilia && familyId) {
    await prisma.family.update({
      where: { id: familyId },
      data: { chefeId: person.id },
    });
  }

  return NextResponse.json({ person }, { status: 201 });
}

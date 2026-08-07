import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma, type Sex } from "@/lib/prisma";

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = (await readJsonRequest(request)) as {
      direction?: "org-to-sub" | "sub-to-org";
      personId?: string;
      subOrgId?: string;
      // For sub-to-org, need all Person fields
      sex?: Sex;
      active?: boolean;
      young?: boolean;
      batizado?: boolean;
      limpeza?: boolean;
      estudante?: boolean;
      privilegioServico?: boolean;
      chefeFamilia?: boolean;
      casada?: boolean;
      familyId?: string | null;
      iniciarConversas?: boolean;
      cultivarInteresse?: boolean;
      fazerDiscipulos?: boolean;
      explicarCrencas?: boolean;
      leituraBiblia?: boolean;
      microfoneVolante?: boolean;
      som?: boolean;
      video?: boolean;
      palco?: boolean;
      leitorEstudoBiblico?: boolean;
      leitorSentinela?: boolean;
      indicador?: boolean;
      oracao?: boolean;
      anciao?: boolean;
      presidenteVidaMinisterio?: boolean;
      discursoTesouros?: boolean;
      joiasEspirituais?: boolean;
      nossaVidaCrista?: boolean;
      necessidadesLocais?: boolean;
      condutorEstudoBiblico?: boolean;
      presidenteFimSemana?: boolean;
      discursoPublico?: boolean;
      condutorSentinela?: boolean;
    };

    if (!body.direction || !body.personId) {
      return NextResponse.json(
        { error: "direction e personId são obrigatórios" },
        { status: 400 },
      );
    }

    if (body.direction === "org-to-sub") {
      if (!body.subOrgId) {
        return NextResponse.json(
          { error: "subOrgId é obrigatório para org-to-sub" },
          { status: 400 },
        );
      }

      const person = await prisma.person.findFirst({
        where: { id: body.personId, organizationId: member.organizationId },
        select: {
          id: true,
          name: true,
          sex: true,
          batizado: true,
          privilegioServico: true,
          userId: true,
        },
      });

      if (!person) {
        return NextResponse.json(
          { error: "Pessoa não encontrada" },
          { status: 404 },
        );
      }

      if (person.sex !== "MALE") {
        return NextResponse.json(
          {
            error:
              "Apenas pessoas do sexo masculino podem migrar para sub-organização",
          },
          { status: 400 },
        );
      }

      const subOrg = await prisma.subOrganization.findFirst({
        where: { id: body.subOrgId, organizationId: member.organizationId },
        select: { id: true },
      });

      if (!subOrg) {
        return NextResponse.json(
          { error: "Sub-organização não encontrada" },
          { status: 404 },
        );
      }

      // Create SubOrgPerson
      await prisma.subOrgPerson.create({
        data: {
          subOrganizationId: body.subOrgId,
          name: person.name,
          batizado: person.batizado,
          privilegioServico: person.privilegioServico,
        },
      });

      const fullPerson = await prisma.person.findFirst({
        where: { id: body.personId },
        include: {
          family: { include: { _count: { select: { people: true } } } },
        },
      });

      if (
        fullPerson?.chefeFamilia &&
        fullPerson.family &&
        fullPerson.family._count.people > 1
      ) {
        return NextResponse.json(
          {
            error:
              "Não é possível migrar o chefe de família enquanto houver outros membros na família. Reatribua o chefe ou mova os membros primeiro.",
          },
          { status: 400 },
        );
      }

      const familyId = fullPerson?.familyId ?? null;

      await prisma.person.update({
        where: { id: body.personId },
        data: { userId: null },
      });

      await prisma.person.delete({ where: { id: body.personId } });

      if (familyId) {
        const remaining = await prisma.person.count({
          where: { familyId },
        });
        if (remaining === 0) {
          await prisma.family
            .delete({ where: { id: familyId } })
            .catch(() => {});
        } else {
          const family = await prisma.family.findUnique({
            where: { id: familyId },
            select: { chefeId: true },
          });
          if (family?.chefeId === body.personId) {
            await prisma.family.update({
              where: { id: familyId },
              data: { chefeId: null },
            });
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (body.direction === "sub-to-org") {
      const subPerson = await prisma.subOrgPerson.findFirst({
        where: {
          id: body.personId,
          subOrganization: { organizationId: member.organizationId },
        },
        select: {
          id: true,
          name: true,
          batizado: true,
          privilegioServico: true,
        },
      });

      if (!subPerson) {
        return NextResponse.json(
          { error: "Pessoa não encontrada" },
          { status: 404 },
        );
      }

      const familyId = body.familyId ?? null;
      if (familyId) {
        const family = await prisma.family.findFirst({
          where: { id: familyId, organizationId: member.organizationId },
          select: { id: true },
        });
        if (!family) {
          return NextResponse.json(
            { error: "A família selecionada não pertence a esta congregação" },
            { status: 400 },
          );
        }
      }

      // Create Person with provided fields (defaults for missing)
      await prisma.person.create({
        data: {
          organizationId: member.organizationId,
          name: subPerson.name,
          sex: body.sex ?? "MALE",
          active: body.active ?? true,
          young: body.young ?? false,
          batizado: body.batizado ?? subPerson.batizado,
          limpeza: body.limpeza ?? true,
          estudante: body.estudante ?? true,
          privilegioServico:
            body.privilegioServico ?? subPerson.privilegioServico,
          chefeFamilia: body.chefeFamilia ?? false,
          casada: body.casada ?? false,
          familyId,
          iniciarConversas: body.iniciarConversas ?? false,
          cultivarInteresse: body.cultivarInteresse ?? false,
          fazerDiscipulos: body.fazerDiscipulos ?? false,
          explicarCrencas: body.explicarCrencas ?? false,
          leituraBiblia: body.leituraBiblia ?? false,
          microfoneVolante: body.microfoneVolante ?? false,
          som: body.som ?? false,
          video: body.video ?? false,
          palco: body.palco ?? false,
          leitorEstudoBiblico: body.leitorEstudoBiblico ?? false,
          leitorSentinela: body.leitorSentinela ?? false,
          indicador: body.indicador ?? false,
          oracao: body.oracao ?? false,
          anciao: body.anciao ?? false,
          presidenteVidaMinisterio: body.presidenteVidaMinisterio ?? false,
          discursoTesouros: body.discursoTesouros ?? false,
          joiasEspirituais: body.joiasEspirituais ?? false,
          nossaVidaCrista: body.nossaVidaCrista ?? false,
          necessidadesLocais: body.necessidadesLocais ?? false,
          condutorEstudoBiblico: body.condutorEstudoBiblico ?? false,
          presidenteFimSemana: body.presidenteFimSemana ?? false,
          discursoPublico: body.discursoPublico ?? true,
          condutorSentinela: body.condutorSentinela ?? false,
        },
      });

      // Delete SubOrgPerson
      await prisma.subOrgPerson.delete({ where: { id: body.personId } });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Direção inválida" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}

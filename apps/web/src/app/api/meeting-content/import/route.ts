import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES } from "@/lib/jwpub/constants";
import { extractJwpub } from "@/lib/jwpub/extract";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { MEETING_CONTENT_TYPES } from "../route";

export const runtime = "nodejs";
export const maxDuration = 120;

const TYPE_BY_EXTRACT: Record<string, string> = {
  workbook: "apostila",
  watchtower: "sentinela",
  talks: "discursos",
  songbook: "canticos",
};

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const typeOverride = form.get("type");
    const replace = form.get("replace") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".jwpub")) {
      return NextResponse.json(
        { error: "O arquivo deve ter extensão .jwpub" },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "O arquivo excede o limite de 100MB" },
        { status: 413 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const result = await extractJwpub(buf);

    const detectedType = TYPE_BY_EXTRACT[result.type] ?? ("apostila" as const);

    const type =
      typeof typeOverride === "string" &&
      MEETING_CONTENT_TYPES.includes(typeOverride as never)
        ? typeOverride
        : detectedType;

    if (type !== detectedType) {
      return NextResponse.json(
        {
          error: `O arquivo selecionado não é do tipo ${detectedType}`,
          code: "TYPE_MISMATCH",
          detectedType,
        },
        { status: 422 },
      );
    }

    const isFlat = type === "discursos" || type === "canticos";

    const existing = isFlat
      ? await prisma.meetingContent.findFirst({
          where: { organizationId: member.organizationId, type },
          include: { _count: { select: { items: true } } },
        })
      : await prisma.meetingContent.findFirst({
          where: {
            organizationId: member.organizationId,
            type,
            OR: result.symbol
              ? [{ symbol: result.symbol }]
              : [{ title: result.title }],
          },
          include: { _count: { select: { items: true } } },
        });

    if (existing && !replace) {
      return NextResponse.json(
        {
          duplicate: true,
          existing: {
            id: existing.id,
            title: existing.title,
            issue: existing.issue,
            itemCount: existing._count.items,
          },
        },
        { status: 409 },
      );
    }

    if (existing && replace) {
      await prisma.meetingContent.delete({ where: { id: existing.id } });
    }

    const content = await prisma.meetingContent.create({
      data: {
        organizationId: member.organizationId,
        type,
        title: result.title || file.name,
        symbol: result.symbol,
        coverTitle: result.coverTitle,
        issue: result.issue,
        items: {
          create: result.items.map((data, index) => ({
            position: index,
            data: JSON.parse(JSON.stringify(data)),
          })),
        },
      },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json({ content, items: result.items }, { status: 201 });
  } catch (e) {
    const err = e as Error & { code?: string };
    console.error("[meeting-content/import]", err);
    const message =
      err.code === "BAD_SIZE"
        ? "O arquivo excede o limite de 100MB"
        : err.code === "BAD_MAGIC"
          ? "O arquivo enviado não é um .jwpub válido"
          : err.code === "BAD_MANIFEST"
            ? "O arquivo enviado está com o manifest inválido"
            : err.code === "TYPE_MISMATCH"
              ? "O arquivo selecionado não corresponde ao tipo escolhido"
              : "Falha na extração do arquivo";
    return NextResponse.json(
      {
        error: message,
        code: err.code || "EXTRACT_FAIL",
      },
      { status: 422 },
    );
  }
}

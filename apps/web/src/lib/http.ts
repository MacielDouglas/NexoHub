import { NextResponse } from "next/server";
import { z } from "zod";

export const MAX_BODY_BYTES = 256 * 1024;

export class HttpError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function readJsonRequest(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_BODY_BYTES) {
    throw new HttpError(
      "Corpo da requisição muito grande",
      413,
      "BODY_TOO_LARGE",
    );
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    throw new HttpError("Corpo da requisição inválido", 400, "BAD_BODY");
  }

  if (text.length > MAX_BODY_BYTES) {
    throw new HttpError(
      "Corpo da requisição muito grande",
      413,
      "BODY_TOO_LARGE",
    );
  }
  if (!text.trim()) {
    throw new HttpError("Corpo da requisição vazio", 400, "BAD_BODY");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(
      "JSON inválido no corpo da requisição",
      400,
      "BAD_JSON",
    );
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, ...(error.code ? { code: error.code } : {}) },
      { status: error.status },
    );
  }
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        error: "Dados inválidos",
        details: first?.path.join(".") ?? "",
        reason: first?.message ?? "",
      },
      { status: 422 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}

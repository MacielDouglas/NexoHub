import { z } from "zod";

export const SONG_IDS = new Set(Array.from({ length: 161 }, (_, i) => i + 1));

export function isValidSongNumber(value: string): boolean {
  if (value.trim() === "") return true;
  const n = Number(value);
  return Number.isInteger(n) && SONG_IDS.has(n);
}

export function isValidDateRange(value: string): boolean {
  const match = /^(\d{8})-(\d{8})$/.exec(value);
  if (!match) return false;
  const [start, end] = [match[1], match[2]];
  const valid = (s: string) => {
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6));
    const d = Number(s.slice(6, 8));
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    return !Number.isNaN(new Date(y, m - 1, d).getTime());
  };
  return valid(start) && valid(end) && end >= start;
}

const MAX_TEXT = 5000;
const MAX_SHORT = 500;

const songNumber = z
  .union([z.number().int().min(1).max(161), z.null()])
  .optional();

const songRef = z.object({
  number: z.union([z.number().int().min(1).max(161), z.null()]),
  title: z.string().max(MAX_TEXT),
});

const sentinelaSchema = z.object({
  week: z.string().max(MAX_SHORT),
  theme: z.string().max(MAX_TEXT),
  songs: z.object({
    opening: songRef,
    closing: songRef,
  }),
});

const apostilaParteSchema = z.object({
  order: z.number().int().min(0).max(1000),
  parte: z.string().max(MAX_TEXT),
  tema: z.string().max(MAX_TEXT),
  tempo: z.string().max(MAX_SHORT),
  modalidade: z.string().max(MAX_TEXT).nullable(),
  fonte: z.string().max(MAX_TEXT).nullable(),
});

const apostilaSecaoSchema = z.object({
  secao: z.string().max(MAX_TEXT),
  cancionMedia: songNumber,
  partes: z.array(apostilaParteSchema).max(200),
});

const apostilaSchema = z.object({
  semana: z.string().max(MAX_SHORT),
  dateRange: z
    .string()
    .refine(
      (v) => v.trim() === "" || isValidDateRange(v),
      "Intervalo de datas inválido",
    ),
  canticoInicial: songNumber,
  canticoFinal: songNumber,
  secoes: z.array(apostilaSecaoSchema).max(100),
});

const basicSchema = z.object({
  number: z.union([z.number().int().min(1).max(100000), z.null()]),
  theme: z.string().max(MAX_TEXT),
});

export const itemDataSchemas: Record<string, z.ZodType> = {
  apostila: apostilaSchema,
  sentinela: sentinelaSchema,
  discursos: basicSchema,
  canticos: basicSchema,
};

export function itemDataSchema(type: string): z.ZodType {
  return itemDataSchemas[type] ?? basicSchema;
}

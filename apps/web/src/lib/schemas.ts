import { z } from "zod";

export const orgNameSchema = z.object({
  name: z.string().trim().min(3).max(100),
});

export const updateLanguageSchema = z.object({
  language: z.enum(["pt", "es"]),
});

export const redeemCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Código inválido"),
});

export const tokenCreateSchema = z
  .object({
    purpose: z.enum(["owner", "member"]).optional(),
  })
  .strict();

export const memberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});

const dayOfWeek = z.number().int().min(0).max(6);
const timeOfDay = z.string().regex(/^\d{2}:\d{2}$/);

export const createMeetingConfigSchema = z
  .object({
    type: z.enum(["midweek", "weekend"]),
    dayOfWeek,
    startTime: timeOfDay,
  })
  .strict();

export const updateMeetingConfigSchema = z
  .object({
    type: z.enum(["midweek", "weekend"]).optional(),
    dayOfWeek: dayOfWeek.optional(),
    startTime: timeOfDay.optional(),
    isActive: z.boolean().optional(),
    defaultSentinelaConductorId: z.string().nullable().optional(),
  })
  .strict();

export const createPartSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
    sortOrder: z.number().int().min(0).max(10000),
    description: z.string().max(1000).nullable().optional(),
  })
  .strict();

export const updatePartSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
    sortOrder: z.number().int().min(0).max(10000).optional(),
    description: z.string().max(1000).nullable().optional(),
  })
  .strict();

export const cleaningConfigUpdateSchema = z
  .object({
    weeklyEnabled: z.boolean().optional(),
    weeklyDayOfWeek: dayOfWeek.nullable().optional(),
    weeklyIntervalWeeks: z.number().int().min(1).max(52).optional(),
    generalEnabled: z.boolean().optional(),
  })
  .strict();

export const cleaningSectorInputSchema = z
  .object({
    type: z.enum(["meeting", "weekly", "general"]),
    defaultKey: z.string().trim().max(100).nullish(),
    name: z.string().trim().min(1).max(200).nullish(),
    task: z.string().max(2000).nullish(),
    unit: z.string().min(1).max(50).nullish(),
    peopleCount: z.number().int().min(1).max(1000).nullish(),
    allowYoung: z.boolean().nullish(),
    gender: z.enum(["male", "female", "any"]).nullish(),
  })
  .strict();

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

export const cleaningAssignmentInputSchema = z
  .object({
    date: dateKey,
    sectorId: z.string().trim().min(1).max(100),
    personIds: z.array(z.string().trim().min(1).max(100)).min(1).max(200),
  })
  .strict();

export const cleaningScheduleCreateSchema = z
  .object({
    type: z.enum(["meeting", "weekly", "general"]),
    dates: z.array(dateKey).min(1).max(500),
    assignments: z.array(cleaningAssignmentInputSchema).min(1).max(2000),
  })
  .strict();

export const cleaningScheduleUpdateSchema = z
  .object({
    dates: z.array(dateKey).min(1).max(500),
    assignments: z.array(cleaningAssignmentInputSchema).min(1).max(2000),
  })
  .strict();

export const meetingContentCreateSchema = z
  .object({
    type: z.enum(["apostila", "sentinela", "discursos", "canticos"]),
    title: z.string().max(500).optional(),
    symbol: z.string().max(100).nullable().optional(),
    coverTitle: z.string().max(500).nullable().optional(),
  })
  .strict();

export const meetingContentUpdateSchema = z
  .object({
    title: z.string().max(500).optional(),
    symbol: z.string().max(100).nullable().optional(),
    coverTitle: z.string().max(500).nullable().optional(),
  })
  .strict();

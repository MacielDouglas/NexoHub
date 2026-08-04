import { z } from "zod";

export const SexEnum = z.enum(["MALE", "FEMALE"]);
export type Sex = z.infer<typeof SexEnum>;

export const sexLabels: Record<Sex, string> = {
  MALE: "Masculino",
  FEMALE: "Feminino",
};

export const PersonSectionSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  sex: SexEnum,
  active: z.boolean().default(true),
  young: z.boolean().default(false),
  batizado: z.boolean().default(false),
  limpeza: z.boolean().default(true),
  estudante: z.boolean().default(true),
  privilegioServico: z.boolean().default(false),

  chefeFamilia: z.boolean().default(false),
  casada: z.boolean().default(false),
  familyId: z.string().nullable().optional(),

  iniciarConversas: z.boolean().default(false),
  cultivarInteresse: z.boolean().default(false),
  fazerDiscipulos: z.boolean().default(false),
  explicarCrencas: z.boolean().default(false),

  leituraBiblia: z.boolean().default(false),
  microfoneVolante: z.boolean().default(false),
  som: z.boolean().default(false),
  video: z.boolean().default(false),
  palco: z.boolean().default(false),

  leitorEstudoBiblico: z.boolean().default(false),
  leitorSentinela: z.boolean().default(false),
  indicador: z.boolean().default(false),
  oracao: z.boolean().default(false),

  anciao: z.boolean().default(false),
  presidenteVidaMinisterio: z.boolean().default(false),
  discursoTesouros: z.boolean().default(false),
  joiasEspirituais: z.boolean().default(false),
  nossaVidaCrista: z.boolean().default(false),
  necessidadesLocais: z.boolean().default(false),
  condutorEstudoBiblico: z.boolean().default(false),
  presidenteFimSemana: z.boolean().default(false),
  discursoPublico: z.boolean().default(false),
  condutorSentinela: z.boolean().default(false),

  userId: z.string().nullable().optional(),
  familyName: z.string().trim().nullable().optional(),
});

export type PersonFormData = z.infer<typeof PersonSectionSchema>;

export const FamilySchema = z.object({
  name: z.string().trim().min(1, "Nome da família é obrigatório"),
});

export type FamilyFormData = z.infer<typeof FamilySchema>;

export function showPrivilegioServico(sex: Sex, batizado: boolean): boolean {
  return sex === "MALE" && batizado;
}

export function showDesignacoes(sex: Sex): boolean {
  return sex === "MALE";
}

export function showPrivilegios(sex: Sex, batizado: boolean): boolean {
  return sex === "MALE" && batizado;
}

export function showPrivilegiosServico(
  sex: Sex,
  batizado: boolean,
  privilegioServico: boolean,
): boolean {
  return sex === "MALE" && batizado && privilegioServico;
}

export function canBeChefeFamilia(young: boolean): boolean {
  return !young;
}

export function canBeCasada(young: boolean, familyId: string | null): boolean {
  return !young && Boolean(familyId);
}

export function validateFamilyRules(
  data: PersonFormData,
  existingFamilies: {
    id: string;
    name: string;
    chefeId?: string | null;
    marriedMaleId?: string | null;
    marriedFemaleId?: string | null;
  }[],
  currentPersonId?: string,
): string | null {
  if (data.chefeFamilia) {
    if (data.young) return "Jovem não pode ser chefe de família";
    if (!data.familyName?.trim())
      return "Digite o nome da família para o chefe";
    const nameLower = data.familyName.trim().toLowerCase();
    const conflict = existingFamilies.find(
      (f) =>
        f.name.toLowerCase() === nameLower && f.chefeId !== currentPersonId,
    );
    if (conflict) return "Já existe uma família com este nome";
  }

  if (data.casada) {
    if (data.young) return "Pessoa casada não pode ser jovem";
    const hasFamily =
      Boolean(data.familyId) ||
      (data.chefeFamilia && Boolean(data.familyName?.trim()));
    if (!hasFamily) return "Pessoa casada deve pertencer a uma família";
    if (data.familyId) {
      const family = existingFamilies.find((f) => f.id === data.familyId);
      if (!family) return "Família selecionada não existe";
      if (data.sex === "MALE" && family.marriedMaleId) {
        return "Esta família já tem um homem casado";
      }
      if (data.sex === "FEMALE" && family.marriedFemaleId) {
        return "Esta família já tem uma mulher casada";
      }
    }
  }

  if (data.chefeFamilia && data.casada) {
    if (!data.familyName?.trim())
      return "Chefe de família casado precisa de nome da família";
  }

  return null;
}

export const personSections = [
  {
    id: "obrigatorios",
    label: "Obrigatórios",
    fields: [
      "name",
      "sex",
      "active",
      "young",
      "batizado",
      "limpeza",
      "estudante",
      "privilegioServico",
    ],
  },
  {
    id: "familia",
    label: "Família",
    fields: ["chefeFamilia", "casada"],
  },
  {
    id: "aspectosGerais",
    label: "Aspectos Gerais (Reuniões)",
    fields: [
      "iniciarConversas",
      "cultivarInteresse",
      "fazerDiscipulos",
      "explicarCrencas",
    ],
  },
  {
    id: "designacoes",
    label: "Designações (Reuniões - Masculino)",
    fields: ["leituraBiblia", "microfoneVolante", "som", "video", "palco"],
  },
  {
    id: "privilegios",
    label: "Privilégios (Reuniões - Masculino Batizado)",
    fields: ["leitorEstudoBiblico", "leitorSentinela", "indicador", "oracao"],
  },
  {
    id: "privilegiosServico",
    label:
      "Privilégios de Serviço (Reuniões - Masculino Batizado + Privilégio)",
    fields: [
      "anciao",
      "presidenteVidaMinisterio",
      "discursoTesouros",
      "joiasEspirituais",
      "nossaVidaCrista",
      "necessidadesLocais",
      "condutorEstudoBiblico",
      "presidenteFimSemana",
      "discursoPublico",
      "condutorSentinela",
    ],
  },
] as const;

export type PersonSectionId = (typeof personSections)[number]["id"];

export function getVisibleSections(
  sex: Sex,
  batizado: boolean,
  privilegioServico: boolean,
): PersonSectionId[] {
  const visible: PersonSectionId[] = [
    "obrigatorios",
    "familia",
    "aspectosGerais",
  ];

  if (showDesignacoes(sex)) visible.push("designacoes");
  if (showPrivilegios(sex, batizado)) visible.push("privilegios");
  if (showPrivilegiosServico(sex, batizado, privilegioServico)) {
    visible.push("privilegiosServico");
  }

  return visible;
}

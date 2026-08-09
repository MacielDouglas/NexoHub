export type MeetingType = "midweek" | "weekend" | "memorial";

export type Person = {
  id: string;
  name: string;
  sex: string;
  active: boolean;
  young: boolean;
  batizado: boolean;
  estudante: boolean;
  privilegioServico: boolean;
  anciao: boolean;
  chefeFamilia: boolean;
  casada: boolean;
  familyId: string | null;
  iniciarConversas: boolean;
  cultivarInteresse: boolean;
  fazerDiscipulos: boolean;
  explicarCrencas: boolean;
  leituraBiblia: boolean;
  leitorEstudoBiblico: boolean;
  indicador: boolean;
  oracao: boolean;
  nossaVidaCrista: boolean;
  necessidadesLocais: boolean;
  condutorEstudoBiblico: boolean;
  condutorSentinela: boolean;
  discursoTesouros: boolean;
  joiasEspirituais: boolean;
  discursoPublico: boolean;
  presidenteVidaMinisterio: boolean;
  presidenteFimSemana: boolean;
};

export type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
  defaultSentinelaConductorId: string | null;
};

export type SpecialEvent = {
  id: string;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
};

export type ApostilaParte = {
  order: number;
  parte: string;
  tema: string;
  tempo: string;
  modalidade: string | null;
  fonte: string | null;
};

export type ApostilaSecao = {
  secao: string;
  cancionMedia?: number | null;
  partes: ApostilaParte[];
};

export type ApostilaSemana = {
  id: string;
  semana: string;
  dateRange: string;
  canticoInicial: number | null;
  secoes: ApostilaSecao[];
  canticoFinal: number | null;
};

export type CatalogItem = {
  id: string;
  number: number | null;
  theme: string;
};

export type SentinelaSongRef = { number: number | null; title: string };

export type SentinelaWeek = {
  id: string;
  week: string;
  theme: string;
  songs: { opening: SentinelaSongRef; closing: SentinelaSongRef };
};

export type SubOrgPersonItem = {
  id: string;
  name: string;
  talks: string[];
};

export type SubOrg = {
  id: string;
  name: string;
  people: SubOrgPersonItem[];
};

export type PersonTalk = {
  personId: string;
  meetingContentItemId: string;
};

export type Assignment = {
  id: string;
  role: string;
  sortOrder: number;
  personId: string | null;
  subOrgPersonId: string | null;
  contentItemId: string | null;
  value: string | null;
  person: { id: string; name: string } | null;
  subOrgPerson: {
    id: string;
    name: string;
    subOrganization: { id: string; name: string };
  } | null;
  contentItem: { id: string; data: Record<string, unknown> } | null;
};

export type MeetingRecord = {
  id: string;
  type: MeetingType;
  weekStart: string;
  program: MidweekProgram | null;
  assignments: Assignment[];
};

export type DerivedMeeting = {
  type: MeetingType;
  date: Date;
  time: string;
};

export type WeekDerivation = {
  blocked: boolean;
  blockingEvents: SpecialEvent[];
  memorialEvent: SpecialEvent | null;
  meetings: DerivedMeeting[];
};

export type SlotKind =
  | "person"
  | "personMulti"
  | "song"
  | "discurso"
  | "text"
  | "personDual"
  | "orador";

export type Slot = {
  role: string;
  labelKey: string;
  kind: SlotKind;
  sortOrder: number;
  dualOf?: string;
  conflictsWith?: string;
  eligibility?: string;
};

export type Draft = {
  role: string;
  sortOrder: number;
  personId: string | null;
  subOrgPersonId: string | null;
  contentItemId: string | null;
  value: string | null;
};

export type MidweekRowKind =
  | "presidente"
  | "song"
  | "static"
  | "person"
  | "personDual"
  | "discurso";

export type MidweekSecondary = {
  role: string;
  label: string;
  eligibility?: string;
  dualOf?: string;
};

export type MidweekRow = {
  key: string;
  kind: MidweekRowKind;
  title: string;
  tempoMin: number;
  clockAdd?: number;
  role: string;
  eligibility?: string;
  dualOf?: string;
  secondary?: MidweekSecondary;
  fixed?: boolean;
};

export type MidweekSection = {
  key: string;
  title: string;
  rows: MidweekRow[];
};

export type MidweekProgram = {
  version: number;
  sections: MidweekSection[];
};

export const WEEKLY_BLOCKING_EVENT_TYPES = [
  "convention",
  "assemblyTraveling",
  "assemblyRepresentative",
] as const;

export const SPECIAL_EVENT_TYPES = [
  "memorial",
  "specialTalk",
  "circuitVisit",
  "convention",
  "assemblyTraveling",
  "assemblyRepresentative",
  "specialMeeting",
] as const;

const WEEKDAY_LABELS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function eachDayInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(start);
  const last = startOfDay(end);
  while (current <= last) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function eventDatesInRange(
  start: Date,
  end: Date,
  events: SpecialEvent[],
): SpecialEvent[] {
  const s = startOfDay(start);
  const e = startOfDay(end);
  return events.filter((ev) => {
    const date = parseDateKey(ev.date);
    const endDate = ev.endDate ? parseDateKey(ev.endDate) : date;
    return endDate >= s && date <= e;
  });
}

export function deriveWeek(
  weekStart: Date,
  configs: MeetingConfig[],
  events: SpecialEvent[],
): WeekDerivation {
  const weekEnd = addDays(weekStart, 6);
  const weekEvents = eventDatesInRange(weekStart, weekEnd, events);
  const blockingEvents = weekEvents.filter((ev) =>
    (WEEKLY_BLOCKING_EVENT_TYPES as readonly string[]).includes(ev.type),
  );
  const memorialEvent = weekEvents.find((ev) => ev.type === "memorial") ?? null;
  const circuitVisit = weekEvents.find((ev) => ev.type === "circuitVisit");

  const midweekConfig = configs.find((c) => c.type === "midweek" && c.isActive);
  const weekendConfig = configs.find((c) => c.type === "weekend" && c.isActive);

  const midweekDay = circuitVisit ? 2 : (midweekConfig?.dayOfWeek ?? 2);

  const meetings: DerivedMeeting[] = [];

  if (!memorialEvent) {
    if (midweekConfig) {
      meetings.push({
        type: "midweek",
        date: addDays(weekStart, (midweekDay + 6) % 7),
        time: midweekConfig.startTime,
      });
    }
    if (weekendConfig) {
      meetings.push({
        type: "weekend",
        date: addDays(weekStart, (weekendConfig.dayOfWeek + 6) % 7),
        time: weekendConfig.startTime,
      });
    }
  } else {
    const memorialDay = parseDateKey(memorialEvent.date).getDay();
    const memorialIsWeekend = memorialDay === 0 || memorialDay === 6;

    if (midweekConfig && memorialIsWeekend) {
      meetings.push({
        type: "midweek",
        date: addDays(weekStart, (midweekDay + 6) % 7),
        time: midweekConfig.startTime,
      });
    }
    if (weekendConfig && !memorialIsWeekend) {
      meetings.push({
        type: "weekend",
        date: addDays(weekStart, (weekendConfig.dayOfWeek + 6) % 7),
        time: weekendConfig.startTime,
      });
    }
    meetings.push({
      type: "memorial",
      date: parseDateKey(memorialEvent.date),
      time: memorialEvent.time ?? "",
    });
  }

  return {
    blocked: blockingEvents.length > 0,
    blockingEvents,
    memorialEvent,
    meetings,
  };
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const fmt = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${fmt(weekStart)} – ${fmt(end)}/${weekStart.getFullYear()}`;
}

export function formatFullDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

export function formatShortDay(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

export function slotMissing(slots: Slot[], role: string): boolean {
  return !slots.some((s) => s.role === role);
}

export function buildSlots(
  type: MeetingType,
  apostilaWeek: ApostilaSemana | null,
): Slot[] {
  if (type === "midweek") {
    const slots: Slot[] = [
      {
        role: "presidente",
        labelKey: "meetings.roles.presidente",
        kind: "person",
        sortOrder: 1,
        eligibility: "presidenteVidaMinisterio",
      },
      {
        role: "canticoInicial",
        labelKey: "meetings.roles.canticoInicial",
        kind: "song",
        sortOrder: 2,
      },
    ];

    if (apostilaWeek) {
      let order = 10;
      for (let si = 0; si < apostilaWeek.secoes.length; si++) {
        const sec = apostilaWeek.secoes[si];
        if (sec.cancionMedia != null && slotMissing(slots, "cancionMedia")) {
          slots.push({
            role: "cancionMedia",
            labelKey: "meetings.roles.canticoMeio",
            kind: "song",
            sortOrder: order++,
          });
        }
        for (let pi = 0; pi < sec.partes.length; pi++) {
          const parte = sec.partes[pi];
          const baseRole = `secao:${si}:${parte.order}`;
          const mapped = mapApostilaPart(
            sec.secao,
            parte.parte,
            baseRole,
            parte.modalidade ?? null,
            pi,
          );
          for (const m of mapped) {
            slots.push({ ...m, sortOrder: order++ });
          }
        }
      }
    }

    slots.push({
      role: "canticoFinal",
      labelKey: "meetings.roles.canticoFinal",
      kind: "song",
      sortOrder: 100,
    });

    slots.push({
      role: "oracao",
      labelKey: "meetings.roles.oracao",
      kind: "person",
      sortOrder: 101,
      eligibility: "oracaoMale",
    });

    return slots;
  }

  if (type === "weekend") {
    return [
      {
        role: "presidente",
        labelKey: "meetings.roles.presidente",
        kind: "person",
        sortOrder: 1,
        eligibility: "presidenteFimSemana",
      },
      {
        role: "canticoInicial",
        labelKey: "meetings.roles.canticoInicial",
        kind: "song",
        sortOrder: 2,
      },
      {
        role: "discurso",
        labelKey: "meetings.roles.discurso",
        kind: "discurso",
        sortOrder: 3,
      },
      {
        role: "orador",
        labelKey: "meetings.roles.orador",
        kind: "person",
        sortOrder: 4,
        eligibility: "discursoPublico",
      },
      {
        role: "canticoMeio",
        labelKey: "meetings.roles.canticoMeio",
        kind: "song",
        sortOrder: 5,
      },
      {
        role: "condutorSentinela",
        labelKey: "meetings.roles.condutor",
        kind: "person",
        sortOrder: 6,
        eligibility: "condutorEstudoBiblico",
        conflictsWith: "leitorSentinela",
      },
      {
        role: "leitorSentinela",
        labelKey: "meetings.roles.leitor",
        kind: "person",
        sortOrder: 7,
        dualOf: "condutorSentinela",
        conflictsWith: "condutorSentinela",
        eligibility: "leitorEstudoBiblico",
      },
      {
        role: "canticoFinal",
        labelKey: "meetings.roles.canticoFinal",
        kind: "song",
        sortOrder: 8,
      },
    ];
  }

  return [
    {
      role: "presidente",
      labelKey: "meetings.roles.presidente",
      kind: "person",
      sortOrder: 1,
      eligibility: "presidenteFimSemana",
    },
    {
      role: "canticoInicial",
      labelKey: "meetings.roles.canticoInicial",
      kind: "song",
      sortOrder: 2,
    },
    {
      role: "discurso",
      labelKey: "meetings.roles.discurso",
      kind: "discurso",
      sortOrder: 3,
    },
    {
      role: "orador",
      labelKey: "meetings.roles.orador",
      kind: "orador",
      sortOrder: 4,
    },
    {
      role: "passarPao",
      labelKey: "meetings.roles.passarPao",
      kind: "personMulti",
      sortOrder: 5,
      eligibility: "batizadoMale",
    },
    {
      role: "passarVinho",
      labelKey: "meetings.roles.passarVinho",
      kind: "personMulti",
      sortOrder: 6,
      eligibility: "batizadoMale",
    },
    {
      role: "canticoFinal",
      labelKey: "meetings.roles.canticoFinal",
      kind: "song",
      sortOrder: 7,
    },
    {
      role: "indicador",
      labelKey: "meetings.roles.indicador",
      kind: "personMulti",
      sortOrder: 8,
      eligibility: "indicadorMale",
    },
  ];
}

export function mapApostilaPart(
  secao: string,
  parteTitulo: string,
  baseRole: string,
  modalidade: string | null,
  partIndex: number,
): Omit<Slot, "sortOrder">[] {
  const s = secao.trim().toLowerCase();
  const p = parteTitulo.trim().toLowerCase();

  const isTesouros =
    s.includes("tesouros") || s.includes("tesoros") || s.includes("perlas");
  const isMinisterio =
    s.includes("ministério") ||
    s.includes("melhor no minist") ||
    s.includes("minist") ||
    s.includes("mejores maestros") ||
    s.includes("melhores maestros") ||
    s.includes("mestres");
  const isVidaCrista =
    s.includes("nossa vida cristã") ||
    s.includes("nossa vida crista") ||
    s.includes("nuestra vida cristiana");

  const isIniciarConversas =
    p.includes("iniciando conversas") ||
    p.includes("comece conversas") ||
    p.includes("empiece conversaciones") ||
    p.includes("inicie conversaciones");
  const isCultivarInteresse =
    p.includes("cultivando o interesse") ||
    p.includes("faça revisitas") ||
    p.includes("faça boas revisitas") ||
    p.includes("haga revisitas") ||
    p.includes("haga buenas revisitas");
  const isOQueDiria =
    p.includes("o que você diria") ||
    p.includes("o que voce diria") ||
    p.includes("qué diría usted") ||
    p.includes("que diria usted") ||
    p.includes("qué diría");
  const isFazerDiscipulos =
    p.includes("fazendo discípulos") ||
    p.includes("fazendo discipulos") ||
    p.includes("faça discípulos") ||
    p.includes("faça discipulos") ||
    p.includes("haga discípulos") ||
    p.includes("haga discipulos");
  const isExplicarCrencas =
    p.includes("explicando suas crenças") ||
    p.includes("explicando suas crencas") ||
    p.includes("explique suas crenças") ||
    p.includes("explique suas crencas") ||
    p.includes("explique sus creencias");
  const isDiscurso = p.includes("discurso") && !isExplicarCrencas;
  const isLeituraBiblia =
    p.includes("leitura da bíblia") ||
    p.includes("leitura da biblia") ||
    p.includes("lectura de la biblia");
  const isEstudoBiblico =
    p.includes("estudo bíblico") ||
    p.includes("estudo biblico") ||
    p.includes("estudio bíblico") ||
    p.includes("estudio biblico");

  if (isTesouros) {
    if (partIndex === 0) {
      return [
        {
          role: baseRole,
          labelKey: "meetings.parte",
          kind: "person",
          eligibility: "discursoTesouros",
        },
      ];
    }
    if (partIndex === 1 || isLeituraBiblia) {
      return [
        {
          role: baseRole,
          labelKey: "meetings.parte",
          kind: "person",
          eligibility: isLeituraBiblia ? "maleEstudante" : "joiasEspirituais",
        },
      ];
    }
    return [
      {
        role: baseRole,
        labelKey: "meetings.parte",
        kind: "person",
        eligibility: "maleEstudante",
      },
    ];
  }

  if (isMinisterio) {
    if (isIniciarConversas) {
      return [
        {
          role: `${baseRole}:estudante`,
          labelKey: "meetings.parte",
          kind: "personDual",
          dualOf: `${baseRole}:estudante`,
          eligibility: "estudanteIniciarConversas",
        },
        {
          role: `${baseRole}:ajudante`,
          labelKey: "meetings.parteAjudante",
          kind: "person",
          eligibility: "ajudanteMesmoSexoOuFamilia",
          dualOf: `${baseRole}:estudante`,
        },
      ];
    }
    if (isCultivarInteresse) {
      return [
        {
          role: `${baseRole}:estudante`,
          labelKey: "meetings.parte",
          kind: "personDual",
          dualOf: `${baseRole}:estudante`,
          eligibility: "estudanteCultivarInteresse",
        },
        {
          role: `${baseRole}:ajudante`,
          labelKey: "meetings.parteAjudante",
          kind: "person",
          eligibility: "ajudanteMesmoSexo",
          dualOf: `${baseRole}:estudante`,
        },
      ];
    }
    if (isOQueDiria) {
      return [
        {
          role: baseRole,
          labelKey: "meetings.parte",
          kind: "person",
          eligibility: "presidenciaAnciano",
        },
      ];
    }
    if (isFazerDiscipulos) {
      return [
        {
          role: `${baseRole}:estudante`,
          labelKey: "meetings.parte",
          kind: "personDual",
          dualOf: `${baseRole}:estudante`,
          eligibility: "estudanteFazerDiscipulos",
        },
        {
          role: `${baseRole}:ajudante`,
          labelKey: "meetings.parteAjudante",
          kind: "person",
          eligibility: "ajudanteMesmoSexo",
          dualOf: `${baseRole}:estudante`,
        },
      ];
    }
    if (isExplicarCrencas) {
      const isDiscursoModalidade = (modalidade ?? "")
        .toLowerCase()
        .includes("discurso");
      if (isDiscursoModalidade) {
        return [
          {
            role: baseRole,
            labelKey: "meetings.parte",
            kind: "person",
            eligibility: "maleEstudante",
          },
        ];
      }
      return [
        {
          role: `${baseRole}:estudante`,
          labelKey: "meetings.parte",
          kind: "personDual",
          dualOf: `${baseRole}:estudante`,
          eligibility: "estudanteExplicarCrencas",
        },
        {
          role: `${baseRole}:ajudante`,
          labelKey: "meetings.parteAjudante",
          kind: "person",
          eligibility: "ajudanteMesmoSexoOuFamilia",
          dualOf: `${baseRole}:estudante`,
        },
      ];
    }
    if (isDiscurso) {
      return [
        {
          role: baseRole,
          labelKey: "meetings.parte",
          kind: "person",
          eligibility: "maleEstudante",
        },
      ];
    }
  }

  if (isVidaCrista) {
    if (isEstudoBiblico) {
      return [
        {
          role: `${baseRole}:condutor`,
          labelKey: "meetings.parte",
          kind: "person",
          eligibility: "condutorEstudoBiblico",
          conflictsWith: `${baseRole}:leitor`,
        },
        {
          role: `${baseRole}:leitor`,
          labelKey: "meetings.parteLeitor",
          kind: "person",
          eligibility: "leitorEstudoBiblico",
          conflictsWith: `${baseRole}:condutor`,
        },
      ];
    }
    return [
      {
        role: baseRole,
        labelKey: "meetings.parte",
        kind: "person",
        eligibility: "nossaVidaCrista",
      },
    ];
  }

  return [
    {
      role: baseRole,
      labelKey: "meetings.parte",
      kind: "person",
      eligibility: "any",
    },
  ];
}

export function slotLabel(
  slot: Slot,
  apostilaWeek: ApostilaSemana | null,
  t: (key: string) => string,
): string {
  if (slot.role.startsWith("secao:")) {
    const parts = slot.role.split(":");
    const si = Number(parts[1]);
    const pi = Number(parts[2]);
    const suffix = parts[3] ?? "";
    const sec = apostilaWeek?.secoes[si];
    const parte = sec?.partes.find((p) => p.order === pi);
    if (sec && parte) {
      const base = `${sec.secao} — ${parte.parte}`;
      const meta = partMeta(parte);
      const title = meta.length ? `${base} (${meta.join(" · ")})` : base;
      if (suffix === "ajudante")
        return `${title} · ${t("meetings.parteAjudante")}`;
      if (suffix === "leitor")
        return `${title} · ${t("meetings.roles.leitor")}`;
      if (suffix === "condutor")
        return `${title} · ${t("meetings.roles.condutor")}`;
      return title;
    }
  }
  return t(slot.labelKey);
}

export function partMeta(parte: ApostilaParte): string[] {
  return ([parte.tema, parte.modalidade] as (string | null)[])
    .filter((v): v is string => v !== null && v !== "—")
    .filter((v) => v.trim().toLowerCase() !== parte.parte.trim().toLowerCase());
}

export function eligiblePeople(
  slot: Slot,
  people: Person[],
  drafts: Draft[],
): Person[] {
  const active = people.filter((p) => p.active);

  const getEstudanteId = (dualOf: string) => {
    const d = drafts.find((x) => x.role === dualOf);
    return d?.personId ?? null;
  };

  const getEstudante = (dualOf: string) => {
    const id = getEstudanteId(dualOf);
    return id ? (active.find((p) => p.id === id) ?? null) : null;
  };

  let base: Person[];
  switch (slot.eligibility) {
    case "presidenteVidaMinisterio":
      base = active.filter((p) => p.presidenteVidaMinisterio);
      break;
    case "presidenteFimSemana":
      base = active.filter((p) => p.presidenteFimSemana);
      break;
    case "discursoPublico":
      base = active.filter((p) => p.discursoPublico);
      break;
    case "batizadoMale":
      base = active.filter((p) => p.sex === "MALE" && p.batizado);
      break;
    case "indicadorMale":
      base = active.filter((p) => p.sex === "MALE" && p.indicador);
      break;
    case "oracaoMale":
      base = active.filter((p) => p.sex === "MALE" && p.oracao);
      break;
    case "discursoTesouros":
      base = active.filter((p) => p.discursoTesouros);
      break;
    case "joiasEspirituais":
      base = active.filter((p) => p.joiasEspirituais);
      break;
    case "maleEstudante":
      base = active.filter((p) => p.sex === "MALE" && p.estudante);
      break;
    case "estudanteAny":
      base = active.filter((p) => p.estudante);
      break;
    case "estudanteIniciarConversas":
      base = active.filter((p) => p.estudante && p.iniciarConversas);
      break;
    case "estudanteCultivarInteresse":
      base = active.filter((p) => p.estudante && p.cultivarInteresse);
      break;
    case "estudanteFazerDiscipulos":
      base = active.filter((p) => p.estudante && p.fazerDiscipulos);
      break;
    case "estudanteExplicarCrencas":
      base = active.filter((p) => p.estudante && p.explicarCrencas);
      break;
    case "presidenciaAnciano":
      base = active.filter(
        (p) => p.presidenteVidaMinisterio || p.anciao || p.privilegioServico,
      );
      break;
    case "condutorEstudoBiblico":
      base = active.filter((p) => p.condutorEstudoBiblico || p.anciao);
      break;
    case "leitorEstudoBiblico":
      base = active.filter(
        (p) => p.sex === "MALE" && p.batizado && p.leitorEstudoBiblico,
      );
      break;
    case "nossaVidaCrista":
      base = active.filter(
        (p) => p.anciao || p.privilegioServico || p.nossaVidaCrista,
      );
      break;
    case "ajudanteMesmoSexo": {
      const estudante = getEstudante(slot.dualOf ?? "");
      if (!estudante) {
        base = active.filter((p) => p.estudante);
      } else {
        base = active.filter((p) => p.sex === estudante.sex);
      }
      break;
    }
    case "ajudanteMesmoSexoOuFamilia": {
      const estudante = getEstudante(slot.dualOf ?? "");
      if (!estudante) {
        base = active.filter((p) => p.estudante);
      } else {
        base = active.filter(
          (p) =>
            p.sex === estudante.sex ||
            (estudante.familyId && p.familyId === estudante.familyId),
        );
      }
      break;
    }
    default:
      base = active;
      break;
  }

  if (slot.conflictsWith) {
    const otherId = getEstudanteId(slot.conflictsWith);
    if (otherId) {
      base = base.filter((p) => p.id !== otherId);
    }
  }

  return base;
}

function parseTimeToMinutes(hm: string): number {
  const m = hm.match(/(\d+):(\d+)/);
  if (!m) return 19 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function formatMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function parseTempoToMinutes(tempo: string): number {
  const m = tempo.match(/(\d+)/);
  return m ? Number(m[1]) : 5;
}

export function midweekSectionKind(
  secao: string,
): "tesouros" | "ministerio" | "vidaCrista" | "other" {
  const s = secao.trim().toLowerCase();
  if (s.includes("tesouros") || s.includes("tesoros") || s.includes("perlas"))
    return "tesouros";
  if (s.includes("maestros") || s.includes("mestres") || s.includes("minist"))
    return "ministerio";
  if (s.includes("vida crist") || s.includes("nossa vida")) return "vidaCrista";
  return "other";
}

export function parseSectionRole(
  role: string,
): { si: number; order: number; suffix: string } | null {
  if (!role.startsWith("secao:")) return null;
  const parts = role.split(":");
  return {
    si: Number(parts[1]),
    order: Number(parts[2]),
    suffix: parts[3] ?? "",
  };
}

export function partDuration(
  sec: ApostilaSecao,
  parte: ApostilaParte,
): { tempoMin: number; clockAdd: number } {
  const base = parseTempoToMinutes(parte.tempo);
  if (midweekSectionKind(sec.secao) === "ministerio") {
    return { tempoMin: base, clockAdd: base + 1 };
  }
  return { tempoMin: base, clockAdd: base };
}

export function buildMidweekProgram(
  apostilaWeek: ApostilaSemana | null,
  slots: Slot[],
  t: (key: string) => string,
): MidweekSection[] {
  const sections: MidweekSection[] = [];
  const slotByRole = new Map(slots.map((s) => [s.role, s]));

  const introRows: MidweekRow[] = [
    {
      key: "presidente",
      kind: "presidente",
      title: t("meetings.roles.presidente"),
      tempoMin: 0,
      role: "presidente",
      fixed: true,
    },
  ];
  if (slotByRole.has("canticoInicial")) {
    introRows.push({
      key: "canticoInicial",
      kind: "song",
      title: t("meetings.roles.canticoInicial"),
      tempoMin: 5,
      role: "canticoInicial",
      fixed: true,
    });
  }
  introRows.push({
    key: "palavrasIntroducao",
    kind: "static",
    title: t("meetings.roles.palavrasIntroducao"),
    tempoMin: 1,
    role: "palavrasIntroducao",
    fixed: true,
  });
  sections.push({
    key: "introducao",
    title: t("meetings.sections.introducao"),
    rows: introRows,
  });

  if (apostilaWeek) {
    const midSong =
      apostilaWeek.secoes.find((s) => s.cancionMedia != null)?.cancionMedia ??
      null;
    for (let si = 0; si < apostilaWeek.secoes.length; si++) {
      const sec = apostilaWeek.secoes[si];
      const kind = midweekSectionKind(sec.secao);
      const rows: MidweekRow[] = [];
      const sectionSlots = slots.filter(
        (s) => parseSectionRole(s.role)?.si === si,
      );

      if (kind === "vidaCrista" && midSong != null) {
        rows.push({
          key: "cancionMedia",
          kind: "song",
          title: t("meetings.roles.canticoMeio"),
          tempoMin: 5,
          role: "cancionMedia",
          fixed: true,
        });
      }

      for (const parte of sec.partes) {
        const partSlots = sectionSlots.filter(
          (s) => parseSectionRole(s.role)?.order === parte.order,
        );
        if (partSlots.length === 0) continue;

        const primary = partSlots.find((s) => {
          const suf = parseSectionRole(s.role)?.suffix ?? "";
          return suf === "" || suf === "estudante" || suf === "condutor";
        });
        const secondary = partSlots.find((s) => {
          const suf = parseSectionRole(s.role)?.suffix ?? "";
          return suf === "ajudante" || suf === "leitor";
        });

        const { tempoMin, clockAdd } = partDuration(sec, parte);
        const meta = partMeta(parte);
        const title = `${parte.parte}${meta.length ? ` (${meta.join(" · ")})` : ""}`;

        const row: MidweekRow = {
          key: `secao:${si}:${parte.order}`,
          kind: secondary ? "personDual" : "person",
          title,
          tempoMin,
          clockAdd,
          role: primary?.role ?? "",
          eligibility: primary?.eligibility,
          dualOf: primary?.dualOf,
        };
        if (secondary) {
          const suf = parseSectionRole(secondary.role)?.suffix ?? "";
          row.secondary = {
            role: secondary.role,
            label:
              suf === "leitor"
                ? t("meetings.roles.leitor")
                : t("meetings.parteAjudante"),
            eligibility: secondary.eligibility,
            dualOf: secondary.dualOf,
          };
        }
        rows.push(row);
      }

      sections.push({ key: `secao-${si}`, title: sec.secao, rows });
    }
  }

  const conclusaoRows: MidweekRow[] = [
    {
      key: "palavrasConclusao",
      kind: "static",
      title: t("meetings.roles.palavrasConclusao"),
      tempoMin: 3,
      role: "palavrasConclusao",
      fixed: true,
    },
  ];
  if (slotByRole.has("canticoFinal")) {
    conclusaoRows.push({
      key: "canticoFinal",
      kind: "song",
      title: t("meetings.roles.canticoFinalOracao"),
      tempoMin: 5,
      role: "canticoFinal",
      fixed: true,
    });
  }
  if (slotByRole.has("oracao")) {
    conclusaoRows.push({
      key: "oracao",
      kind: "person",
      title: t("meetings.roles.oracao"),
      tempoMin: 0,
      role: "oracao",
      fixed: true,
      eligibility: "oracaoMale",
    });
  }
  sections.push({
    key: "conclusao",
    title: t("meetings.sections.conclusao"),
    rows: conclusaoRows,
  });

  return sections;
}

export function serializeProgram(sections: MidweekSection[]): MidweekProgram {
  return {
    version: 1,
    sections: sections.map((s) => ({
      key: s.key,
      title: s.title,
      rows: s.rows.map((r) => ({ ...r })),
    })),
  };
}

const SENTINELA_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  maio: 5,
  junho: 6,
  julho: 7,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

export function parseSentinelaWeek(
  week: string,
): { start: Date; end: Date } | null {
  const sameMonth = week.match(
    /^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÑ]+)\s+DE\s+(\d{4})$/i,
  );
  if (sameMonth) {
    const month = SENTINELA_MONTHS[sameMonth[3].toLowerCase()];
    if (!month) return null;
    return {
      start: new Date(Number(sameMonth[4]), month - 1, Number(sameMonth[1])),
      end: new Date(Number(sameMonth[4]), month - 1, Number(sameMonth[2])),
    };
  }
  const crossMonth = week.match(
    /^(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÑ]+)\s*[-–]\s*(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÑ]+)\s+DE\s+(\d{4})$/i,
  );
  if (crossMonth) {
    const m1 = SENTINELA_MONTHS[crossMonth[2].toLowerCase()];
    const m2 = SENTINELA_MONTHS[crossMonth[4].toLowerCase()];
    if (!m1 || !m2) return null;
    return {
      start: new Date(Number(crossMonth[5]), m1 - 1, Number(crossMonth[1])),
      end: new Date(Number(crossMonth[5]), m2 - 1, Number(crossMonth[3])),
    };
  }
  return null;
}

export function findSentinelaForWeek(
  sentinelas: SentinelaWeek[],
  weekStart: Date,
): SentinelaWeek | null {
  return (
    sentinelas.find((s) => {
      const range = parseSentinelaWeek(s.week);
      if (!range) return false;
      const weekEnd = addDays(weekStart, 6);
      return range.start <= weekEnd && range.end >= weekStart;
    }) ?? null
  );
}

export function buildWeekendProgram(
  sentinela: SentinelaWeek | null,
  slots: Slot[],
  t: (key: string) => string,
): MidweekSection[] {
  const slotByRole = new Map(slots.map((s) => [s.role, s]));
  const sections: MidweekSection[] = [];

  const introRows: MidweekRow[] = [
    {
      key: "presidente",
      kind: "presidente",
      title: t("meetings.roles.presidente"),
      tempoMin: 0,
      role: "presidente",
      fixed: true,
    },
  ];
  if (slotByRole.has("canticoInicial")) {
    introRows.push({
      key: "canticoInicial",
      kind: "song",
      title: t("meetings.roles.canticoInicial"),
      tempoMin: 5,
      role: "canticoInicial",
      fixed: true,
    });
  }
  sections.push({
    key: "introducao",
    title: t("meetings.sections.introducao"),
    rows: introRows,
  });

  sections.push({
    key: "discursoPublico",
    title: t("meetings.sections.discursoPublico"),
    rows: [
      {
        key: "discurso",
        kind: "discurso",
        title: "",
        tempoMin: 30,
        clockAdd: 30,
        role: "discurso",
        secondary: {
          role: "orador",
          label: t("meetings.roles.orador"),
        },
      },
    ],
  });

  const estudoRows: MidweekRow[] = [];
  estudoRows.push({
    key: "canticoMeio",
    kind: "song",
    title: t("meetings.roles.canticoMeio"),
    tempoMin: 5,
    role: "canticoMeio",
    fixed: true,
  });
  estudoRows.push({
    key: "estudoSentinela",
    kind: "personDual",
    title: sentinela?.theme ?? t("meetings.sections.estudoSentinela"),
    tempoMin: 60,
    clockAdd: 60,
    role: "condutorSentinela",
    eligibility: "condutorEstudoBiblico",
    secondary: {
      role: "leitorSentinela",
      label: t("meetings.roles.leitor"),
      eligibility: "leitorEstudoBiblico",
    },
  });
  sections.push({
    key: "estudoSentinela",
    title: t("meetings.sections.estudoSentinela"),
    rows: estudoRows,
  });

  const conclusaoRows: MidweekRow[] = [];
  if (slotByRole.has("canticoFinal")) {
    conclusaoRows.push({
      key: "canticoFinal",
      kind: "song",
      title: t("meetings.roles.canticoFinalOracao"),
      tempoMin: 5,
      role: "canticoFinal",
      fixed: true,
    });
  }
  sections.push({
    key: "conclusao",
    title: t("meetings.sections.conclusao"),
    rows: conclusaoRows,
  });

  return sections;
}

export function parseTimeForClock(time: string): number {
  return parseTimeToMinutes(time);
}

export function weekdayLabel(index: number): string {
  return WEEKDAY_LABELS[index];
}

export function formatItemLabel(item: CatalogItem | null): string {
  if (!item) return "—";
  return item.number != null ? `${item.number}. ${item.theme}` : item.theme;
}

export function formatPersonDisplay(
  person: { name: string } | null,
  orgName?: string,
): string {
  if (!person) return "—";
  return orgName ? `${person.name} (${orgName})` : person.name;
}

export function findApostilaWeek(
  apostilaWeeks: ApostilaSemana[],
  weekStartKey: string,
): ApostilaSemana | null {
  return (
    apostilaWeeks.find((w) => {
      const start = w.dateRange.slice(0, 8);
      const end = w.dateRange.slice(9);
      return weekStartKey >= start && weekStartKey <= end;
    }) ?? null
  );
}

"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  addDays,
  eachDayInRange,
  eventDatesInRange,
  isSameDay,
  parseDateKey,
  startOfWeek,
  toDateKey,
  WEEKLY_BLOCKING_EVENT_TYPES,
} from "@/lib/cleaning-assignment";
import { cn } from "@/lib/utils";
import {
  generateMeetingsPdf,
  type PdfAssignment,
  type PdfMeeting,
  type PdfProgram,
} from "./meetings-pdf";

type Person = {
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

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
};

type SpecialEvent = {
  id: string;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
};

type ApostilaParte = {
  order: number;
  parte: string;
  tema: string;
  tempo: string;
  modalidade: string | null;
  fonte: string | null;
};

type ApostilaSecao = {
  secao: string;
  cancionMedia?: number | null;
  partes: ApostilaParte[];
};

type ApostilaSemana = {
  id: string;
  semana: string;
  dateRange: string;
  canticoInicial: number | null;
  secoes: ApostilaSecao[];
  canticoFinal: number | null;
};

type CatalogItem = {
  id: string;
  number: number | null;
  theme: string;
};

type PersonTalk = {
  personId: string;
  meetingContentItemId: string;
};

type Assignment = {
  id: string;
  role: string;
  sortOrder: number;
  personId: string | null;
  contentItemId: string | null;
  value: string | null;
  person: { id: string; name: string } | null;
  contentItem: { id: string; data: Record<string, unknown> } | null;
};

type MeetingRecord = {
  id: string;
  type: MeetingType;
  weekStart: string;
  program: MidweekProgram | null;
  assignments: Assignment[];
};

type MeetingType = "midweek" | "weekend" | "memorial";

const WEEKDAY_LABELS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

type DerivedMeeting = {
  type: MeetingType;
  date: Date;
  time: string;
};

type WeekDerivation = {
  blocked: boolean;
  blockingEvents: SpecialEvent[];
  memorialEvent: SpecialEvent | null;
  meetings: DerivedMeeting[];
};

function deriveWeek(
  weekStart: Date,
  configs: MeetingConfig[],
  events: SpecialEvent[],
): WeekDerivation {
  const weekEnd = addDays(weekStart, 6);
  const weekEvents = eventDatesInRange(
    weekStart,
    weekEnd,
    events,
  ) as SpecialEvent[];
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

    if (midweekConfig && !memorialIsWeekend) {
      meetings.push({
        type: "midweek",
        date: addDays(weekStart, (midweekDay + 6) % 7),
        time: midweekConfig.startTime,
      });
    }
    if (weekendConfig && memorialIsWeekend) {
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

function eventDayLabel(event: SpecialEvent): string {
  return parseDateKey(event.date).getDate().toString();
}

function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const fmt = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${fmt(weekStart)} – ${fmt(end)}/${weekStart.getFullYear()}`;
}

function formatFullDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

export function MeetingsClient({
  role,
  orgName,
}: {
  role?: string;
  orgName?: string;
}) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";
  const [pdfOpen, setPdfOpen] = useState(false);

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date()),
  );
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [apostilaWeeks, setApostilaWeeks] = useState<ApostilaSemana[]>([]);
  const [songs, setSongs] = useState<CatalogItem[]>([]);
  const [discursos, setDiscursos] = useState<CatalogItem[]>([]);
  const [personTalks, setPersonTalks] = useState<PersonTalk[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [
      configsRes,
      eventsRes,
      peopleRes,
      apostilaRes,
      songsRes,
      discursosRes,
      talksRes,
      meetingsRes,
    ] = await Promise.all([
      fetch("/api/meeting-configs"),
      fetch("/api/special-events"),
      fetch("/api/people"),
      fetch("/api/meeting-content?type=apostila&includeItems=1"),
      fetch("/api/meeting-content?type=canticos&includeItems=1"),
      fetch("/api/meeting-content?type=discursos&includeItems=1"),
      fetch("/api/person-talks"),
      fetch(`/api/meetings?weekStart=${toDateKey(weekStart)}`),
    ]);
    const [
      configsData,
      eventsData,
      peopleData,
      apostilaData,
      songsData,
      discursosData,
      talksData,
      meetingsData,
    ] = await Promise.all([
      configsRes.json(),
      eventsRes.json(),
      peopleRes.json(),
      apostilaRes.json(),
      songsRes.json(),
      discursosRes.json(),
      talksRes.json(),
      meetingsRes.json(),
    ]);

    setConfigs(configsData.configs ?? []);
    setEvents(eventsData.events ?? []);
    setPeople(peopleData.people ?? []);

    const weeks: ApostilaSemana[] = [];
    for (const c of (apostilaData.contents as Array<{
      items?: Array<{ id: string; data: Record<string, unknown> }>;
    }>) ?? []) {
      for (const it of c.items ?? []) {
        const d = it.data as unknown as ApostilaSemana;
        if (typeof d.dateRange === "string" && d.dateRange.length >= 17) {
          weeks.push({ ...d, id: it.id });
        }
      }
    }
    setApostilaWeeks(weeks);

    const toCatalog = (
      contents: Array<{
        items?: Array<{
          id: string;
          data: { number?: number | null; theme?: string };
        }>;
      }>,
    ) =>
      (contents ?? [])
        .flatMap((c) => c.items ?? [])
        .map((item) => ({
          id: item.id,
          number: item.data.number ?? null,
          theme: item.data.theme ?? "",
        }));

    setSongs(toCatalog(songsData.contents ?? []));
    setDiscursos(toCatalog(discursosData.contents ?? []));
    setPersonTalks(
      (
        (talksData.talks ?? []) as Array<{
          personId: string;
          meetingContentItemId: string;
        }>
      ).map((tk) => ({
        personId: tk.personId,
        meetingContentItemId: tk.meetingContentItemId,
      })),
    );
    setMeetings(meetingsData.meetings ?? []);
  }, [weekStart]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const derivation = useMemo(
    () => deriveWeek(weekStart, configs, events),
    [weekStart, configs, events],
  );

  const apostilaWeek = useMemo(() => {
    const key = `${weekStart.getFullYear()}${String(weekStart.getMonth() + 1).padStart(2, "0")}${String(weekStart.getDate()).padStart(2, "0")}`;
    return (
      apostilaWeeks.find((w) => {
        const start = w.dateRange.slice(0, 8);
        const end = w.dateRange.slice(9);
        return key >= start && key <= end;
      }) ?? null
    );
  }, [apostilaWeeks, weekStart]);

  const meetingsByType = useMemo(() => {
    const map = new Map<MeetingType, MeetingRecord>();
    for (const m of meetings) map.set(m.type, m);
    return map;
  }, [meetings]);

  if (loading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-0 py-4 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("meetings.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("meetings.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            aria-label={t("meetings.prevWeek")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            {t("meetings.today")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            aria-label={t("meetings.nextWeek")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-base font-semibold">
          {t("meetings.weekOf")} {formatWeekRange(weekStart)}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPdfOpen(true)}
          disabled={loading}
        >
          {t("meetings.pdf.button")}
        </Button>
      </div>

      <MeetingPdfDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        orgName={orgName}
        configs={configs}
        apostilaWeeks={apostilaWeeks}
        events={events}
        t={t as unknown as TFunc}
      />

      <WeekDaysGrid
        weekStart={weekStart}
        events={events}
        derivedMeetings={derivation.meetings}
      />

      {derivation.blocked ? (
        <BlockedWeekBanner events={derivation.blockingEvents} />
      ) : (
        <div className="mt-6 space-y-6">
          {derivation.meetings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("meetings.noMeetingsHint")}
            </p>
          )}

          {derivation.meetings.map((dm) => (
            <MeetingCard
              key={`${dm.type}-${toDateKey(dm.date)}`}
              type={dm.type}
              date={dm.date}
              time={dm.time}
              record={meetingsByType.get(dm.type) ?? null}
              canManage={canManage}
              people={people}
              songs={songs}
              discursos={discursos}
              personTalks={personTalks}
              apostilaWeek={apostilaWeek}
              onCreated={(record) =>
                setMeetings((prev) => [
                  ...prev.filter((m) => m.type !== record.type),
                  record,
                ])
              }
              onUpdated={(record) =>
                setMeetings((prev) =>
                  prev.map((m) => (m.id === record.id ? record : m)),
                )
              }
              onDeleted={(id) =>
                setMeetings((prev) => prev.filter((m) => m.id !== id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekDaysGrid({
  weekStart,
  events,
  derivedMeetings,
}: {
  weekStart: Date;
  events: SpecialEvent[];
  derivedMeetings: DerivedMeeting[];
}) {
  const { t } = useTranslation();
  const days = eachDayInRange(weekStart, addDays(weekStart, 6));
  const eventsByDay = new Map<string, SpecialEvent[]>();
  for (const ev of events) {
    const start = parseDateKey(ev.date);
    const end = ev.endDate ? parseDateKey(ev.endDate) : start;
    for (const d of eachDayInRange(start, end)) {
      const key = toDateKey(d);
      const list = eventsByDay.get(key) ?? [];
      list.push(ev);
      eventsByDay.set(key, list);
    }
  }

  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border sm:p-4">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const key = toDateKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const meeting = derivedMeetings.find((dm) => isSameDay(dm.date, day));
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border border-border/70 px-1 py-2 text-center",
                isToday && "bg-primary/10",
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {WEEKDAY_LABELS[i]}
              </span>
              <span className="text-sm font-semibold">
                {day.getDate().toString().padStart(2, "0")}
              </span>
              <div className="flex min-h-5 flex-col items-center gap-0.5">
                {meeting && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      meeting.type === "midweek" &&
                        "bg-blue-500/15 text-blue-600",
                      meeting.type === "weekend" &&
                        "bg-emerald-500/15 text-emerald-600",
                      meeting.type === "memorial" &&
                        "bg-amber-500/15 text-amber-600",
                    )}
                  >
                    {t(`meetings.types.${meeting.type}`)}
                  </span>
                )}
                {dayEvents.map((ev) => (
                  <span
                    key={ev.id}
                    className="max-w-full truncate rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    title={t(`settings.specialEventTypes.${ev.type}`)}
                  >
                    {eventDayLabel(ev)} ·{" "}
                    {t(`settings.specialEventTypes.${ev.type}`)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockedWeekBanner({ events }: { events: SpecialEvent[] }) {
  const { t } = useTranslation();
  return (
    <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm dark:border-amber-600/50 dark:bg-amber-950/40">
      <h2 className="text-lg font-semibold">{t("meetings.blockedTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("meetings.blockedDescription")}
      </p>
      <ul className="mt-3 space-y-1.5">
        {events.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {t(`settings.specialEventTypes.${ev.type}`)}
            </span>
            <span className="text-muted-foreground">
              · {formatFullDate(parseDateKey(ev.date))}
              {ev.endDate
                ? ` – ${formatFullDate(parseDateKey(ev.endDate))}`
                : ""}
              {ev.time ? ` · ${ev.time}` : ""}
              {ev.location ? ` · ${ev.location}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SlotKind =
  | "person"
  | "personMulti"
  | "song"
  | "discurso"
  | "text"
  | "personDual";

type Slot = {
  role: string;
  labelKey: string;
  kind: SlotKind;
  sortOrder: number;
  dualOf?: string; // role do slot estudante para filtrar ajudante
  eligibility?: string; // identificador da regra de elegibilidade
};

type Draft = {
  role: string;
  sortOrder: number;
  personId: string | null;
  contentItemId: string | null;
  value: string | null;
};

function slotMissing(slots: Slot[], role: string): boolean {
  return !slots.some((s) => s.role === role);
}

function buildSlots(
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
        role: "canticoFinal",
        labelKey: "meetings.roles.canticoFinal",
        kind: "song",
        sortOrder: 5,
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
      kind: "person",
      sortOrder: 4,
      eligibility: "discursoPublico",
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

function mapApostilaPart(
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
        },
        {
          role: `${baseRole}:leitor`,
          labelKey: "meetings.parteLeitor",
          kind: "person",
          eligibility: "leitorEstudoBiblico",
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

function slotLabel(
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

function eligiblePeople(
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

  switch (slot.eligibility) {
    case "presidenteVidaMinisterio":
      return active.filter((p) => p.presidenteVidaMinisterio);
    case "presidenteFimSemana":
      return active.filter((p) => p.presidenteFimSemana);
    case "discursoPublico":
      return active.filter((p) => p.discursoPublico);
    case "batizadoMale":
      return active.filter((p) => p.sex === "MALE" && p.batizado);
    case "indicadorMale":
      return active.filter((p) => p.sex === "MALE" && p.indicador);
    case "discursoTesouros":
      return active.filter((p) => p.discursoTesouros);
    case "joiasEspirituais":
      return active.filter((p) => p.joiasEspirituais);
    case "maleEstudante":
      return active.filter((p) => p.sex === "MALE" && p.estudante);
    case "estudanteAny":
      return active.filter((p) => p.estudante);
    case "estudanteIniciarConversas":
      return active.filter((p) => p.estudante && p.iniciarConversas);
    case "estudanteCultivarInteresse":
      return active.filter((p) => p.estudante && p.cultivarInteresse);
    case "estudanteFazerDiscipulos":
      return active.filter((p) => p.estudante && p.fazerDiscipulos);
    case "estudanteExplicarCrencas":
      return active.filter((p) => p.estudante && p.explicarCrencas);
    case "presidenciaAnciano":
      return active.filter(
        (p) => p.presidenteVidaMinisterio || p.anciao || p.privilegioServico,
      );
    case "condutorEstudoBiblico":
      return active.filter((p) => p.condutorEstudoBiblico || p.anciao);
    case "leitorEstudoBiblico":
      return active.filter(
        (p) => p.sex === "MALE" && p.batizado && p.leitorEstudoBiblico,
      );
    case "nossaVidaCrista":
      return active.filter(
        (p) => p.anciao || p.privilegioServico || p.nossaVidaCrista,
      );
    case "ajudanteMesmoSexo": {
      const estudante = getEstudante(slot.dualOf ?? "");
      if (!estudante) return active.filter((p) => p.estudante);
      return active.filter((p) => p.sex === estudante.sex);
    }
    case "ajudanteMesmoSexoOuFamilia": {
      const estudante = getEstudante(slot.dualOf ?? "");
      if (!estudante) return active.filter((p) => p.estudante);
      return active.filter(
        (p) =>
          p.sex === estudante.sex ||
          (estudante.familyId && p.familyId === estudante.familyId),
      );
    }
    default:
      return active;
  }
}

type MidweekRowKind =
  | "presidente"
  | "song"
  | "static"
  | "person"
  | "personDual";

type MidweekSecondary = {
  role: string;
  label: string;
  eligibility?: string;
  dualOf?: string;
};

type MidweekRow = {
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

type MidweekSection = {
  key: string;
  title: string;
  rows: MidweekRow[];
};

type MidweekProgram = {
  version: number;
  sections: MidweekSection[];
};

function parseTimeToMinutes(hm: string): number {
  const m = hm.match(/(\d+):(\d+)/);
  if (!m) return 19 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function parseTempoToMinutes(tempo: string): number {
  const m = tempo.match(/(\d+)/);
  return m ? Number(m[1]) : 5;
}

function partMeta(parte: ApostilaParte): string[] {
  return ([parte.tema, parte.modalidade] as (string | null)[])
    .filter((v): v is string => v !== null && v !== "—")
    .filter((v) => v.trim().toLowerCase() !== parte.parte.trim().toLowerCase());
}

function midweekSectionKind(
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

function parseSectionRole(
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

function partDuration(
  sec: ApostilaSecao,
  parte: ApostilaParte,
): { tempoMin: number; clockAdd: number } {
  const base = parseTempoToMinutes(parte.tempo);
  if (midweekSectionKind(sec.secao) === "ministerio") {
    return { tempoMin: base, clockAdd: base + 1 };
  }
  return { tempoMin: base, clockAdd: base };
}

function buildMidweekProgram(
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
  sections.push({
    key: "conclusao",
    title: t("meetings.sections.conclusao"),
    rows: conclusaoRows,
  });

  return sections;
}

function serializeProgram(sections: MidweekSection[]): MidweekProgram {
  return {
    version: 1,
    sections: sections.map((s) => ({
      key: s.key,
      title: s.title,
      rows: s.rows.map((r) => ({ ...r })),
    })),
  };
}

function MeetingCard({
  type,
  date,
  time,
  record,
  canManage,
  people,
  songs,
  discursos,
  personTalks,
  apostilaWeek,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  type: MeetingType;
  date: Date;
  time: string;
  record: MeetingRecord | null;
  canManage: boolean;
  people: Person[];
  songs: CatalogItem[];
  discursos: CatalogItem[];
  personTalks: PersonTalk[];
  apostilaWeek: ApostilaSemana | null;
  onCreated: (record: MeetingRecord) => void;
  onUpdated: (record: MeetingRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const slots = useMemo(
    () => buildSlots(type, apostilaWeek),
    [type, apostilaWeek],
  );

  const [editing, setEditing] = useState(false);

  const defaultProgram = useMemo(
    () =>
      type === "midweek" ? buildMidweekProgram(apostilaWeek, slots, t) : null,
    [type, apostilaWeek, slots, t],
  );

  const [program, setProgram] = useState<MidweekSection[] | null>(() => {
    if (type !== "midweek") return null;
    const saved = record?.program ?? null;
    if (saved && Array.isArray(saved.sections) && saved.sections.length > 0) {
      return saved.sections;
    }
    return defaultProgram;
  });

  useEffect(() => {
    if (type !== "midweek") return;
    const saved = record?.program ?? null;
    if (saved && Array.isArray(saved.sections) && saved.sections.length > 0) {
      setProgram(saved.sections);
    }
  }, [type, record?.program]);

  const slotByRole = useMemo(
    () => new Map(slots.map((s) => [s.role, s])),
    [slots],
  );

  const buildDraftForSlot = useCallback(
    (slot: Slot): Draft[] => {
      const existing =
        record?.assignments.filter((a) => a.role === slot.role) ?? [];
      if (existing.length > 0) {
        return existing.map((a) => ({
          role: slot.role,
          sortOrder: slot.sortOrder,
          personId: a.personId,
          contentItemId: a.contentItemId,
          value: a.value ?? null,
        }));
      }
      const autoSong =
        slot.kind === "song" && type === "midweek"
          ? slot.role === "canticoInicial"
            ? apostilaWeek?.canticoInicial
            : slot.role === "canticoFinal"
              ? apostilaWeek?.canticoFinal
              : slot.role === "cancionMedia"
                ? (apostilaWeek?.secoes.find((s) => s.cancionMedia != null)
                    ?.cancionMedia ?? null)
                : null
          : null;
      const autoItem = autoSong
        ? (songs.find((s) => s.number === autoSong)?.id ?? null)
        : null;
      return [
        {
          role: slot.role,
          sortOrder: slot.sortOrder,
          personId: null,
          contentItemId: autoItem,
          value: null,
        },
      ];
    },
    [record, type, apostilaWeek, songs],
  );

  const [drafts, setDrafts] = useState<Draft[]>(() =>
    slots.flatMap((slot) => buildDraftForSlot(slot)),
  );

  useEffect(() => {
    setDrafts((prev) => {
      const existingRoles = new Set(prev.map((d) => d.role));
      const toAdd = slots.flatMap((slot) =>
        existingRoles.has(slot.role) ? [] : buildDraftForSlot(slot),
      );
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  }, [slots, buildDraftForSlot]);

  useEffect(() => {
    if (type !== "midweek") return;
    setDrafts((prev) => {
      const existingRoles = new Set(prev.map((d) => d.role));
      const toAdd: Draft[] = [];
      for (const sec of program ?? []) {
        for (const row of sec.rows) {
          if (row.role && !existingRoles.has(row.role)) {
            const saved = record?.assignments.find((a) => a.role === row.role);
            toAdd.push({
              role: row.role,
              sortOrder: 100,
              personId: saved?.personId ?? null,
              contentItemId: saved?.contentItemId ?? null,
              value: saved?.value ?? null,
            });
            existingRoles.add(row.role);
          }
          if (row.secondary?.role && !existingRoles.has(row.secondary.role)) {
            const saved = record?.assignments.find(
              (a) => a.role === row.secondary?.role,
            );
            toAdd.push({
              role: row.secondary.role,
              sortOrder: 100,
              personId: saved?.personId ?? null,
              contentItemId: saved?.contentItemId ?? null,
              value: saved?.value ?? null,
            });
            existingRoles.add(row.secondary.role);
          }
        }
      }
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  }, [type, program, record?.assignments]);

  const selectedDiscursoId =
    drafts.find((d) => d.role === "discurso")?.contentItemId ?? null;

  const oradorEligible = useMemo(() => {
    const pool = people.filter((p) => p.active && p.discursoPublico);
    if (selectedDiscursoId) {
      const assigned = new Set(
        personTalks
          .filter((pt) => pt.meetingContentItemId === selectedDiscursoId)
          .map((pt) => pt.personId),
      );
      const withOutline = pool.filter((p) => assigned.has(p.id));
      if (withOutline.length > 0) return withOutline;
    }
    return pool;
  }, [people, personTalks, selectedDiscursoId]);

  const getPerson = useCallback(
    (personId: string | null) =>
      personId ? (people.find((p) => p.id === personId) ?? null) : null,
    [people],
  );

  const getItem = useCallback(
    (itemId: string | null, kind: "song" | "discurso") => {
      if (!itemId) return null;
      const list = kind === "song" ? songs : discursos;
      return list.find((i) => i.id === itemId) ?? null;
    },
    [songs, discursos],
  );

  const getEligible = useCallback(
    (role: string) => {
      const slot = slotByRole.get(role);
      return slot
        ? eligiblePeople(slot, people, drafts)
        : people.filter((p) => p.active);
    },
    [slotByRole, people, drafts],
  );

  const setPerson = useCallback((role: string, personId: string | null) => {
    setDrafts((prev) =>
      prev.map((d) => (d.role === role ? { ...d, personId } : d)),
    );
  }, []);

  const setItem = useCallback((role: string, contentItemId: string | null) => {
    setDrafts((prev) =>
      prev.map((d) => (d.role === role ? { ...d, contentItemId } : d)),
    );
  }, []);

  const setValue = useCallback((role: string, value: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.role === role ? { ...d, value } : d)),
    );
  }, []);

  const addPerson = useCallback((role: string, personId: string) => {
    setDrafts((prev) => {
      const exists = prev.some(
        (d) => d.role === role && d.personId === personId,
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          role,
          sortOrder: 0,
          personId,
          contentItemId: null,
          value: null,
        },
      ];
    });
  }, []);

  const removePerson = useCallback((role: string, personId: string) => {
    setDrafts((prev) =>
      prev.filter((d) => !(d.role === role && d.personId === personId)),
    );
  }, []);

  const setRowTempo = useCallback(
    (sectionKey: string, rowKey: string, tempoMin: number) => {
      setProgram(
        (prev) =>
          prev?.map((sec) => {
            if (sec.key !== sectionKey) return sec;
            const si = Number(sec.key.replace("secao-", ""));
            const kind = Number.isFinite(si)
              ? midweekSectionKind(apostilaWeek?.secoes[si]?.secao ?? "")
              : "other";
            const add = Math.max(0, tempoMin);
            const clockAdd = kind === "ministerio" ? add + 1 : add;
            return {
              ...sec,
              rows: sec.rows.map((r) =>
                r.key === rowKey ? { ...r, tempoMin: add, clockAdd } : r,
              ),
            };
          }) ?? prev,
      );
    },
    [apostilaWeek],
  );

  const setRowTitle = useCallback(
    (sectionKey: string, rowKey: string, title: string) => {
      setProgram(
        (prev) =>
          prev?.map((sec) =>
            sec.key === sectionKey
              ? {
                  ...sec,
                  rows: sec.rows.map((r) =>
                    r.key === rowKey ? { ...r, title } : r,
                  ),
                }
              : sec,
          ) ?? prev,
      );
    },
    [],
  );

  const addRow = useCallback(
    (sectionKey: string) => {
      const role = `custom:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`;
      const si = Number(sectionKey.replace("secao-", ""));
      const kind = Number.isFinite(si)
        ? midweekSectionKind(apostilaWeek?.secoes[si]?.secao ?? "")
        : "other";
      const clockAdd = kind === "ministerio" ? 6 : 5;
      const row: MidweekRow = {
        key: role,
        kind: "person",
        title: "",
        tempoMin: 5,
        clockAdd,
        role,
        eligibility: "any",
      };
      setProgram(
        (prev) =>
          prev?.map((sec) =>
            sec.key === sectionKey ? { ...sec, rows: [...sec.rows, row] } : sec,
          ) ?? prev,
      );
      setDrafts((prev) => [
        ...prev,
        {
          role,
          sortOrder: 100,
          personId: null,
          contentItemId: null,
          value: null,
        },
      ]);
    },
    [apostilaWeek],
  );

  const removeRow = useCallback(
    (sectionKey: string, rowKey: string) => {
      const row = program
        ?.find((s) => s.key === sectionKey)
        ?.rows.find((r) => r.key === rowKey);
      setProgram(
        (prev) =>
          prev?.map((sec) =>
            sec.key === sectionKey
              ? { ...sec, rows: sec.rows.filter((r) => r.key !== rowKey) }
              : sec,
          ) ?? prev,
      );
      if (row) {
        setDrafts((prev) =>
          prev.filter(
            (d) => d.role !== row.role && d.role !== row.secondary?.role,
          ),
        );
      }
    },
    [program],
  );

  const handleCancel = useCallback(() => {
    setEditing(false);
    setProgram(
      record?.program?.sections?.length
        ? record.program.sections
        : (defaultProgram ?? []),
    );
    setDrafts(slots.flatMap((slot) => buildDraftForSlot(slot)));
  }, [record, defaultProgram, slots, buildDraftForSlot]);

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: drafts
            .filter(
              (d) =>
                d.personId ||
                d.contentItemId ||
                (d.value !== null && d.value !== ""),
            )
            .map((d) => ({
              role: d.role,
              sortOrder: d.sortOrder,
              personId: d.personId,
              contentItemId: d.contentItemId,
              value: d.value,
            })),
          ...(type === "midweek" && program
            ? { program: serializeProgram(program) }
            : {}),
        }),
      });
      if (!res.ok) {
        toast.error(t("meetings.saveError"));
        return;
      }
      const data = await res.json();
      onUpdated(data.meeting);
      setEditing(false);
      toast.success(t("meetings.saved"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          weekStart: toDateKey(startOfWeek(date)),
        }),
      });
      if (!res.ok) {
        toast.error(t("meetings.createError"));
        return;
      }
      const data = await res.json();
      onCreated(data.meeting);
      setEditing(true);
      toast.success(t("meetings.created"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    setConfirmDelete(false);
    try {
      const res = await fetch(`/api/meetings/${record.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(t("meetings.deleteError"));
        return;
      }
      onDeleted(record.id);
      toast.success(t("meetings.deleted"));
    } catch {
      toast.error(t("meetings.deleteError"));
    }
  };

  const editable = canManage && editing;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {t(`meetings.types.${type}`)}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatFullDate(date)}
            {time ? ` · ${time}` : ""}
          </p>
          {type === "midweek" && apostilaWeek && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("meetings.apostilaWeek")}: {apostilaWeek.semana}
            </p>
          )}
        </div>
        {canManage && record && (
          <div className="flex shrink-0 items-center gap-2">
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                {t("meetings.edit")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t("common.delete")}
            </Button>
          </div>
        )}
      </div>

      {!record ? (
        canManage ? (
          <Button onClick={handleCreate} disabled={saving}>
            <Plus className="h-4 w-4 mr-1" />
            {saving ? t("meetings.creating") : t("meetings.createMeeting")}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("meetings.notCreated")}
          </p>
        )
      ) : (
        <div className="space-y-4">
          {type === "midweek" ? (
            <MidweekProgramView
              sections={program}
              drafts={drafts}
              editable={editable}
              time={time}
              songs={songs}
              getPerson={getPerson}
              getItem={getItem}
              getEligible={getEligible}
              onPersonChange={setPerson}
              onItemChange={setItem}
              onTempoChange={setRowTempo}
              onTitleChange={setRowTitle}
              onAddPart={addRow}
              onRemovePart={removeRow}
            />
          ) : (
            slots.map((slot) => {
              const slotDrafts = drafts.filter((d) => d.role === slot.role);
              const label = slotLabel(slot, apostilaWeek, (k) => t(k));

              if (slot.kind === "text") {
                return (
                  <div key={slot.role} className="space-y-1.5">
                    <label
                      htmlFor={slot.role}
                      className="block text-sm font-medium"
                    >
                      {label}
                    </label>
                    {editable ? (
                      <input
                        id={slot.role}
                        type="text"
                        value={slotDrafts[0]?.value ?? ""}
                        onChange={(e) => setValue(slot.role, e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {slotDrafts[0]?.value || "—"}
                      </p>
                    )}
                  </div>
                );
              }

              if (slot.kind === "song") {
                const value = slotDrafts[0]?.contentItemId ?? null;
                const item = getItem(value, "song");
                return (
                  <div key={slot.role} className="space-y-1.5">
                    <label
                      htmlFor={slot.role}
                      className="block text-sm font-medium"
                    >
                      {label}
                    </label>
                    {editable ? (
                      <select
                        id={slot.role}
                        value={value ?? ""}
                        onChange={(e) =>
                          setItem(slot.role, e.target.value || null)
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                      >
                        <option value="">{t("meetings.selectSong")}</option>
                        {songs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.number != null ? `${s.number}. ` : ""}
                            {s.theme}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {item
                          ? `${item.number != null ? `${item.number}. ` : ""}${item.theme}`
                          : "—"}
                      </p>
                    )}
                  </div>
                );
              }

              if (slot.kind === "discurso") {
                const value = slotDrafts[0]?.contentItemId ?? null;
                const item = getItem(value, "discurso");
                return (
                  <div key={slot.role} className="space-y-1.5">
                    <label
                      htmlFor={slot.role}
                      className="block text-sm font-medium"
                    >
                      {label}
                    </label>
                    {editable ? (
                      <select
                        id={slot.role}
                        value={value ?? ""}
                        onChange={(e) => {
                          setItem(slot.role, e.target.value || null);
                          if (slot.role === "discurso")
                            setPerson("orador", null);
                        }}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                      >
                        <option value="">{t("meetings.selectDiscurso")}</option>
                        {discursos.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.number != null ? `${d.number}. ` : ""}
                            {d.theme}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {item
                          ? `${item.number != null ? `${item.number}. ` : ""}${item.theme}`
                          : "—"}
                      </p>
                    )}
                  </div>
                );
              }

              if (slot.kind === "person" || slot.kind === "personDual") {
                const value = slotDrafts[0]?.personId ?? null;
                const person = getPerson(value);
                const eligible =
                  slot.role === "orador"
                    ? oradorEligible
                    : eligiblePeople(slot, people, drafts);
                return (
                  <div key={slot.role} className="space-y-1.5">
                    <label
                      htmlFor={slot.role}
                      className="block text-sm font-medium"
                    >
                      {label}
                    </label>
                    {editable ? (
                      <select
                        id={slot.role}
                        value={value ?? ""}
                        onChange={(e) =>
                          setPerson(slot.role, e.target.value || null)
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                      >
                        <option value="">{t("meetings.selectPerson")}</option>
                        {eligible.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {person?.name ?? "—"}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <PersonMultiSlot
                  key={slot.role}
                  label={label}
                  drafts={slotDrafts}
                  people={eligiblePeople(slot, people, drafts)}
                  canManage={editable}
                  getPerson={getPerson}
                  onAdd={(personId) => addPerson(slot.role, personId)}
                  onRemove={(personId) => removePerson(slot.role, personId)}
                />
              );
            })
          )}

          {editable && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t("meetings.saving") : t("meetings.save")}
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("meetings.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("meetings.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PersonMultiSlot({
  label,
  drafts,
  people,
  canManage,
  getPerson,
  onAdd,
  onRemove,
}: {
  label: string;
  drafts: Draft[];
  people: Person[];
  canManage: boolean;
  getPerson: (id: string | null) => Person | null;
  onAdd: (personId: string) => void;
  onRemove: (personId: string) => void;
}) {
  const { t } = useTranslation();
  const selectedIds = new Set(drafts.map((d) => d.personId).filter(Boolean));
  const available = people.filter((p) => !selectedIds.has(p.id));

  return (
    <div className="space-y-1.5">
      <label htmlFor={`multi-${label}`} className="block text-sm font-medium">
        {label}
      </label>
      {drafts.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {drafts.map((d) => {
            const person = getPerson(d.personId);
            if (!person) return null;
            return (
              <li
                key={d.personId}
                className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-sm ring-1 ring-border"
              >
                <span className="truncate">{person.name}</span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => d.personId && onRemove(d.personId)}
                    aria-label={`${t("common.remove")}: ${person.name}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("meetings.noAssignments")}
        </p>
      )}
      {canManage && available.length > 0 && (
        <select
          id={`multi-${label}`}
          value=""
          onChange={(e) => {
            if (e.target.value) onAdd(e.target.value);
          }}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">{t("meetings.addPerson")}</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function MidweekProgramView({
  sections,
  drafts,
  editable,
  time,
  songs,
  getPerson,
  getItem,
  getEligible,
  onPersonChange,
  onItemChange,
  onTempoChange,
  onTitleChange,
  onAddPart,
  onRemovePart,
}: {
  sections: MidweekSection[] | null;
  drafts: Draft[];
  editable: boolean;
  time: string;
  songs: CatalogItem[];
  getPerson: (id: string | null) => Person | null;
  getItem: (id: string | null, kind: "song" | "discurso") => CatalogItem | null;
  getEligible: (role: string) => Person[];
  onPersonChange: (role: string, personId: string | null) => void;
  onItemChange: (role: string, contentItemId: string | null) => void;
  onTempoChange: (sectionKey: string, rowKey: string, tempoMin: number) => void;
  onTitleChange: (sectionKey: string, rowKey: string, title: string) => void;
  onAddPart: (sectionKey: string) => void;
  onRemovePart: (sectionKey: string, rowKey: string) => void;
}) {
  const { t } = useTranslation();
  const cols = editable
    ? "grid-cols-[40px_minmax(0,1fr)_48px_minmax(96px,118px)_24px] gap-x-1.5 px-2 sm:grid-cols-[56px_1fr_56px_minmax(150px,210px)_32px] sm:gap-x-2 sm:px-3"
    : "grid-cols-[42px_minmax(0,1fr)_minmax(92px,136px)] gap-x-2 px-2 sm:grid-cols-[56px_1fr_minmax(170px,230px)] sm:gap-x-3 sm:px-3";
  let clock = parseTimeToMinutes(time || "19:00");

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div
        className={cn(
          "grid items-center border-b border-border bg-muted/50 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
          cols,
        )}
      >
        <span>{t("meetings.horario")}</span>
        <span>{t("meetings.descricao")}</span>
        {editable && <span>{t("meetings.tempo")}</span>}
        <span className="text-right">{t("meetings.designado")}</span>
        {editable && <span />}
      </div>
      {sections?.map((section) => (
        <div key={section.key}>
          <div className="border-b border-border/70 bg-background px-3 py-2 text-sm font-semibold">
            {section.title}
          </div>
          {section.rows.map((row) => {
            const timeLabel = formatMinutes(clock);
            clock += row.clockAdd ?? row.tempoMin;
            return (
              <div
                key={row.key}
                className={cn(
                  "grid items-center border-b border-border/60 py-2 text-sm last:border-b-0",
                  cols,
                )}
              >
                <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
                  {timeLabel}
                </span>
                <div className="min-w-0">
                  {editable &&
                  !row.fixed &&
                  (row.kind === "person" || row.kind === "personDual") ? (
                    <input
                      value={row.title}
                      onChange={(e) =>
                        onTitleChange(section.key, row.key, e.target.value)
                      }
                      placeholder={t("meetings.partTitlePlaceholder")}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{row.title}</span>
                      {!editable && row.tempoMin > 0 && (
                        <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                          · {row.tempoMin} min
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {editable ? (
                  row.kind === "presidente" ? (
                    <span className="text-center text-muted-foreground">
                      —&nbsp;
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={row.tempoMin}
                      onChange={(e) =>
                        onTempoChange(
                          section.key,
                          row.key,
                          Number(e.target.value),
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm tabular-nums focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  )
                ) : null}
                <div className="flex flex-col items-end gap-1">
                  {row.kind === "static" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <>
                      <CellControl
                        row={row}
                        which="primary"
                        drafts={drafts}
                        editable={editable}
                        songs={songs}
                        getPerson={getPerson}
                        getItem={getItem}
                        getEligible={getEligible}
                        onPersonChange={onPersonChange}
                        onItemChange={onItemChange}
                      />

                      {row.secondary && (
                        <CellControl
                          row={row}
                          which="secondary"
                          drafts={drafts}
                          editable={editable}
                          songs={songs}
                          getPerson={getPerson}
                          getItem={getItem}
                          getEligible={getEligible}
                          onPersonChange={onPersonChange}
                          onItemChange={onItemChange}
                        />
                      )}
                    </>
                  )}
                </div>
                {editable ? (
                  !row.fixed ? (
                    <button
                      type="button"
                      onClick={() => onRemovePart(section.key, row.key)}
                      aria-label={t("common.remove")}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <span />
                  )
                ) : null}
              </div>
            );
          })}
          {editable &&
            section.key !== "introducao" &&
            section.key !== "conclusao" && (
              <button
                type="button"
                onClick={() => onAddPart(section.key)}
                className="flex w-full items-center justify-center gap-1 border-b border-border/60 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                {t("meetings.addPart")}
              </button>
            )}
        </div>
      ))}
    </div>
  );
}

function CellControl({
  row,
  which,
  drafts,
  editable,
  songs,
  getPerson,
  getItem,
  getEligible,
  onPersonChange,
  onItemChange,
}: {
  row: MidweekRow;
  which: "primary" | "secondary";
  drafts: Draft[];
  editable: boolean;
  songs: CatalogItem[];
  getPerson: (id: string | null) => Person | null;
  getItem: (id: string | null, kind: "song" | "discurso") => CatalogItem | null;
  getEligible: (role: string) => Person[];
  onPersonChange: (role: string, personId: string | null) => void;
  onItemChange: (role: string, contentItemId: string | null) => void;
}) {
  const { t } = useTranslation();
  const isSecondary = which === "secondary";
  const role = isSecondary ? (row.secondary?.role ?? "") : row.role;
  const draft = drafts.find((d) => d.role === role);

  if (row.kind === "song") {
    const item = getItem(draft?.contentItemId ?? null, "song");
    if (!editable) {
      return (
        <span className="text-right text-sm">
          {item
            ? `${item.number != null ? `${item.number}. ` : ""}${item.theme}`
            : "—"}
        </span>
      );
    }
    return (
      <select
        value={draft?.contentItemId ?? ""}
        onChange={(e) => onItemChange(role, e.target.value || null)}
        className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        <option value="">{t("meetings.selectSong")}</option>
        {songs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.number != null ? `${s.number}. ` : ""}
            {s.theme}
          </option>
        ))}
      </select>
    );
  }

  const person = getPerson(draft?.personId ?? null);
  if (!editable) {
    return (
      <span
        className={cn(
          "block max-w-full truncate text-right",
          isSecondary && "text-xs text-muted-foreground",
        )}
      >
        {person?.name ?? (isSecondary ? "—" : t("meetings.naoDesignado"))}
      </span>
    );
  }
  return (
    <div
      className={cn(
        "flex w-full flex-col sm:max-w-52.5",
        isSecondary && "items-start",
      )}
    >
      {isSecondary && row.secondary?.label && (
        <span className="mb-0.5 text-xs text-muted-foreground">
          {row.secondary.label}
        </span>
      )}
      <select
        value={draft?.personId ?? ""}
        onChange={(e) => onPersonChange(role, e.target.value || null)}
        className={cn(
          "w-full rounded-lg border border-border bg-background px-2 py-1 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
          isSecondary && "text-muted-foreground",
        )}
      >
        <option value="">{t("meetings.selectPerson")}</option>
        {getEligible(role).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

type TFunc = (key: string, options?: Record<string, unknown>) => string;

function findApostilaWeek(
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

function MeetingPdfDialog({
  open,
  onOpenChange,
  orgName,
  configs,
  apostilaWeeks,
  events,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName?: string;
  configs: MeetingConfig[];
  apostilaWeeks: ApostilaSemana[];
  events: SpecialEvent[];
  t: TFunc;
}) {
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [type, setType] = useState<"both" | "midweek" | "weekend">("both");
  const [generating, setGenerating] = useState(false);

  const canGenerate = Boolean(from && to) && !generating;

  const handleGenerate = async () => {
    if (!from || !to) return;
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/meetings?from=${toDateKey(from)}&to=${toDateKey(to)}`,
      );
      if (!res.ok) throw new Error("fetch");
      const data = (await res.json()) as {
        meetings?: Array<{
          id: string;
          type: "midweek" | "weekend" | "memorial";
          weekStart: string;
          program: MidweekProgram | null;
          assignments: PdfAssignment[];
        }>;
      };
      const wanted = new Set(type === "both" ? ["midweek", "weekend"] : [type]);
      const pdfMeetings: PdfMeeting[] = (data.meetings ?? [])
        .filter((m) => wanted.has(m.type))
        .map((m) => {
          const aw =
            m.type === "midweek"
              ? findApostilaWeek(apostilaWeeks, m.weekStart.replace(/-/g, ""))
              : null;
          const program: PdfProgram | null =
            m.type === "midweek"
              ? {
                  sections:
                    m.program && m.program.sections.length > 0
                      ? m.program.sections
                      : aw
                        ? buildMidweekProgram(aw, buildSlots("midweek", aw), t)
                        : [],
                }
              : null;
          return {
            id: m.id,
            type: m.type,
            weekStart: m.weekStart,
            program,
            assignments: m.assignments,
          };
        });

      if (pdfMeetings.length === 0) {
        toast.error(t("meetings.pdf.noMeetings"));
        return;
      }

      await generateMeetingsPdf({
        orgName: orgName ?? "",
        meetings: pdfMeetings,
        configs,
        apostilaWeeks,
        events,
        t,
      });
    } catch {
      toast.error(t("meetings.pdf.noMeetings"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("meetings.pdf.title")}</DialogTitle>
          <DialogDescription>{t("meetings.pdf.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("meetings.pdf.rangeLabel")}</Label>
            <div className="mt-2 flex justify-center">
              <Calendar
                mode="range"
                selected={{ from: from ?? undefined, to: to ?? undefined }}
                onSelect={(r) => {
                  setFrom(r?.from ?? null);
                  setTo(r?.to ?? null);
                }}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="meeting-pdf-type">
              {t("meetings.pdf.typeLabel")}
            </Label>
            <select
              id="meeting-pdf-type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "both" | "midweek" | "weekend")
              }
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="both">{t("meetings.pdf.typeBoth")}</option>
              <option value="midweek">{t("meetings.pdf.typeMidweek")}</option>
              <option value="weekend">{t("meetings.pdf.typeWeekend")}</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("meetings.pdf.cancel")}
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            {generating ? "…" : t("meetings.pdf.generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

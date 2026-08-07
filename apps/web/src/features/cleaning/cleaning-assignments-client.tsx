"use client";

import { Plus, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "react-day-picker";
import { es, ptBR } from "react-day-picker/locale";
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
import {
  type CleaningType,
  generateDraft,
  getMeetingDates,
  type HistoryEntry,
  type MeetingConfigLike,
  type PersonLike,
  parseDateKey,
  type SectorLike,
  type SpecialEventLike,
  startOfWeek,
  toDateKey,
  validateDatesForType,
  weekHasBlockingEvent,
} from "@/lib/cleaning-assignment";
import { sectorNameKey, sectorTaskKey } from "@/lib/cleaning-defaults";
import { cn } from "@/lib/utils";

type CleaningSector = SectorLike & {
  defaultKey: string | null;
  name: string | null;
  task: string | null;
};

type Assignment = {
  id: string;
  date: string;
  sectorId: string;
  personId: string;
  personName: string;
  sectorName: string | null;
  sectorDefaultKey: string | null;
};

type Schedule = {
  id: string;
  type: CleaningType;
  startDate: string;
  endDate: string;
  createdAt: string;
  assignments: Assignment[];
};

type SectorMeta = {
  name: string | null;
  defaultKey: string | null;
  type: CleaningType;
};

type EditorState = {
  type: CleaningType;
  dates: string[];
  byDate: Record<string, Record<string, string[]>>;
  sectorMeta: Record<string, SectorMeta>;
  scheduleId: string | null;
};

type TFunction = (key: string, options?: Record<string, unknown>) => string;

function sectorLabel(meta: SectorMeta, t: TFunction): string {
  if (meta.name) return meta.name;
  const key = sectorNameKey(meta);
  return key ? t(key) : "";
}

function sectorTaskLabel(
  meta: SectorMeta,
  sector: CleaningSector | undefined,
  t: TFunction,
): string {
  if (sector?.task) return sector.task;
  const key = sectorTaskKey(meta);
  return key ? t(key) : "";
}

function formatDateKey(key: string, locale: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isEligible(
  person: PersonLike,
  sector: SectorLike | undefined,
  type: CleaningType,
): boolean {
  if (!person.active || !person.limpeza) return false;
  if (type !== "meeting" || !sector) return true;
  if (!sector.allowYoung && person.young) return false;
  if (sector.gender === "male" && person.sex !== "MALE") return false;
  if (sector.gender === "female" && person.sex !== "FEMALE") return false;
  return true;
}

type Props = {
  role: string;
  organizationId: string;
};

export function CleaningAssignmentsClient({ role }: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language ?? "pt").startsWith("es") ? es : ptBR;
  const dateLocale = (i18n.language ?? "pt").startsWith("es")
    ? "es-ES"
    : "pt-BR";

  const canManage = role === "owner" || role === "admin";

  const [sectors, setSectors] = useState<CleaningSector[]>([]);
  const [people, setPeople] = useState<PersonLike[]>([]);
  const [configs, setConfigs] = useState<MeetingConfigLike[]>([]);
  const [events, setEvents] = useState<SpecialEventLike[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeType, setActiveType] = useState<CleaningType>("meeting");
  const [modalOpen, setModalOpen] = useState(false);
  const [meetingRange, setMeetingRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);
  const [weeklySelected, setWeeklySelected] = useState<Date[]>([]);
  const [generalSelected, setGeneralSelected] = useState<Date[]>([]);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [cleaningRes, peopleRes, configsRes, eventsRes, schedulesRes] =
      await Promise.all([
        fetch("/api/cleaning"),
        fetch("/api/people"),
        fetch("/api/meeting-configs"),
        fetch("/api/special-events"),
        fetch("/api/cleaning-schedules"),
      ]);
    const [cleaningData, peopleData, configsData, eventsData, schedulesData] =
      await Promise.all([
        cleaningRes.json(),
        peopleRes.json(),
        configsRes.json(),
        eventsRes.json(),
        schedulesRes.json(),
      ]);
    setSectors(cleaningData.sectors ?? []);
    setPeople(peopleData.people ?? []);
    setConfigs(configsData.configs ?? []);
    setEvents(eventsData.events ?? []);
    setSchedules(schedulesData.schedules ?? []);
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const sectorsById = useMemo(
    () => new Map(sectors.map((s) => [s.id, s])),
    [sectors],
  );

  const typeSectors = useMemo(
    () =>
      sectors
        .filter((s) => s.type === activeType)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [sectors, activeType],
  );

  const meetingBlockedDates = useMemo(
    () =>
      new Set(
        schedules
          .filter((s) => s.type === "meeting")
          .flatMap((s) => s.assignments.map((a) => a.date)),
      ),
    [schedules],
  );

  const weeklyWeeks = useMemo(
    () =>
      new Set(
        schedules
          .filter((s) => s.type === "weekly")
          .flatMap((s) =>
            s.assignments.map((a) =>
              toDateKey(startOfWeek(parseDateKey(a.date))),
            ),
          ),
      ),
    [schedules],
  );

  const generalWeeks = useMemo(
    () =>
      new Set(
        schedules
          .filter((s) => s.type === "general")
          .flatMap((s) =>
            s.assignments.map((a) =>
              toDateKey(startOfWeek(parseDateKey(a.date))),
            ),
          ),
      ),
    [schedules],
  );

  const meetingDisabled = useMemo(
    () =>
      [...meetingBlockedDates]
        .map((d) => new Date(`${d}T00:00:00`))
        .sort((a, b) => a.getTime() - b.getTime()),
    [meetingBlockedDates],
  );

  const specialEventDates = useMemo(() => {
    const dates: Date[] = [];
    for (const ev of events) {
      const start = new Date(`${ev.date}T00:00:00`);
      const end = ev.endDate ? new Date(`${ev.endDate}T00:00:00`) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    }
    return dates;
  }, [events]);

  const isWeeklyDisabled = useCallback(
    (date: Date) => {
      const weekKey = toDateKey(startOfWeek(date));
      if (weeklyWeeks.has(weekKey) || generalWeeks.has(weekKey)) return true;
      return weekHasBlockingEvent(date, events);
    },
    [weeklyWeeks, generalWeeks, events],
  );

  const isGeneralDisabled = useCallback(
    (date: Date) => weeklyWeeks.has(toDateKey(startOfWeek(date))),
    [weeklyWeeks],
  );

  function handleCalendarSelect(
    type: CleaningType,
    value: { from: Date; to: Date } | Date[] | undefined,
  ) {
    if (type === "meeting") {
      setMeetingRange(value as { from: Date; to: Date } | null);
      return;
    }
    if (type === "weekly") {
      setWeeklySelected((value as Date[]) ?? []);
      return;
    }
    setGeneralSelected((value as Date[]) ?? []);
  }

  function openCreateModal() {
    setMeetingRange(null);
    setWeeklySelected([]);
    setGeneralSelected([]);
    setModalOpen(true);
  }

  function buildEditorFromDraft(type: CleaningType, dates: Date[]) {
    const history: HistoryEntry[] = schedules.flatMap((s) =>
      s.assignments.map((a) => ({
        date: parseDateKey(a.date),
        personId: a.personId,
        sectorId: a.sectorId,
      })),
    );

    const drafts = generateDraft({
      type,
      dates,
      sectors,
      people,
      history,
    });

    const sectorList = sectors
      .filter((s) => s.type === type)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const sectorMeta: Record<string, SectorMeta> = {};
    for (const s of sectorList) {
      sectorMeta[s.id] = {
        name: s.name,
        defaultKey: s.defaultKey,
        type: s.type,
      };
    }

    const byDate: Record<string, Record<string, string[]>> = {};
    for (const dateKey of dates.map(toDateKey)) {
      byDate[dateKey] = {};
    }
    for (const draft of drafts) {
      byDate[draft.date] = {
        ...byDate[draft.date],
        [draft.sectorId]: draft.personIds,
      };
    }

    return {
      type,
      dates: dates.map(toDateKey),
      byDate,
      sectorMeta,
      scheduleId: null as string | null,
    };
  }

  function handleGenerate() {
    if (!canManage) return;

    let dates: Date[] = [];
    if (activeType === "meeting") {
      if (!meetingRange?.from || !meetingRange?.to) {
        toast.error(t("cleaningAssignment.selectDates"));
        return;
      }
      dates = getMeetingDates(
        meetingRange.from,
        meetingRange.to,
        configs,
        events,
      );
      if (dates.length === 0) {
        toast.error(t("cleaningAssignment.meetingAutoDatesEmpty"));
        return;
      }
    } else {
      const selected =
        activeType === "weekly" ? weeklySelected : generalSelected;
      if (!selected || selected.length === 0) {
        toast.error(t("cleaningAssignment.selectDates"));
        return;
      }
      dates = selected.slice().sort((a, b) => a.getTime() - b.getTime());
    }

    const conflict = validateDatesForType({
      type: activeType,
      dates,
      existingSchedules: schedules.map((s) => ({
        id: s.id,
        type: s.type,
        assignments: s.assignments.map((a) => ({ date: parseDateKey(a.date) })),
      })),
      events,
    });
    if (conflict) {
      toast.error(t(`cleaningAssignment.conflicts.${conflict}`));
      return;
    }

    setEditor(buildEditorFromDraft(activeType, dates));
    setModalOpen(false);
  }

  function openEditor(schedule: Schedule) {
    const dates = [...new Set(schedule.assignments.map((a) => a.date))].sort();
    const byDate: Record<string, Record<string, string[]>> = {};
    for (const dateKey of dates) byDate[dateKey] = {};
    for (const a of schedule.assignments) {
      byDate[a.date] ??= {};
      byDate[a.date][a.sectorId] ??= [];
      byDate[a.date][a.sectorId].push(a.personId);
    }
    const sectorMeta: Record<string, SectorMeta> = {};
    for (const a of schedule.assignments) {
      const current = sectorsById.get(a.sectorId);
      sectorMeta[a.sectorId] = {
        name: current?.name ?? a.sectorName,
        defaultKey: current?.defaultKey ?? a.sectorDefaultKey,
        type: schedule.type,
      };
    }
    for (const s of sectors) {
      if (s.type === schedule.type && !sectorMeta[s.id]) {
        sectorMeta[s.id] = {
          name: s.name,
          defaultKey: s.defaultKey,
          type: s.type,
        };
      }
    }
    setEditor({
      type: schedule.type,
      dates,
      byDate,
      sectorMeta,
      scheduleId: schedule.id,
    });
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    try {
      const assignments: {
        date: string;
        sectorId: string;
        personIds: string[];
      }[] = [];
      for (const dateKey of editor.dates) {
        const sectorMap = editor.byDate[dateKey] ?? {};
        for (const [sectorId, personIds] of Object.entries(sectorMap)) {
          if (personIds.length > 0) {
            assignments.push({ date: dateKey, sectorId, personIds });
          }
        }
      }
      if (assignments.length === 0) {
        toast.error(t("cleaningAssignment.noAssignments"));
        return;
      }

      const basePayload = { dates: editor.dates, assignments };
      const payload = editor.scheduleId
        ? basePayload
        : { ...basePayload, type: editor.type };

      const res = editor.scheduleId
        ? await fetch(`/api/cleaning-schedules/${editor.scheduleId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/cleaning-schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const error = data?.error as string | undefined;
        if (
          error &&
          [
            "no_dates",
            "date_conflict",
            "duplicate_date",
            "weekly_week_conflict",
            "weekly_general_week",
            "blocking_event_week",
          ].includes(error)
        ) {
          toast.error(t(`cleaningAssignment.conflicts.${error}`));
        } else {
          toast.error(data?.error ?? t("cleaningAssignment.savedError"));
        }
        return;
      }

      setEditor(null);
      await fetchAll();
      toast.success(t("cleaningAssignment.savedSuccess"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/cleaning-schedules/${deleting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(t("cleaningAssignment.deletedError"));
        return;
      }
      setDeleting(null);
      await fetchAll();
      toast.success(t("cleaningAssignment.deletedSuccess"));
    } catch {
      toast.error(t("cleaningAssignment.deletedError"));
    }
  }

  async function handlePdf(schedule: Schedule) {
    setPdfBusyId(schedule.id);
    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(t("cleaningAssignment.title"), 14, 16);
      doc.setFontSize(11);
      doc.text(t(`cleaning.types.${schedule.type}`), 14, 24);
      doc.text(
        `${t("cleaningAssignment.scheduleDates")}: ${formatDateKey(schedule.startDate, dateLocale)} – ${formatDateKey(schedule.endDate, dateLocale)}`,
        14,
        31,
      );

      const groups = new Map<string, Map<string, string[]>>();
      const meta = new Map<string, SectorMeta>();
      for (const a of schedule.assignments) {
        const sectorsMap = groups.get(a.date) ?? new Map<string, string[]>();
        groups.set(a.date, sectorsMap);
        const names = sectorsMap.get(a.sectorId) ?? [];
        names.push(a.personName);
        sectorsMap.set(a.sectorId, names);
        if (!meta.has(a.sectorId)) {
          meta.set(a.sectorId, {
            name: a.sectorName,
            defaultKey: a.sectorDefaultKey,
            type: schedule.type,
          });
        }
      }

      const rows: string[][] = [];
      for (const dateKey of [...groups.keys()].sort()) {
        const sectorsMap = groups.get(dateKey);
        if (!sectorsMap) continue;
        for (const sectorId of [...sectorsMap.keys()].sort()) {
          const m = meta.get(sectorId);
          const names = sectorsMap.get(sectorId);
          if (!m || !names) continue;
          rows.push([
            formatDateKey(dateKey, dateLocale),
            sectorLabel(m, t),
            names.join(", "),
          ]);
        }
      }

      autoTable(doc, {
        startY: 38,
        head: [
          [
            t("cleaningAssignment.date"),
            t("cleaningAssignment.sector"),
            t("cleaningAssignment.people"),
          ],
        ],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
      });

      const finalY =
        (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
          ?.finalY ?? 38;

      const taskSet = new Map<string, string>();
      for (const [sectorId, m] of meta.entries()) {
        const task = sectorTaskLabel(m, sectorsById.get(sectorId), t);
        if (task && !taskSet.has(sectorId)) taskSet.set(sectorId, task);
      }
      const uniqueTasks = [...new Set(taskSet.values())];
      if (uniqueTasks.length > 0) {
        const taskY = finalY + 14;
        doc.setFontSize(12);
        doc.text(t("cleaningAssignment.task"), 14, taskY);
        doc.setFontSize(9);
        uniqueTasks.forEach((task, index) => {
          doc.text(`- ${task}`, 14, taskY + 7 + index * 5);
        });
      }

      doc.save(`limpeza-${schedule.type}-${schedule.startDate}.pdf`);
    } catch {
      toast.error(t("cleaningAssignment.savedError"));
    } finally {
      setPdfBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {t("cleaningAssignment.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("cleaningAssignment.subtitle")}
        </p>
      </div>

      <TypePicker value={activeType} onChange={setActiveType} />

      {canManage && (
        <div className="mt-6 mb-8 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <Button
            onClick={openCreateModal}
            disabled={typeSectors.length === 0 || people.length === 0}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("cleaningAssignment.program")}
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("cleaningAssignment.createHint")}
          </p>
        </div>
      )}

      {modalOpen && (
        <CreateScheduleModal
          open={modalOpen}
          type={activeType}
          locale={locale}
          dateLocale={dateLocale}
          range={meetingRange}
          weeklySelected={weeklySelected}
          generalSelected={generalSelected}
          configs={configs}
          events={events}
          specialEventDates={specialEventDates}
          disabled={
            activeType === "meeting"
              ? meetingDisabled
              : activeType === "weekly"
                ? isWeeklyDisabled
                : isGeneralDisabled
          }
          onSelect={(value) => handleCalendarSelect(activeType, value)}
          canGenerate={
            activeType === "meeting"
              ? Boolean(meetingRange?.from && meetingRange?.to)
              : (activeType === "weekly" ? weeklySelected : generalSelected)
                  .length > 0
          }
          onGenerate={handleGenerate}
          onCancel={() => setModalOpen(false)}
          t={t}
          formatDate={formatDateKey}
        />
      )}

      <SchedulesSection
        schedules={schedules}
        canManage={canManage}
        pdfBusyId={pdfBusyId}
        onPdf={handlePdf}
        onEdit={openEditor}
        onDelete={setDeleting}
        t={t}
        formatDate={formatDateKey}
        dateLocale={dateLocale}
      />

      {editor && (
        <AssignmentEditor
          editor={editor}
          sectors={sectors}
          people={people}
          saving={saving}
          dateLocale={dateLocale}
          onSave={handleSave}
          onCancel={() => setEditor(null)}
          onChange={(updated) => setEditor(updated)}
          t={t}
        />
      )}

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("cleaningAssignment.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("cleaningAssignment.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("cleaningAssignment.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {t("cleaningAssignment.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TypePicker({
  value,
  onChange,
}: {
  value: CleaningType;
  onChange: (type: CleaningType) => void;
}) {
  const { t } = useTranslation();
  const types: CleaningType[] = ["meeting", "weekly", "general"];
  return (
    <div
      role="tablist"
      aria-label={t("cleaningAssignment.title")}
      className="flex flex-wrap gap-1.5"
    >
      {types.map((type) => {
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(type)}
            className={cn(
              "rounded-lg border border-primary px-3 py-1.5 text-center text-sm",
              active
                ? "bg-primary font-medium text-primary-foreground"
                : "bg-background text-foreground hover:bg-primary/10",
            )}
          >
            {t(`cleaningAssignment.${type}Title`)}
          </button>
        );
      })}
    </div>
  );
}

function CreateScheduleModal({
  open,
  type,
  locale,
  dateLocale,
  range,
  weeklySelected,
  generalSelected,
  configs,
  events,
  specialEventDates,
  disabled,
  onSelect,
  canGenerate,
  onGenerate,
  onCancel,
  t,
  formatDate,
}: {
  open: boolean;
  type: CleaningType;
  locale: Locale;
  dateLocale: string;
  range: { from: Date; to: Date } | null;
  weeklySelected: Date[];
  generalSelected: Date[];
  configs: MeetingConfigLike[];
  events: SpecialEventLike[];
  specialEventDates: Date[];
  disabled: Date[] | ((date: Date) => boolean);
  onSelect: (value: { from: Date; to: Date } | Date[] | undefined) => void;
  canGenerate: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  t: TFunction;
  formatDate: (key: string, locale: string) => string;
}) {
  const isMeeting = type === "meeting";
  const selected = isMeeting
    ? range?.from && range?.to
      ? { from: range.from, to: range.to }
      : undefined
    : type === "weekly"
      ? weeklySelected
      : generalSelected;

  const autoDates = isMeeting
    ? range?.from && range?.to
      ? getMeetingDates(range.from, range.to, configs, events)
      : []
    : [];

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(`cleaningAssignment.${type}Title`)}</DialogTitle>
          <DialogDescription>
            {t(`cleaningAssignment.${type}Description`)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium">
              {t("cleaningAssignment.period")}
            </p>
            <div className="flex justify-center rounded-2xl bg-muted/50 p-3">
              <CleaningCalendar
                mode={isMeeting ? "range" : "multiple"}
                locale={locale}
                selected={selected}
                onSelect={onSelect}
                disabled={disabled}
                specialEventDates={specialEventDates}
              />
            </div>
          </div>

          {isMeeting && range?.from && range?.to && (
            <MeetingAutoDatesSummary
              dates={autoDates}
              formatDate={formatDate}
              dateLocale={dateLocale}
              t={t}
            />
          )}

          <div className="flex flex-wrap gap-4">
            <CalendarLegend t={t} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("cleaningAssignment.cancel")}
          </Button>
          <Button onClick={onGenerate} disabled={!canGenerate}>
            {t("cleaningAssignment.program")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CleaningCalendar({
  mode,
  selected,
  onSelect,
  disabled,
  specialEventDates,
  locale,
}: {
  mode: "range" | "multiple";
  selected: { from: Date; to: Date } | Date[] | undefined;
  onSelect: (value: { from: Date; to: Date } | Date[] | undefined) => void;
  disabled: Date[] | ((date: Date) => boolean);
  specialEventDates: Date[];
  locale: Locale;
}) {
  const modifiersClassNames = {
    specialEvent:
      "relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
  };

  if (mode === "range") {
    const range = selected as { from: Date; to: Date } | undefined;
    return (
      <Calendar
        mode="range"
        locale={locale}
        weekStartsOn={1}
        selected={range}
        onSelect={(value) =>
          onSelect(
            value?.from && value.to
              ? { from: value.from, to: value.to }
              : undefined,
          )
        }
        disabled={disabled}
        modifiers={{ specialEvent: specialEventDates }}
        modifiersClassNames={modifiersClassNames}
      />
    );
  }

  return (
    <Calendar
      mode="multiple"
      locale={locale}
      weekStartsOn={1}
      selected={selected as Date[] | undefined}
      onSelect={(value) => onSelect(value)}
      disabled={disabled}
      modifiers={{ specialEvent: specialEventDates }}
      modifiersClassNames={modifiersClassNames}
    />
  );
}

function MeetingAutoDatesSummary({
  dates,
  formatDate,
  dateLocale,
  t,
}: {
  dates: Date[];
  formatDate: (key: string, locale: string) => string;
  dateLocale: string;
  t: TFunction;
}) {
  if (dates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("cleaningAssignment.meetingAutoDatesEmpty")}
      </p>
    );
  }
  const labels = dates.map((d) => formatDate(toDateKey(d), dateLocale));
  return (
    <p className="text-sm text-muted-foreground">
      {t("cleaningAssignment.meetingAutoDates", {
        count: dates.length,
      })}{" "}
      <span className="font-medium text-foreground">{labels.join(" · ")}</span>
    </p>
  );
}

function CalendarLegend({ t }: { t: TFunction }) {
  return (
    <ul className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-primary" aria-hidden="true" />
        {t("cleaningAssignment.legend.selected")}
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="size-3 rounded border border-border bg-muted"
          aria-hidden="true"
        />
        {t("cleaningAssignment.legend.blocked")}
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="relative block size-3 rounded border border-border"
          aria-hidden="true"
        >
          <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
        </span>
        {t("cleaningAssignment.legend.specialEvent")}
      </li>
    </ul>
  );
}

function SchedulesSection({
  schedules,
  canManage,
  pdfBusyId,
  onPdf,
  onEdit,
  onDelete,
  t,
  formatDate,
  dateLocale,
}: {
  schedules: Schedule[];
  canManage: boolean;
  pdfBusyId: string | null;
  onPdf: (schedule: Schedule) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  t: TFunction;
  formatDate: (key: string, locale: string) => string;
  dateLocale: string;
}) {
  const types: CleaningType[] = ["meeting", "weekly", "general"];

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-lg font-semibold">
        {t("cleaningAssignment.savedSchedules")}
      </h2>
      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("cleaningAssignment.noSchedules")}
        </p>
      ) : (
        <div className="space-y-8">
          {types.map((type) => {
            const list = schedules
              .filter((s) => s.type === type)
              .sort((a, b) => b.startDate.localeCompare(a.startDate));
            if (list.length === 0) return null;
            return (
              <div key={type}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {t(`cleaningAssignment.${type}Title`)}
                </h3>
                <div className="space-y-2">
                  {list.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex flex-col gap-3 rounded-2xl bg-card px-5 py-4 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {formatDate(schedule.startDate, dateLocale)} –{" "}
                          {formatDate(schedule.endDate, dateLocale)}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {t("cleaningAssignment.scheduleAssignments", {
                            count: schedule.assignments.length,
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPdf(schedule)}
                          disabled={pdfBusyId === schedule.id}
                        >
                          {pdfBusyId === schedule.id ? (
                            <span
                              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                              aria-hidden="true"
                            />
                          ) : (
                            <Printer aria-hidden="true" />
                          )}
                          {t("cleaningAssignment.pdf")}
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(schedule)}
                            >
                              {t("cleaningAssignment.edit")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(schedule)}
                            >
                              {t("cleaningAssignment.delete")}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AssignmentEditor({
  editor,
  sectors,
  people,
  saving,
  dateLocale,
  onSave,
  onCancel,
  onChange,
  t,
}: {
  editor: EditorState;
  sectors: CleaningSector[];
  people: PersonLike[];
  saving: boolean;
  dateLocale: string;
  onSave: () => void;
  onCancel: () => void;
  onChange: (editor: EditorState) => void;
  t: TFunction;
}) {
  const sectorsById = useMemo(
    () => new Map(sectors.map((s) => [s.id, s])),
    [sectors],
  );

  const editorSectorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const dateKey of editor.dates) {
      for (const id of Object.keys(editor.byDate[dateKey] ?? {})) ids.add(id);
    }
    for (const s of sectors) {
      if (s.type === editor.type) ids.add(s.id);
    }
    return [...ids].sort((a, b) => {
      const sa = sectorsById.get(a);
      const sb = sectorsById.get(b);
      if (sa && sb) return sa.sortOrder - sb.sortOrder;
      if (sa) return -1;
      if (sb) return 1;
      return a.localeCompare(b);
    });
  }, [editor, sectors, sectorsById]);

  function setPersonIds(
    dateKey: string,
    sectorId: string,
    personIds: string[],
  ) {
    onChange({
      ...editor,
      byDate: {
        ...editor.byDate,
        [dateKey]: { ...editor.byDate[dateKey], [sectorId]: personIds },
      },
    });
  }

  function addPerson(dateKey: string, sectorId: string, personId: string) {
    const current = editor.byDate[dateKey]?.[sectorId] ?? [];
    setPersonIds(dateKey, sectorId, [...current, personId]);
  }

  function removePerson(dateKey: string, sectorId: string, personId: string) {
    const current = editor.byDate[dateKey]?.[sectorId] ?? [];
    setPersonIds(
      dateKey,
      sectorId,
      current.filter((id) => id !== personId),
    );
  }

  return (
    <Dialog open={Boolean(editor)} onOpenChange={onCancel}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("cleaningAssignment.reviewTitle")}</DialogTitle>
          <DialogDescription>
            {t("cleaningAssignment.reviewDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {editor.dates.map((dateKey) => {
            const assignedOnDate = new Set(
              Object.values(editor.byDate[dateKey] ?? {}).flat(),
            );
            return (
              <div key={dateKey} className="rounded-2xl bg-muted/50 p-4">
                <h4 className="mb-3 text-sm font-semibold">
                  {formatDateKey(dateKey, dateLocale)}
                </h4>
                <div className="space-y-3">
                  {editorSectorIds.map((sectorId) => {
                    const meta = editor.sectorMeta[sectorId];
                    if (!meta) return null;
                    const sector = sectorsById.get(sectorId);
                    const personIds = editor.byDate[dateKey]?.[sectorId] ?? [];
                    const available = people.filter(
                      (p) =>
                        isEligible(p, sector, editor.type) &&
                        !assignedOnDate.has(p.id),
                    );
                    return (
                      <div
                        key={sectorId}
                        className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0 sm:w-40">
                          <p className="text-sm font-medium">
                            {sectorLabel(meta, t)}
                          </p>
                          {sector ? (
                            <p className="text-xs text-muted-foreground">
                              {sectorTaskLabel(meta, sector, t)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col items-stretch gap-2">
                          {personIds.length > 0 ? (
                            <ul className="flex flex-wrap gap-1.5">
                              {personIds.map((personId) => {
                                const person = people.find(
                                  (p) => p.id === personId,
                                );
                                if (!person) return null;
                                return (
                                  <li
                                    key={personId}
                                    className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-sm ring-1 ring-border"
                                  >
                                    <span className="truncate">
                                      {person.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removePerson(
                                          dateKey,
                                          sectorId,
                                          personId,
                                        )
                                      }
                                      aria-label={`${t("cleaningAssignment.removePerson")}: ${person.name}`}
                                      className="text-muted-foreground transition-colors hover:text-destructive"
                                    >
                                      <span aria-hidden="true">×</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {t("cleaningAssignment.noAssignments")}
                            </p>
                          )}
                          {available.length > 0 && (
                            <label className="flex items-center gap-2 text-sm">
                              <span className="sr-only">
                                {t("cleaningAssignment.assignPerson")}
                              </span>
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    addPerson(
                                      dateKey,
                                      sectorId,
                                      e.target.value,
                                    );
                                  }
                                }}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                              >
                                <option value="">
                                  {t("cleaningAssignment.assignPerson")}
                                </option>
                                {available.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("cleaningAssignment.cancel")}
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving
              ? t("cleaningAssignment.saving")
              : t("cleaningAssignment.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Eye, Plus, Printer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "react-day-picker";
import { es, ptBR } from "react-day-picker/locale";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { MonthlyAssignmentsTable } from "@/components/monthly-assignments-table";
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
  parseDateKey,
  startOfWeek,
  toDateKey,
} from "@/lib/cleaning-assignment";
import {
  buildDateRestrictions,
  computeDesignationDates,
  DESIGNATION_ROLES,
  type DesignationPerson,
  type DesignationRole,
  generateDesignations,
  ROLE_PRIVILEGE,
  type SkippedReason,
} from "@/lib/designation-assignment";
import { generateDesignationsPdf } from "./designations-pdf";

type Person = {
  id: string;
  name: string;
  sex: string;
  active: boolean;
  som: boolean;
  video: boolean;
  palco: boolean;
  microfoneVolante: boolean;
  indicador: boolean;
};

type MeetingConfig = {
  type: string;
  dayOfWeek: number;
  isActive: boolean;
};

type SpecialEvent = {
  type: string;
  date: string;
  endDate: string | null;
};

type MeetingAssignment = {
  role: string;
  personId: string | null;
};

type Meeting = {
  id: string;
  type: string;
  weekStart: string;
  assignments: MeetingAssignment[];
};

type DesignationEntry = {
  id: string;
  date: string;
  role: DesignationRole;
  sector: string | null;
  personId: string;
  personName: string;
};

type Program = {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  enabledSectors: DesignationRole[];
  assignments: DesignationEntry[];
};

type DesignationConfig = {
  id: string;
  micCount: number;
  indicadorCount: number;
  indicadorSectors: string[];
  enabledSectors: DesignationRole[];
};

type EditorEntry = {
  id: string;
  date: string;
  role: DesignationRole;
  sector: string | null;
  personId: string;
};

type Editor = {
  dates: string[];
  entries: EditorEntry[];
  enabledSectors: DesignationRole[];
  programId: string | null;
};

type SectorItem = { id: string; value: string };

type TFunction = (key: string, options?: Record<string, unknown>) => string;

function formatDateKey(key: string, locale: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDesignationPerson(p: Person): DesignationPerson {
  return p;
}

async function fetchMeetingsForRange(range: {
  from: Date;
  to: Date;
}): Promise<Meeting[]> {
  const from = toDateKey(startOfWeek(range.from));
  const to = toDateKey(addDays(startOfWeek(range.to), 6));
  const res = await fetch(`/api/meetings?from=${from}&to=${to}`);
  const data = await res.json().catch(() => ({ meetings: [] }));
  return data.meetings ?? [];
}

function roleLabel(role: DesignationRole, t: TFunction): string {
  return t(`designations.roles.${role}`);
}

type Props = {
  role: string;
  orgName: string;
};

export function DesignationsClient({ role, orgName }: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language ?? "pt").startsWith("es") ? es : ptBR;
  const dateLocale = (i18n.language ?? "pt").startsWith("es")
    ? "es-ES"
    : "pt-BR";

  const canManage = role === "owner" || role === "admin";

  const [people, setPeople] = useState<Person[]>([]);
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [designationConfig, setDesignationConfig] =
    useState<DesignationConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [range, setRange] = useState<{ from: Date; to: Date } | null>(null);
  const [enabledSectors, setEnabledSectors] = useState<DesignationRole[]>(
    DESIGNATION_ROLES.slice(),
  );
  const [micCount, setMicCount] = useState(1);
  const [indicadorCount, setIndicadorCount] = useState(1);
  const [indicadorSectors, setIndicadorSectors] = useState<SectorItem[]>([
    { id: crypto.randomUUID(), value: "" },
  ]);
  const [saveDefault, setSaveDefault] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Program | null>(null);
  const [viewing, setViewing] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [peopleRes, configsRes, eventsRes, programsRes, configRes] =
      await Promise.all([
        fetch("/api/people"),
        fetch("/api/meeting-configs"),
        fetch("/api/special-events"),
        fetch("/api/designation-programs"),
        fetch("/api/designation-config"),
      ]);
    const [peopleData, configsData, eventsData, programsData, configData] =
      await Promise.all([
        peopleRes.json(),
        configsRes.json(),
        eventsRes.json(),
        programsRes.json(),
        configRes.json(),
      ]);
    setPeople(peopleData.people ?? []);
    setConfigs(configsData.configs ?? []);
    setEvents(eventsData.events ?? []);
    setPrograms(programsData.programs ?? []);
    setDesignationConfig(configData.config ?? null);
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const occupiedDates = useMemo(
    () => new Set(programs.flatMap((p) => p.assignments.map((a) => a.date))),
    [programs],
  );

  const monthTable = useMemo(() => {
    const now = new Date();
    const monthPrefix = now.toISOString().slice(0, 7);
    const monthEntries = programs
      .flatMap((p) => p.assignments)
      .filter((a) => a.date.startsWith(monthPrefix));

    if (monthEntries.length === 0) {
      return { columns: [], rows: [] };
    }

    const dateSet = new Set(monthEntries.map((a) => a.date));
    const roleSet = new Set(monthEntries.map((a) => a.role));
    const columns = DESIGNATION_ROLES.filter((role) => roleSet.has(role));

    const rows = [...dateSet]
      .sort()
      .map((date) => {
        const cells: Record<string, string[]> = {};
        for (const role of columns) {
          const names = monthEntries
            .filter(
              (a) =>
                a.date === date &&
                a.role === role &&
                a.personId &&
                a.personName,
            )
            .map((a) =>
              a.sector ? `${a.personName} (${a.sector})` : a.personName,
            );
          if (names.length > 0) cells[role] = names;
        }
        return { date, cells };
      })
      .filter((row) => Object.keys(row.cells).length > 0);

    return {
      columns: columns.map((role) => ({
        id: role,
        label: roleLabel(role, t),
      })),
      rows,
    };
  }, [programs, t]);

  const { included, skipped } = useMemo(() => {
    if (!range?.from || !range?.to) return { included: [], skipped: [] };
    return computeDesignationDates({
      start: range.from,
      end: range.to,
      configs,
      events,
      occupiedDates,
    });
  }, [range, configs, events, occupiedDates]);

  useEffect(() => {
    setIndicadorSectors((prev) => {
      if (prev.length === indicadorCount) return prev;
      const next = prev.slice(0, indicadorCount);
      while (next.length < indicadorCount) {
        next.push({ id: crypto.randomUUID(), value: "" });
      }
      return next;
    });
  }, [indicadorCount]);

  function openCreateModal() {
    setMicCount(designationConfig?.micCount ?? 1);
    setIndicadorCount(designationConfig?.indicadorCount ?? 1);
    setEnabledSectors(
      designationConfig?.enabledSectors?.length
        ? designationConfig.enabledSectors
        : DESIGNATION_ROLES.slice(),
    );
    const base =
      designationConfig && designationConfig.indicadorSectors.length > 0
        ? designationConfig.indicadorSectors
        : [""];
    setIndicadorSectors(
      base.map((value) => ({ id: crypto.randomUUID(), value })),
    );
    setSaveDefault(false);
    setRange(null);
    setModalOpen(true);
  }

  async function handleGenerate() {
    if (!range?.from || !range?.to) {
      toast.error(t("designations.selectRange"));
      return;
    }
    if (included.length === 0) {
      toast.error(t("designations.noDates"));
      return;
    }
    setGenerating(true);
    try {
      const sectors = indicadorSectors
        .map((s) => s.value.trim())
        .filter(Boolean);
      if (saveDefault) {
        const configRes = await fetch("/api/designation-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            micCount,
            indicadorCount,
            indicadorSectors: sectors,
            enabledSectors,
          }),
        });
        if (configRes.ok) {
          const configData = await configRes.json();
          setDesignationConfig(configData.config);
        }
      }

      const history = programs.flatMap((p) =>
        p.assignments.map((a) => ({
          date: parseDateKey(a.date),
          personId: a.personId,
          role: a.role,
        })),
      );
      const restrictions = buildDateRestrictions({
        meetings: await fetchMeetingsForRange(range),
        configs,
      });
      const drafts = generateDesignations({
        dates: included,
        people: people.map(toDesignationPerson),
        enabledSectors,
        micCount,
        indicadorCount,
        indicadorSectors: sectors,
        history,
        restrictions,
      });

      setEditor({
        dates: included.map(toDateKey),
        entries: drafts.map((d, index) => ({ id: `draft-${index}`, ...d })),
        enabledSectors,
        programId: null,
      });
      setModalOpen(false);
    } finally {
      setGenerating(false);
    }
  }

  function openEditor(program: Program) {
    const dates = [...new Set(program.assignments.map((a) => a.date))].sort();
    setEditor({
      dates,
      entries: program.assignments.map((a) => ({
        id: a.id,
        date: a.date,
        role: a.role,
        sector: a.sector,
        personId: a.personId,
      })),
      enabledSectors: program.enabledSectors?.length
        ? program.enabledSectors
        : DESIGNATION_ROLES.slice(),
      programId: program.id,
    });
  }

  async function handleSaveEditor() {
    if (!editor) return;
    if (editor.entries.length === 0) {
      toast.error(t("designations.noAssignments"));
      return;
    }
    setSaving(true);
    try {
      const dates = [...new Set(editor.entries.map((e) => e.date))].sort();
      const assignments = editor.entries.map((e) => ({
        date: e.date,
        role: e.role,
        sector: e.sector,
        personId: e.personId,
      }));
      const payload = {
        dates,
        assignments,
        enabledSectors: editor.enabledSectors,
      };
      const res = editor.programId
        ? await fetch(`/api/designation-programs/${editor.programId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/designation-programs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? t("designations.savedError"));
        return;
      }

      setEditor(null);
      await fetchAll();
      toast.success(t("designations.savedSuccess"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/designation-programs/${deleting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(t("designations.deletedError"));
        return;
      }
      setDeleting(null);
      await fetchAll();
      toast.success(t("designations.deletedSuccess"));
    } catch {
      toast.error(t("designations.deletedError"));
    }
  }

  async function handlePdf(program: Program) {
    setPdfBusyId(program.id);
    try {
      await generateDesignationsPdf({
        orgName,
        startDate: program.startDate,
        endDate: program.endDate,
        enabledSectors: program.enabledSectors?.length
          ? program.enabledSectors
          : DESIGNATION_ROLES.slice(),
        entries: program.assignments.map((a) => ({
          date: a.date,
          role: a.role,
          sector: a.sector,
          personName: a.personName,
        })),
        dateLocale,
        t,
      });
    } catch {
      toast.error(t("designations.pdfError"));
    } finally {
      setPdfBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-6 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("designations.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("designations.subtitle")}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("designations.currentMonth")}
        </h2>
        <MonthlyAssignmentsTable
          dateLabel={t("designations.date")}
          columns={monthTable.columns}
          rows={monthTable.rows}
          emptyMessage={t("designations.noAssignmentsMonth")}
          dateLocale={dateLocale}
        />
      </section>

      {canManage && (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-white/10 sm:p-6">
          <Button onClick={openCreateModal}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("designations.createProgram")}
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("designations.createHint")}
          </p>
        </section>
      )}

      <ProgramsSection
        programs={programs}
        canManage={canManage}
        pdfBusyId={pdfBusyId}
        onPdf={handlePdf}
        onView={setViewing}
        onEdit={openEditor}
        onDelete={setDeleting}
        t={t}
        formatDate={formatDateKey}
        dateLocale={dateLocale}
      />

      {modalOpen && (
        <CreateProgramModal
          open={modalOpen}
          locale={locale}
          range={range}
          onRangeChange={setRange}
          enabledSectors={enabledSectors}
          onEnabledSectorsChange={setEnabledSectors}
          micCount={micCount}
          onMicCountChange={setMicCount}
          indicadorCount={indicadorCount}
          onIndicadorCountChange={setIndicadorCount}
          indicadorSectors={indicadorSectors}
          onIndicadorSectorsChange={setIndicadorSectors}
          saveDefault={saveDefault}
          onSaveDefaultChange={setSaveDefault}
          included={included}
          skipped={skipped}
          generating={generating}
          onGenerate={handleGenerate}
          onCancel={() => setModalOpen(false)}
          t={t}
          dateLocale={dateLocale}
          formatDate={formatDateKey}
        />
      )}

      {editor && (
        <EditorDialog
          editor={editor}
          people={people}
          saving={saving}
          dateLocale={dateLocale}
          onSave={handleSaveEditor}
          onCancel={() => setEditor(null)}
          onChange={setEditor}
          t={t}
          formatDate={formatDateKey}
        />
      )}

      {viewing && (
        <ViewProgramDialog
          program={viewing}
          onClose={() => setViewing(null)}
          t={t}
          dateLocale={dateLocale}
          formatDate={formatDateKey}
        />
      )}

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("designations.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("designations.deleteConfirmDescription")}
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

function CreateProgramModal({
  open,
  locale,
  range,
  onRangeChange,
  enabledSectors,
  onEnabledSectorsChange,
  micCount,
  onMicCountChange,
  indicadorCount,
  onIndicadorCountChange,
  indicadorSectors,
  onIndicadorSectorsChange,
  saveDefault,
  onSaveDefaultChange,
  included,
  skipped,
  generating,
  onGenerate,
  onCancel,
  t,
  dateLocale,
  formatDate,
}: {
  open: boolean;
  locale: Locale;
  range: { from: Date; to: Date } | null;
  onRangeChange: (range: { from: Date; to: Date } | null) => void;
  enabledSectors: DesignationRole[];
  onEnabledSectorsChange: (value: DesignationRole[]) => void;
  micCount: number;
  onMicCountChange: (value: number) => void;
  indicadorCount: number;
  onIndicadorCountChange: (value: number) => void;
  indicadorSectors: SectorItem[];
  onIndicadorSectorsChange: (value: SectorItem[]) => void;
  saveDefault: boolean;
  onSaveDefaultChange: (value: boolean) => void;
  included: Date[];
  skipped: { date: Date; reason: SkippedReason }[];
  generating: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  t: TFunction;
  dateLocale: string;
  formatDate: (key: string, locale: string) => string;
}) {
  const setSector = (id: string, value: string) => {
    onIndicadorSectorsChange(
      indicadorSectors.map((item) =>
        item.id === id ? { ...item, value } : item,
      ),
    );
  };

  const toggleSector = (role: DesignationRole, enabled: boolean) => {
    onEnabledSectorsChange(
      enabled
        ? [...enabledSectors, role]
        : enabledSectors.filter((r) => r !== role),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("designations.createProgram")}</DialogTitle>
          <DialogDescription>{t("designations.modalHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>{t("designations.period")}</Label>
            <div className="mt-2 flex justify-center rounded-2xl bg-muted/50 p-3">
              <Calendar
                mode="range"
                locale={locale}
                weekStartsOn={1}
                selected={
                  range ? { from: range.from, to: range.to } : undefined
                }
                onSelect={(value) =>
                  onRangeChange(
                    value?.from && value.to
                      ? { from: value.from, to: value.to }
                      : null,
                  )
                }
              />
            </div>
          </div>

          <div>
            <Label>{t("designations.sectors")}</Label>
            <div className="mt-2 space-y-2">
              {DESIGNATION_ROLES.map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-medium">
                    {roleLabel(role, t)}
                  </span>
                  <select
                    value={enabledSectors.includes(role) ? "on" : "off"}
                    onChange={(e) =>
                      toggleSector(role, e.target.value === "on")
                    }
                    className="w-40 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="on">
                      {t("designations.sectorEnabled")}
                    </option>
                    <option value="off">
                      {t("designations.sectorDisabled")}
                    </option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {(enabledSectors.includes("mic") ||
            enabledSectors.includes("indicador")) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {enabledSectors.includes("mic") && (
                <div>
                  <Label htmlFor="mic-count">
                    {t("designations.micCount")}
                  </Label>
                  <input
                    id="mic-count"
                    type="number"
                    min={1}
                    max={50}
                    value={micCount}
                    onChange={(e) =>
                      onMicCountChange(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              )}
              {enabledSectors.includes("indicador") && (
                <div>
                  <Label htmlFor="indicador-count">
                    {t("designations.indicadorCount")}
                  </Label>
                  <input
                    id="indicador-count"
                    type="number"
                    min={1}
                    max={50}
                    value={indicadorCount}
                    onChange={(e) =>
                      onIndicadorCountChange(
                        Math.max(1, Number(e.target.value) || 1),
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              )}
            </div>
          )}

          {enabledSectors.includes("indicador") && (
            <div className="space-y-2">
              <Label>{t("designations.indicadorSector")}</Label>
              {indicadorSectors.map((item, index) => (
                <input
                  key={item.id}
                  type="text"
                  value={item.value}
                  onChange={(e) => setSector(item.id, e.target.value)}
                  placeholder={t("designations.indicadorSectorPlaceholder", {
                    n: index + 1,
                  })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="save-default">
              {t("designations.saveAsDefault")}
            </Label>
            <select
              id="save-default"
              value={saveDefault ? "yes" : "no"}
              onChange={(e) => onSaveDefaultChange(e.target.value === "yes")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="no">{t("designations.saveDefaultNo")}</option>
              <option value="yes">{t("designations.saveDefaultYes")}</option>
            </select>
          </div>

          {range?.from && range?.to && (
            <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
              <p>
                {t("designations.includedCount", {
                  count: included.length,
                })}
              </p>
              {included.length > 0 && (
                <p className="text-muted-foreground">
                  {included
                    .map((d) => formatDate(toDateKey(d), dateLocale))
                    .join(" · ")}
                </p>
              )}
              {skipped.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium">
                    {t("designations.skippedTitle")}
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    {skipped.map((item) => (
                      <li key={`${toDateKey(item.date)}-${item.reason}`}>
                        {formatDate(toDateKey(item.date), dateLocale)} —{" "}
                        {t(`designations.skipReason.${item.reason}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onGenerate}
            disabled={generating || !range?.from || !range?.to}
          >
            {generating
              ? t("designations.generating")
              : t("designations.generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgramsSection({
  programs,
  canManage,
  pdfBusyId,
  onPdf,
  onView,
  onEdit,
  onDelete,
  t,
  formatDate,
  dateLocale,
}: {
  programs: Program[];
  canManage: boolean;
  pdfBusyId: string | null;
  onPdf: (program: Program) => void;
  onView: (program: Program) => void;
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
  t: TFunction;
  formatDate: (key: string, locale: string) => string;
  dateLocale: string;
}) {
  if (programs.length === 0) {
    return (
      <section aria-label={t("designations.savedPrograms")}>
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("designations.savedPrograms")}
          </h2>
          <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("designations.noPrograms")}
        </p>
      </section>
    );
  }

  return (
    <section aria-label={t("designations.savedPrograms")}>
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("designations.savedPrograms")}
        </h2>
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
      </div>
      <ul className="mt-2 space-y-2">
        {programs.map((program) => (
          <li
            key={program.id}
            className="flex flex-col gap-3 rounded-2xl bg-card p-3 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {formatDate(program.startDate, dateLocale)} –{" "}
                {formatDate(program.endDate, dateLocale)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("designations.programAssignments", {
                  count: program.assignments.length,
                })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(program)}
              >
                <Eye aria-hidden="true" />
                {t("designations.viewButton")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPdf(program)}
                disabled={pdfBusyId === program.id}
              >
                {pdfBusyId === program.id ? (
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                ) : (
                  <Printer aria-hidden="true" />
                )}
                {t("designations.pdfButton")}
              </Button>
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(program)}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(program)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete")}
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ViewProgramDialog({
  program,
  onClose,
  t,
  formatDate,
  dateLocale,
}: {
  program: Program;
  onClose: () => void;
  t: TFunction;
  formatDate: (key: string, locale: string) => string;
  dateLocale: string;
}) {
  const dates = [...new Set(program.assignments.map((a) => a.date))].sort();
  const enabledSectors = program.enabledSectors?.length
    ? program.enabledSectors
    : DESIGNATION_ROLES.slice();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("designations.viewTitle")}</DialogTitle>
          <DialogDescription>
            {t("designations.viewDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {dates.map((dateKey) => {
            const dateEntries = program.assignments.filter(
              (a) => a.date === dateKey,
            );
            return (
              <div
                key={dateKey}
                className="rounded-2xl bg-muted/40 p-4 ring-1 ring-white/5"
              >
                <h4 className="mb-3 text-sm font-semibold">
                  {formatDate(dateKey, dateLocale)}
                </h4>
                <ul className="space-y-2">
                  {enabledSectors
                    .filter((role) => dateEntries.some((e) => e.role === role))
                    .map((role) =>
                      dateEntries
                        .filter((e) => e.role === role)
                        .map((entry) => (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-sm text-muted-foreground">
                              {roleLabel(role, t)}
                            </span>
                            <span className="flex items-center gap-2 text-right">
                              <span className="text-sm font-medium">
                                {entry.personName}
                              </span>
                              {entry.sector ? (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                                  {entry.sector}
                                </span>
                              ) : null}
                            </span>
                          </li>
                        )),
                    )}
                </ul>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditorDialog({
  editor,
  people,
  saving,
  dateLocale,
  onSave,
  onCancel,
  onChange,
  t,
  formatDate,
}: {
  editor: Editor;
  people: Person[];
  saving: boolean;
  dateLocale: string;
  onSave: () => void;
  onCancel: () => void;
  onChange: (editor: Editor) => void;
  t: TFunction;
  formatDate: (key: string, locale: string) => string;
}) {
  const setEntry = (id: string, patch: Partial<EditorEntry>) => {
    onChange({
      ...editor,
      entries: editor.entries.map((e) =>
        e.id === id ? { ...e, ...patch } : e,
      ),
    });
  };

  const addEntry = (
    date: string,
    role: DesignationRole,
    personId = "",
    sector: string | null = null,
  ) => {
    onChange({
      ...editor,
      entries: [
        ...editor.entries,
        {
          id: `new-${date}-${role}-${editor.entries.length}`,
          date,
          role,
          sector,
          personId,
        },
      ],
    });
  };

  const removeEntry = (id: string) => {
    onChange({
      ...editor,
      entries: editor.entries.filter((e) => e.id !== id),
    });
  };

  const handleSingleChange = (
    dateKey: string,
    role: DesignationRole,
    personId: string,
  ) => {
    const existing = editor.entries.find(
      (e) => e.date === dateKey && e.role === role,
    );
    if (existing) {
      setEntry(existing.id, { personId });
    } else if (personId) {
      addEntry(dateKey, role, personId);
    }
  };

  return (
    <Dialog open={Boolean(editor)} onOpenChange={onCancel}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("designations.reviewTitle")}</DialogTitle>
          <DialogDescription>
            {t("designations.reviewDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {editor.dates.map((dateKey) => {
            const dateEntries = editor.entries.filter(
              (e) => e.date === dateKey,
            );
            const usedOnDate = new Set(
              dateEntries.filter((e) => e.personId).map((e) => e.personId),
            );
            return (
              <div key={dateKey} className="rounded-2xl bg-muted/50 p-4">
                <h4 className="mb-3 text-sm font-semibold">
                  {formatDate(dateKey, dateLocale)}
                </h4>
                <div className="space-y-4">
                  {DESIGNATION_ROLES.filter((role) =>
                    editor.enabledSectors.includes(role),
                  ).map((role) => {
                    const roleEntries = dateEntries.filter(
                      (e) => e.role === role,
                    );
                    const multiple = role === "mic" || role === "indicador";
                    return (
                      <div key={role} className="space-y-2">
                        <p className="text-sm font-medium">
                          {roleLabel(role, t)}
                        </p>
                        {!multiple && (
                          <select
                            value={roleEntries[0]?.personId ?? ""}
                            onChange={(e) =>
                              handleSingleChange(dateKey, role, e.target.value)
                            }
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                          >
                            <option value="">
                              {t("designations.assignPerson")}
                            </option>
                            {candidatesFor(
                              people,
                              role,
                              usedOnDate,
                              roleEntries[0]?.personId,
                            ).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {multiple &&
                          roleEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-col gap-2 sm:flex-row sm:items-center"
                            >
                              <select
                                value={entry.personId}
                                onChange={(e) =>
                                  setEntry(entry.id, {
                                    personId: e.target.value,
                                  })
                                }
                                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                              >
                                <option value="">
                                  {t("designations.assignPerson")}
                                </option>
                                {candidatesFor(
                                  people,
                                  role,
                                  usedOnDate,
                                  entry.personId,
                                ).map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              {role === "indicador" && (
                                <input
                                  type="text"
                                  value={entry.sector ?? ""}
                                  onChange={(e) =>
                                    setEntry(entry.id, {
                                      sector: e.target.value,
                                    })
                                  }
                                  placeholder={t(
                                    "designations.indicadorSectorShort",
                                  )}
                                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 sm:w-48"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEntry(entry.id)}
                              >
                                {t("common.remove")}
                              </Button>
                            </div>
                          ))}
                        {multiple && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addEntry(dateKey, role)}
                          >
                            {t("designations.addAssignment")}
                          </Button>
                        )}
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
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? t("designations.saving") : t("designations.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function candidatesFor(
  people: Person[],
  role: DesignationRole,
  usedOnDate: Set<string>,
  currentId?: string,
): Person[] {
  const privilege = ROLE_PRIVILEGE[role] as keyof Person;
  return people
    .filter(
      (p) =>
        p.active &&
        p.sex === "MALE" &&
        p[privilege] === true &&
        (!usedOnDate.has(p.id) || p.id === currentId),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

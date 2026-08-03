"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { isValidDateRange, isValidSongNumber } from "@/lib/content-validation";
import {
  type ApostilaParte,
  type ApostilaSecao,
  type ApostilaSemana,
  emptyApostilaParte,
  type MeetingContentItem,
  type SentinelaItem,
} from "./meeting-content-types";

export type SongTitleResolver = (
  num: number | null | undefined,
) => string | null;

export function ItemEditor({
  type,
  item,
  songTitle,
  onSave,
}: {
  type: string;
  item: MeetingContentItem;
  songTitle?: SongTitleResolver;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  switch (type) {
    case "apostila":
      return (
        <ApostilaEditor
          initial={item.data as unknown as ApostilaSemana}
          onSave={onSave}
        />
      );
    case "sentinela":
      return (
        <SentinelaEditor
          initial={item.data as unknown as SentinelaItem}
          songTitle={songTitle}
          onSave={onSave}
        />
      );
    default:
      return <BasicEditor initial={item.data} onSave={onSave} />;
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  error?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0 flex-1">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
      />
      {error ? (
        <p className="mt-1 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SaveBar({
  saving,
  onSave,
  error,
}: {
  saving: boolean;
  onSave: () => void;
  error?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {saving ? t("common.loading") : t("common.save")}
      </button>
    </div>
  );
}

function BasicEditor({
  initial,
  onSave,
}: {
  initial: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [number, setNumber] = useState(
    initial.number === null || initial.number === undefined
      ? ""
      : String(initial.number),
  );
  const [theme, setTheme] = useState(String(initial.theme ?? ""));
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      if (number.trim() !== "" && !Number.isInteger(Number(number))) {
        setFieldError(t("meetingContent.errorInvalidNumber"));
        return;
      }
      setFieldError(null);
      const ok = await onSave({
        number: number.trim() === "" ? null : Number(number),
        theme,
      });
      if (!ok) setSaveError(t("meetingContent.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="w-24">
          <Field
            label={t("meetingContent.number")}
            value={number}
            onChange={setNumber}
            type="number"
            error={fieldError ?? undefined}
          />
        </div>
        <div className="min-w-0 flex-1">
          <Field
            label={t("meetingContent.theme")}
            value={theme}
            onChange={setTheme}
          />
        </div>
      </div>
      <SaveBar
        saving={saving}
        onSave={handleSave}
        error={saveError ?? undefined}
      />
    </div>
  );
}

function SentinelaEditor({
  initial,
  songTitle,
  onSave,
}: {
  initial: SentinelaItem;
  songTitle?: SongTitleResolver;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [week, setWeek] = useState(initial.week ?? "");
  const [theme, setTheme] = useState(initial.theme ?? "");
  const [openNum, setOpenNum] = useState(
    initial.songs?.opening?.number != null
      ? String(initial.songs.opening.number)
      : "",
  );
  const [openTitle, setOpenTitle] = useState(
    initial.songs?.opening?.title ?? "",
  );
  const [closeNum, setCloseNum] = useState(
    initial.songs?.closing?.number != null
      ? String(initial.songs.closing.number)
      : "",
  );
  const [closeTitle, setCloseTitle] = useState(
    initial.songs?.closing?.title ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      if (!isValidSongNumber(openNum)) {
        setOpenError(t("meetingContent.errorInvalidSong"));
        return;
      }
      if (!isValidSongNumber(closeNum)) {
        setCloseError(t("meetingContent.errorInvalidSong"));
        return;
      }
      setOpenError(null);
      setCloseError(null);
      const ok = await onSave({
        week,
        theme,
        songs: {
          opening: {
            number: openNum === "" ? null : Number(openNum),
            title: openTitle,
          },
          closing: {
            number: closeNum === "" ? null : Number(closeNum),
            title: closeTitle,
          },
        },
      });
      if (!ok) setSaveError(t("meetingContent.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field label={t("meetingContent.week")} value={week} onChange={setWeek} />
      <Field
        label={t("meetingContent.theme")}
        value={theme}
        onChange={setTheme}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-24">
          <Field
            label={t("meetingContent.openingSong")}
            value={openNum}
            onChange={setOpenNum}
            type="number"
            error={openError ?? undefined}
          />
          {songTitle && openNum ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {songTitle(Number(openNum)) ?? "—"}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <Field
            label={t("meetingContent.openingSongTitle")}
            value={openTitle}
            onChange={setOpenTitle}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="w-24">
          <Field
            label={t("meetingContent.closingSong")}
            value={closeNum}
            onChange={setCloseNum}
            type="number"
            error={closeError ?? undefined}
          />
          {songTitle && closeNum ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {songTitle(Number(closeNum)) ?? "—"}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <Field
            label={t("meetingContent.closingSongTitle")}
            value={closeTitle}
            onChange={setCloseTitle}
          />
        </div>
      </div>
      <SaveBar
        saving={saving}
        onSave={handleSave}
        error={saveError ?? undefined}
      />
    </div>
  );
}

function ApostilaEditor({
  initial,
  onSave,
}: {
  initial: ApostilaSemana;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [semana, setSemana] = useState(initial.semana ?? "");
  const [dateRange, setDateRange] = useState(initial.dateRange ?? "");
  const [canticoInicial, setCanticoInicial] = useState(
    initial.canticoInicial != null ? String(initial.canticoInicial) : "",
  );
  const [canticoFinal, setCanticoFinal] = useState(
    initial.canticoFinal != null ? String(initial.canticoFinal) : "",
  );
  const [secoes, setSecoes] = useState<ApostilaSecao[]>(initial.secoes ?? []);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [songError, setSongError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function updateParte(
    sectionIndex: number,
    parteIndex: number,
    patch: Partial<ApostilaParte>,
  ) {
    setSecoes((prev) =>
      prev.map((sec, si) =>
        si === sectionIndex
          ? {
              ...sec,
              partes: sec.partes.map((p, pi) =>
                pi === parteIndex ? { ...p, ...patch } : p,
              ),
            }
          : sec,
      ),
    );
  }

  function removeParte(sectionIndex: number, parteIndex: number) {
    setSecoes((prev) =>
      prev.map((sec, si) =>
        si === sectionIndex
          ? {
              ...sec,
              partes: sec.partes
                .filter((_, pi) => pi !== parteIndex)
                .map((p, i) => ({ ...p, order: i + 1 })),
            }
          : sec,
      ),
    );
  }

  function addParte(sectionIndex: number) {
    setSecoes((prev) =>
      prev.map((sec, si) =>
        si === sectionIndex
          ? {
              ...sec,
              partes: [
                ...sec.partes,
                emptyApostilaParte(sec.partes.length + 1),
              ],
            }
          : sec,
      ),
    );
  }

  function updateSecao(sectionIndex: number, patch: Partial<ApostilaSecao>) {
    setSecoes((prev) =>
      prev.map((sec, si) => (si === sectionIndex ? { ...sec, ...patch } : sec)),
    );
  }

  function removeSecao(sectionIndex: number) {
    setSecoes((prev) => prev.filter((_, si) => si !== sectionIndex));
  }

  function addSecao() {
    setSecoes((prev) => [...prev, { secao: "", partes: [] }]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (dateRange.trim() !== "" && !isValidDateRange(dateRange)) {
        setDateError(t("meetingContent.errorInvalidDateRange"));
        return;
      }
      if (
        !isValidSongNumber(canticoInicial) ||
        !isValidSongNumber(canticoFinal)
      ) {
        setSongError(t("meetingContent.errorInvalidSong"));
        return;
      }
      setDateError(null);
      setSongError(null);
      const ok = await onSave({
        semana,
        dateRange,
        canticoInicial: canticoInicial === "" ? null : Number(canticoInicial),
        secoes,
        canticoFinal: canticoFinal === "" ? null : Number(canticoFinal),
      });
      if (!ok) setSaveError(t("meetingContent.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-0 flex-[2]">
          <Field
            label={t("meetingContent.week")}
            value={semana}
            onChange={setSemana}
          />
        </div>
        <div className="min-w-0 flex-1">
          <Field
            label={t("meetingContent.dateRange")}
            value={dateRange}
            onChange={setDateRange}
            placeholder="20260706-20260712"
            error={dateError ?? undefined}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="w-36">
          <Field
            label={t("meetingContent.openingSong")}
            value={String(canticoInicial)}
            onChange={(v) => setCanticoInicial(v === "" ? "" : v)}
            type="number"
            error={songError ?? undefined}
          />
        </div>
        <div className="w-36">
          <Field
            label={t("meetingContent.closingSong")}
            value={String(canticoFinal)}
            onChange={(v) => setCanticoFinal(v === "" ? "" : v)}
            type="number"
            error={songError ?? undefined}
          />
        </div>
      </div>

      <div className="space-y-3">
        {secoes.map((sec, si) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: sections have no stable id and are not reordered
            key={si}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-center gap-2">
              <input
                value={sec.secao}
                onChange={(e) => updateSecao(si, { secao: e.target.value })}
                placeholder={t("meetingContent.section")}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="w-36">
                <Field
                  label={t("meetingContent.middleSong")}
                  value={sec.cancionMedia ? String(sec.cancionMedia) : ""}
                  onChange={(v) =>
                    updateSecao(si, {
                      cancionMedia: v === "" ? null : Number(v),
                    })
                  }
                  type="number"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSecao(si)}
                className="shrink-0 text-sm font-medium text-destructive hover:underline"
              >
                {t("common.remove")}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {sec.partes.map((p, pi) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id and are not reordered
                  key={pi}
                  className="flex flex-wrap items-end gap-2 rounded-lg bg-card p-3 ring-1 ring-border"
                >
                  <div className="w-16">
                    <Field
                      label={t("meetingContent.order")}
                      value={String(p.order)}
                      onChange={(v) =>
                        updateParte(si, pi, {
                          order: v === "" ? 0 : Number(v),
                        })
                      }
                      type="number"
                    />
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <Field
                      label={t("meetingContent.parte")}
                      value={p.parte}
                      onChange={(v) => updateParte(si, pi, { parte: v })}
                    />
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <Field
                      label={t("meetingContent.theme")}
                      value={p.tema}
                      onChange={(v) => updateParte(si, pi, { tema: v })}
                    />
                  </div>
                  <div className="w-24">
                    <Field
                      label={t("meetingContent.tempo")}
                      value={p.tempo}
                      onChange={(v) => updateParte(si, pi, { tempo: v })}
                    />
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <Field
                      label={t("meetingContent.modalidade")}
                      value={p.modalidade ?? ""}
                      onChange={(v) =>
                        updateParte(si, pi, {
                          modalidade: v === "" ? null : v,
                        })
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <Field
                      label={t("meetingContent.fonte")}
                      value={p.fonte ?? ""}
                      onChange={(v) =>
                        updateParte(si, pi, { fonte: v === "" ? null : v })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParte(si, pi)}
                    className="shrink-0 px-2 py-2 text-sm font-medium text-destructive hover:underline"
                  >
                    {t("common.remove")}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addParte(si)}
                className="rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                + {t("meetingContent.addPart")}
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addSecao}
          className="rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          + {t("meetingContent.addSection")}
        </button>
      </div>

      <SaveBar
        saving={saving}
        onSave={handleSave}
        error={saveError ?? undefined}
      />
    </div>
  );
}

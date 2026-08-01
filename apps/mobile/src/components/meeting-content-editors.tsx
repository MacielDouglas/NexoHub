import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  emptyApostilaParte,
  emptyApostilaSecao,
  type ApostilaParte,
  type ApostilaSecao,
  type ApostilaSemana,
  type MeetingContentItem,
  type SentinelaItem,
} from '@/lib/meeting-content-types';

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  error?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        style={[
          styles.input,
          { borderColor: error ? theme.danger : theme.border },
        ]}
      />
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
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
  const theme = useTheme();
  return (
    <View style={styles.saveRow}>
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}
      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.primaryBtn,
          { backgroundColor: theme.primary },
          pressed && { opacity: 0.8 },
          saving && { opacity: 0.5 },
        ]}
      >
        <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
          {saving ? t('common.loading') : t('common.save')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const SONGS = new Set(Array.from({ length: 161 }, (_, i) => i + 1));

function isValidDateRange(value: string): boolean {
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

function isValidSongNumber(value: string): boolean {
  if (value.trim() === '') return true;
  const n = Number(value);
  return Number.isInteger(n) && SONGS.has(n);
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
      ? ''
      : String(initial.number),
  );
  const [theme, setTheme] = useState(String(initial.theme ?? ''));
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      if (number.trim() !== '' && !Number.isInteger(Number(number))) {
        setFieldError(t('meetingContent.errorInvalidNumber'));
        return;
      }
      setFieldError(null);
      const ok = await onSave({
        number: number.trim() === '' ? null : Number(number),
        theme,
      });
      if (!ok) setSaveError(t('meetingContent.errorSave'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.editor}>
      <Field
        label={t('meetingContent.number')}
        value={number}
        onChange={setNumber}
        keyboardType="numeric"
        error={fieldError ?? undefined}
      />
      <Field
        label={t('meetingContent.theme')}
        value={theme}
        onChange={setTheme}
      />
      <SaveBar
        saving={saving}
        onSave={handleSave}
        error={saveError ?? undefined}
      />
    </View>
  );
}

function SentinelaEditor({
  initial,
  songTitle,
  onSave,
}: {
  initial: SentinelaItem;
  songTitle?: (num: number | null | undefined) => string | null;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [week, setWeek] = useState(initial.week ?? '');
  const [theme, setTheme] = useState(initial.theme ?? '');
  const [openNum, setOpenNum] = useState(
    initial.songs?.opening?.number != null
      ? String(initial.songs.opening.number)
      : '',
  );
  const [openTitle, setOpenTitle] = useState(initial.songs?.opening?.title ?? '');
  const [closeNum, setCloseNum] = useState(
    initial.songs?.closing?.number != null
      ? String(initial.songs.closing.number)
      : '',
  );
  const [closeTitle, setCloseTitle] = useState(
    initial.songs?.closing?.title ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      if (!isValidSongNumber(openNum)) {
        setOpenError(t('meetingContent.errorInvalidSong'));
        return;
      }
      if (!isValidSongNumber(closeNum)) {
        setCloseError(t('meetingContent.errorInvalidSong'));
        return;
      }
      setOpenError(null);
      setCloseError(null);
      const ok = await onSave({
        week,
        theme,
        songs: {
          opening: {
            number: openNum.trim() === '' ? null : Number(openNum),
            title: openTitle,
          },
          closing: {
            number: closeNum.trim() === '' ? null : Number(closeNum),
            title: closeTitle,
          },
        },
      });
      if (!ok) setSaveError(t('meetingContent.errorSave'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.editor}>
      <Field label={t('meetingContent.week')} value={week} onChange={setWeek} />
      <Field label={t('meetingContent.theme')} value={theme} onChange={setTheme} />
      <View style={styles.row}>
        <View style={styles.narrowField}>
          <Field
            label={t('meetingContent.openingSong')}
            value={openNum}
            onChange={setOpenNum}
            keyboardType="numeric"
            error={openError ?? undefined}
          />
          {songTitle && openNum ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {songTitle(Number(openNum)) ?? '—'}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.wideField}>
          <Field
            label={t('meetingContent.openingSongTitle')}
            value={openTitle}
            onChange={setOpenTitle}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.narrowField}>
          <Field
            label={t('meetingContent.closingSong')}
            value={closeNum}
            onChange={setCloseNum}
            keyboardType="numeric"
            error={closeError ?? undefined}
          />
          {songTitle && closeNum ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {songTitle(Number(closeNum)) ?? '—'}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.wideField}>
          <Field
            label={t('meetingContent.closingSongTitle')}
            value={closeTitle}
            onChange={setCloseTitle}
          />
        </View>
      </View>
      <SaveBar
        saving={saving}
        onSave={handleSave}
        error={saveError ?? undefined}
      />
    </View>
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
  const theme = useTheme();
  const [semana, setSemana] = useState(initial.semana ?? '');
  const [dateRange, setDateRange] = useState(initial.dateRange ?? '');
  const [canticoInicial, setCanticoInicial] = useState(
    initial.canticoInicial != null ? String(initial.canticoInicial) : '',
  );
  const [canticoFinal, setCanticoFinal] = useState(
    initial.canticoFinal != null ? String(initial.canticoFinal) : '',
  );
  const [secoes, setSecoes] = useState<ApostilaSecao[]>(initial.secoes ?? []);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [songError, setSongError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function updateSecao(index: number, patch: Partial<ApostilaSecao>) {
    setSecoes((prev) =>
      prev.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)),
    );
  }

  function updateParte(
    secIndex: number,
    partIndex: number,
    patch: Partial<ApostilaParte>,
  ) {
    setSecoes((prev) =>
      prev.map((sec, i) =>
        i === secIndex
          ? {
              ...sec,
              partes: sec.partes.map((p, j) =>
                j === partIndex ? { ...p, ...patch } : p,
              ),
            }
          : sec,
      ),
    );
  }

  function removeSecao(index: number) {
    setSecoes((prev) => prev.filter((_, i) => i !== index));
  }

  function addSecao() {
    setSecoes((prev) => [...prev, emptyApostilaSecao()]);
  }

  function removeParte(secIndex: number, partIndex: number) {
    setSecoes((prev) =>
      prev.map((sec, i) =>
        i === secIndex
          ? { ...sec, partes: sec.partes.filter((_, j) => j !== partIndex) }
          : sec,
      ),
    );
  }

  function addParte(secIndex: number) {
    setSecoes((prev) =>
      prev.map((sec, i) => {
        if (i !== secIndex) return sec;
        const nextOrder =
          sec.partes.reduce((max, p) => Math.max(max, p.order), 0) + 1;
        return { ...sec, partes: [...sec.partes, emptyApostilaParte(nextOrder)] };
      }),
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (dateRange.trim() !== '' && !isValidDateRange(dateRange)) {
        setDateError(t('meetingContent.errorInvalidDateRange'));
        return;
      }
      if (
        !isValidSongNumber(canticoInicial) ||
        !isValidSongNumber(canticoFinal)
      ) {
        setSongError(t('meetingContent.errorInvalidSong'));
        return;
      }
      setDateError(null);
      setSongError(null);
      const ok = await onSave({
        semana,
        dateRange,
        canticoInicial:
          canticoInicial.trim() === '' ? null : Number(canticoInicial),
        canticoFinal: canticoFinal.trim() === '' ? null : Number(canticoFinal),
        secoes,
      });
      if (!ok) setSaveError(t('meetingContent.errorSave'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.editor}>
      <Field label={t('meetingContent.week')} value={semana} onChange={setSemana} />
        <Field
          label={t('meetingContent.dateRange')}
          value={dateRange}
          onChange={setDateRange}
          error={dateError ?? undefined}
        />
        <View style={styles.row}>
          <View style={styles.narrowField}>
            <Field
              label={t('meetingContent.openingSong')}
              value={canticoInicial}
              onChange={setCanticoInicial}
              keyboardType="numeric"
              error={songError ?? undefined}
            />
          </View>
          <View style={styles.narrowField}>
            <Field
              label={t('meetingContent.closingSong')}
              value={canticoFinal}
              onChange={setCanticoFinal}
              keyboardType="numeric"
              error={songError ?? undefined}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold">{t('meetingContent.section')}</ThemedText>
          <Pressable onPress={addSecao} style={({ pressed }) => pressed && { opacity: 0.7 }}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              + {t('meetingContent.addSection')}
            </ThemedText>
          </Pressable>
        </View>

        {secoes.map((sec, si) => (
          <ThemedView key={si} type="backgroundElement" style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <TextInput
                value={sec.secao}
                onChangeText={(v) => updateSecao(si, { secao: v })}
                placeholder={t('meetingContent.section')}
                placeholderTextColor={theme.textSecondary}
                style={[styles.sectionTitleInput, { borderColor: theme.border }]}
              />
              <View style={styles.narrowField}>
                <Field
                  label={t('meetingContent.middleSong')}
                  value={sec.cancionMedia != null ? String(sec.cancionMedia) : ''}
                  onChange={(v) =>
                    updateSecao(si, {
                      cancionMedia: v === '' ? null : Number(v),
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
              <Pressable
                onPress={() => removeSecao(si)}
                style={({ pressed }) => pressed && { opacity: 0.7 }}
              >
                <ThemedText type="small" style={{ color: theme.danger }}>
                  {t('common.remove')}
                </ThemedText>
              </Pressable>
            </View>

            {sec.partes.map((p, pi) => (
              <ThemedView key={pi} type="backgroundSelected" style={styles.partCard}>
                <View style={styles.row}>
                  <View style={styles.narrowField}>
                    <Field
                      label={t('meetingContent.order')}
                      value={String(p.order)}
                      onChange={(v) =>
                        updateParte(si, pi, {
                          order: v === '' ? 0 : Number(v),
                        })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.wideField}>
                    <Field
                      label={t('meetingContent.parte')}
                      value={p.parte}
                      onChange={(v) => updateParte(si, pi, { parte: v })}
                    />
                  </View>
                  <Pressable
                    onPress={() => removeParte(si, pi)}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}
                  >
                    <ThemedText type="small" style={{ color: theme.danger }}>
                      {t('common.remove')}
                    </ThemedText>
                  </Pressable>
                </View>
                <Field
                  label={t('meetingContent.theme')}
                  value={p.tema}
                  onChange={(v) => updateParte(si, pi, { tema: v })}
                />
                <View style={styles.row}>
                  <View style={styles.wideField}>
                    <Field
                      label={t('meetingContent.tempo')}
                      value={p.tempo}
                      onChange={(v) => updateParte(si, pi, { tempo: v })}
                    />
                  </View>
                  <View style={styles.wideField}>
                    <Field
                      label={t('meetingContent.modalidade')}
                      value={p.modalidade ?? ''}
                      onChange={(v) => updateParte(si, pi, { modalidade: v })}
                    />
                  </View>
                </View>
                <Field
                  label={t('meetingContent.fonte')}
                  value={p.fonte ?? ''}
                  onChange={(v) => updateParte(si, pi, { fonte: v })}
                />
              </ThemedView>
            ))}

            <Pressable
              onPress={() => addParte(si)}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <ThemedText type="small" style={{ color: theme.primary }}>
                + {t('meetingContent.addPart')}
              </ThemedText>
            </Pressable>
          </ThemedView>
        ))}

        <SaveBar
          saving={saving}
          onSave={handleSave}
          error={saveError ?? undefined}
        />
      </View>
  );
}

export function ItemEditor({
  type,
  item,
  songTitle,
  onSave,
}: {
  type: string;
  item: MeetingContentItem;
  songTitle?: (num: number | null | undefined) => string | null;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  switch (type) {
    case 'apostila':
      return (
        <ApostilaEditor
          initial={item.data as unknown as ApostilaSemana}
          onSave={onSave}
        />
      );
    case 'sentinela':
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

const styles = StyleSheet.create({
  editor: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  field: {
    gap: Spacing.half,
    minWidth: 0,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    alignItems: 'flex-end',
  },
  narrowField: {
    width: 96,
  },
  wideField: {
    flex: 1,
    minWidth: 120,
  },
  saveRow: {
    alignItems: 'flex-end',
  },
  primaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  sectionCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  sectionTitleInput: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  partCard: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});

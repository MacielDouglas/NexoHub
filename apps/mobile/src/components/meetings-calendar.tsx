import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OptionPicker, type PickerOption } from '@/components/option-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import {
  addDays,
  buildMidweekProgram,
  buildSlots,
  buildWeekendProgram,
  deriveWeek,
  eachDayInRange,
  eligiblePeople,
  findSentinelaForWeek,
  formatFullDate,
  formatMinutes,
  formatShortDay,
  formatWeekRange,
  formatItemLabel,
  isSameDay,
  parseDateKey,
  parseTimeForClock,
  serializeProgram,
  slotLabel,
  startOfWeek,
  toDateKey,
  weekdayLabel,
  type ApostilaSemana,
  type CatalogItem,
  type Draft,
  type MeetingConfig,
  type MeetingRecord,
  type MeetingType,
  type MidweekRow,
  type MidweekSection,
  type Person,
  type PersonTalk,
  type SentinelaWeek,
  type Slot,
  type SpecialEvent,
  type SubOrg,
  type SubOrgPersonItem,
} from '@/lib/meeting-calendar';
import { useAuth } from '@/lib/auth-context';

const MEETING_TYPE_EMOJI: Record<MeetingType, string> = {
  midweek: '📅',
  weekend: '📆',
  memorial: '🕯️',
};

const MEETING_TYPE_COLOR: Record<MeetingType, string> = {
  midweek: '#2563EB',
  weekend: '#16A34A',
  memorial: '#D97706',
};

const EVENT_EMOJI: Record<string, string> = {
  memorial: '🕯️',
  specialTalk: '🎤',
  circuitVisit: '📍',
  convention: '🏛️',
  assemblyTraveling: '🚌',
  assemblyRepresentative: '🎙️',
  specialMeeting: '✨',
};

type FlatContent = {
  items: { id: string; data: Record<string, unknown> }[];
};

function toCatalog(
  contents: FlatContent[],
): CatalogItem[] {
  return (contents ?? [])
    .flatMap((c) => c.items ?? [])
    .map((item) => ({
      id: item.id,
      number: (item.data.number as number | null) ?? null,
      theme: (item.data.theme as string) ?? '',
    }));
}

export function MeetingsCalendar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { organizationRole } = useAuth();
  const canManage = organizationRole === 'owner' || organizationRole === 'admin';

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [cardTab, setCardTab] = useState<'midweek' | 'weekend'>('midweek');
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [apostilaWeeks, setApostilaWeeks] = useState<ApostilaSemana[]>([]);
  const [sentinelas, setSentinelas] = useState<SentinelaWeek[]>([]);
  const [subOrgs, setSubOrgs] = useState<SubOrg[]>([]);
  const [songs, setSongs] = useState<CatalogItem[]>([]);
  const [discursos, setDiscursos] = useState<CatalogItem[]>([]);
  const [personTalks, setPersonTalks] = useState<PersonTalk[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loadedWeek, setLoadedWeek] = useState<string | null>(null);
  const weekKey = toDateKey(weekStart);
  const loading = loadedWeek !== weekKey;
  const [orgName, setOrgName] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [configsRes, eventsRes, peopleRes, apostilaRes, sentinelaRes, subOrgsRes, songsRes, discursosRes, talksRes, meetingsRes] =
        await Promise.all([
          apiFetch('/api/meeting-configs'),
          apiFetch('/api/special-events'),
          apiFetch('/api/people'),
          apiFetch('/api/meeting-content?type=apostila&includeItems=1'),
          apiFetch('/api/meeting-content?type=sentinela&includeItems=1'),
          apiFetch('/api/sub-orgs?includePeople=1'),
          apiFetch('/api/meeting-content?type=canticos&includeItems=1'),
          apiFetch('/api/meeting-content?type=discursos&includeItems=1'),
          apiFetch('/api/person-talks'),
          apiFetch(`/api/meetings?weekStart=${toDateKey(weekStart)}`),
        ]);

      const [configsData, eventsData, peopleData, apostilaData, sentinelaData, subOrgsData, songsData, discursosData, talksData, meetingsData] =
        await Promise.all([
          configsRes.json(),
          eventsRes.json(),
          peopleRes.json(),
          apostilaRes.json(),
          sentinelaRes.json(),
          subOrgsRes.json(),
          songsRes.json(),
          discursosRes.json(),
          talksRes.json(),
          meetingsRes.json(),
        ]);

      setConfigs(configsData.configs ?? []);
      setEvents(eventsData.events ?? []);
      setPeople(peopleData.people ?? []);
      setOrgName(peopleData.organization?.name ?? peopleData.orgName ?? '');

      const weeks: ApostilaSemana[] = [];
      for (const c of (apostilaData.contents as FlatContent[]) ?? []) {
        for (const it of c.items ?? []) {
          const d = it.data as unknown as ApostilaSemana;
          if (typeof d.dateRange === 'string' && d.dateRange.length >= 17) {
            weeks.push({ ...d, id: it.id });
          }
        }
      }
      setApostilaWeeks(weeks);

      const sw: SentinelaWeek[] = [];
      for (const c of (sentinelaData.contents as FlatContent[]) ?? []) {
        for (const it of c.items ?? []) {
          const d = it.data as {
            week?: string;
            theme?: string;
            songs?: {
              opening?: { number?: number | null; title?: string };
              closing?: { number?: number | null; title?: string };
            };
          };
          if (!d.week || !d.theme) continue;
          sw.push({
            id: it.id,
            week: d.week,
            theme: d.theme,
            songs: {
              opening: {
                number: d.songs?.opening?.number ?? null,
                title: d.songs?.opening?.title ?? '',
              },
              closing: {
                number: d.songs?.closing?.number ?? null,
                title: d.songs?.closing?.title ?? '',
              },
            },
          });
        }
      }
      setSentinelas(sw);

      setSubOrgs(
        ((subOrgsData.subOrgs ?? []) as {
          id: string;
          name: string;
          people?: {
            id: string;
            name: string;
            talks?: { meetingContentItemId: string }[];
          }[];
        }[]).map((s) => ({
          id: s.id,
          name: s.name,
          people: (s.people ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            talks: (p.talks ?? []).map((tk) => tk.meetingContentItemId),
          })),
        })),
      );

      setSongs(toCatalog(songsData.contents ?? []));
      setDiscursos(toCatalog(discursosData.contents ?? []));
      setPersonTalks(
        ((talksData.talks ?? []) as { personId: string; meetingContentItemId: string }[]).map(
          (tk) => ({
            personId: tk.personId,
            meetingContentItemId: tk.meetingContentItemId,
          }),
        ),
      );
      setMeetings(meetingsData.meetings ?? []);
    } finally {
      setLoadedWeek(weekKey);
    }
  }, [weekStart, weekKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const derivation = useMemo(
    () => deriveWeek(weekStart, configs, events),
    [weekStart, configs, events],
  );

  const apostilaWeek = useMemo(() => {
    const key = `${weekStart.getFullYear()}${String(weekStart.getMonth() + 1).padStart(2, '0')}${String(weekStart.getDate()).padStart(2, '0')}`;
    return (
      apostilaWeeks.find((w) => {
        const start = w.dateRange.slice(0, 8);
        const end = w.dateRange.slice(9);
        return key >= start && key <= end;
      }) ?? null
    );
  }, [apostilaWeeks, weekStart]);

  const sentinela = useMemo(
    () => findSentinelaForWeek(sentinelas, weekStart),
    [sentinelas, weekStart],
  );

  const meetingsByType = useMemo(() => {
    const map = new Map<MeetingType, MeetingRecord>();
    for (const m of meetings) map.set(m.type, m);
    return map;
  }, [meetings]);

  const defaultConductorId = useMemo(
    () =>
      configs.find((c) => c.type === 'weekend')?.defaultSentinelaConductorId ??
      null,
    [configs],
  );

  const memorialMeeting = useMemo(
    () => derivation.meetings.find((m) => m.type === 'memorial') ?? null,
    [derivation.meetings],
  );
  const hasRegularMeetings = useMemo(
    () =>
      derivation.meetings.some(
        (m) => m.type === 'midweek' || m.type === 'weekend',
      ),
    [derivation.meetings],
  );
  const visibleMeetings = useMemo(
    () => derivation.meetings.filter((m) => m.type === cardTab),
    [derivation.meetings, cardTab],
  );
  const cardsToRender = useMemo(
    () => [...(memorialMeeting ? [memorialMeeting] : []), ...visibleMeetings],
    [memorialMeeting, visibleMeetings],
  );

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
    <ThemedView style={styles.container}>
      <ThemedView type="backgroundElement" style={[styles.weekNav, { borderColor: theme.border }]}>
        <View style={styles.weekNavRow}>
          <Pressable
            onPress={() => setWeekStart((w) => addDays(w, -7))}
            accessibilityLabel={t('meetings.prevWeek')}
            style={({ pressed }) => [styles.navBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          >
            <ThemedText type="smallBold">‹</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setWeekStart(startOfWeek(new Date()))}
            style={({ pressed }) => [styles.navBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          >
            <ThemedText type="small">{t('meetings.today')}</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setWeekStart((w) => addDays(w, 7))}
            accessibilityLabel={t('meetings.nextWeek')}
            style={({ pressed }) => [styles.navBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          >
            <ThemedText type="smallBold">›</ThemedText>
          </Pressable>
        </View>
        <ThemedText type="smallBold" style={styles.weekRange}>
          {t('meetings.weekOf')} {formatWeekRange(weekStart)}
        </ThemedText>
      </ThemedView>

      {loading ? (
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
          {t('common.loading')}
        </ThemedText>
      ) : (
        <>
          <ThemedView type="backgroundElement" style={[styles.weekGrid, { borderColor: theme.border }]}>
            <View style={styles.weekGridRow}>
              {days.map((day, i) => {
                const key = toDateKey(day);
                const dayEvents = eventsByDay.get(key) ?? [];
                const meeting = derivation.meetings.find((dm) => isSameDay(dm.date, day));
                const isToday = isSameDay(day, new Date());
                return (
                  <View
                    key={key}
                    style={[
                      styles.dayCell,
                      { borderColor: theme.border },
                      isToday && { backgroundColor: theme.backgroundSelected },
                    ]}
                  >
                    <ThemedText type="small" themeColor="textSecondary" style={styles.dayLabel}>
                      {weekdayLabel(i).slice(0, 3)}
                    </ThemedText>
                    <ThemedText type="smallBold" style={styles.dayNumber}>
                      {day.getDate().toString().padStart(2, '0')}
                    </ThemedText>
                    <View style={styles.dayMarks}>
                      {meeting && (
                        <ThemedText style={{ fontSize: 12 }}>
                          {MEETING_TYPE_EMOJI[meeting.type]}
                        </ThemedText>
                      )}
                      {dayEvents.map((ev) => (
                        <ThemedText key={ev.id} style={{ fontSize: 12 }}>
                          {EVENT_EMOJI[ev.type] ?? '📌'}
                        </ThemedText>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </ThemedView>

          {derivation.blocked ? (
            <LinearGradient
              colors={['#2563EB', '#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.blockedBanner}
            >
              <View style={styles.blockedHeader}>
                <View style={styles.blockedBadge}>
                  <ThemedText style={styles.blockedBadgeText}>🎉</ThemedText>
                </View>
                <View style={styles.blockedHeaderText}>
                  <ThemedText style={styles.blockedTitle}>
                    {t('meetings.blockedTitle')}
                  </ThemedText>
                  <ThemedText style={styles.blockedSubtitle}>
                    {t('meetings.blockedDescription')}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.blockedEvents}>
                {derivation.blockingEvents.map((ev) => (
                  <View key={ev.id} style={styles.blockedEventChip}>
                    <ThemedText style={styles.blockedEventEmoji}>
                      {EVENT_EMOJI[ev.type] ?? '🎉'}
                    </ThemedText>
                    <View style={styles.blockedEventInfo}>
                      <ThemedText style={styles.blockedEventName}>
                        {t(`settings.specialEventTypes.${ev.type}`)}
                      </ThemedText>
                      <ThemedText style={styles.blockedEventMeta}>
                        {formatFullDate(parseDateKey(ev.date))}
                        {ev.endDate
                          ? ` – ${formatFullDate(parseDateKey(ev.endDate))}`
                          : ''}
                        {ev.time ? ` · ${ev.time}` : ''}
                      </ThemedText>
                      {ev.location ? (
                        <ThemedText style={styles.blockedEventMeta}>
                          📍 {ev.location}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.meetingsList}>
              {derivation.meetings.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('meetings.noMeetingsHint')}
                </ThemedText>
              )}

              {hasRegularMeetings && (
                <View style={styles.cardTabRow}>
                  {(
                    [
                      { key: 'midweek', label: t('meetings.tabMidweek') },
                      { key: 'weekend', label: t('meetings.tabWeekend') },
                    ] as const
                  ).map((item) => (
                    <Pressable
                      key={item.key}
                      onPress={() => setCardTab(item.key)}
                      style={({ pressed }) => [
                        styles.cardTabBtn,
                        { backgroundColor: cardTab === item.key ? theme.primary : theme.backgroundSelected },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <ThemedText
                        style={{
                          color: cardTab === item.key ? theme.primaryForeground : theme.text,
                          fontWeight: '600',
                        }}
                      >
                        {item.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              {cardsToRender.map((dm) => (
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
                  sentinela={sentinela}
                  subOrgs={subOrgs}
                  orgName={orgName}
                  events={events}
                  defaultConductorId={defaultConductorId}
                  weekendConfigId={configs.find((c) => c.type === 'weekend')?.id ?? null}
                  onUpdated={(record) =>
                    setMeetings((prev) =>
                      prev.map((m) => (m.id === record.id ? record : m)),
                    )
                  }
                  onCreated={(record) =>
                    setMeetings((prev) => [
                      ...prev.filter((m) => m.type !== record.type),
                      record,
                    ])
                  }
                  onDeleted={(id) =>
                    setMeetings((prev) => prev.filter((m) => m.id !== id))
                  }
                />
              ))}
            </View>
          )}
        </>
      )}
    </ThemedView>
  );
}

type MeetingCardProps = {
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
  sentinela: SentinelaWeek | null;
  subOrgs: SubOrg[];
  orgName?: string;
  events: SpecialEvent[];
  defaultConductorId: string | null;
  weekendConfigId: string | null;
  onCreated: (record: MeetingRecord) => void;
  onUpdated: (record: MeetingRecord) => void;
  onDeleted: (id: string) => void;
};

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
  sentinela,
  subOrgs,
  orgName,
  events,
  defaultConductorId,
  weekendConfigId,
  onCreated,
  onUpdated,
  onDeleted,
}: MeetingCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const slots = useMemo(() => buildSlots(type, apostilaWeek), [type, apostilaWeek]);

  const defaultProgram = useMemo(
    () =>
      type === 'midweek'
        ? buildMidweekProgram(apostilaWeek, slots, (k) => t(k))
        : type === 'weekend'
          ? buildWeekendProgram(sentinela, slots, (k) => t(k))
          : null,
    [type, apostilaWeek, sentinela, slots, t],
  );

  const [program, setProgram] = useState<MidweekSection[] | null>(() => {
    if (type !== 'midweek' && type !== 'weekend') return null;
    const saved = record?.program ?? null;
    if (saved && Array.isArray(saved.sections) && saved.sections.length > 0) {
      return saved.sections;
    }
    return defaultProgram;
  });

  const buildDraftForSlot = useCallback(
    (slot: Slot): Draft[] => {
      const existing = record?.assignments.filter((a) => a.role === slot.role) ?? [];
      if (existing.length > 0) {
        return existing.map((a) => ({
          role: slot.role,
          sortOrder: slot.sortOrder,
          personId: a.personId,
          subOrgPersonId: a.subOrgPersonId,
          contentItemId: a.contentItemId,
          value: a.value ?? null,
        }));
      }
      const autoSong =
        slot.kind === 'song' && type === 'midweek'
          ? slot.role === 'canticoInicial'
            ? apostilaWeek?.canticoInicial
            : slot.role === 'canticoFinal'
              ? apostilaWeek?.canticoFinal
              : slot.role === 'cancionMedia'
                ? (apostilaWeek?.secoes.find((s) => s.cancionMedia != null)?.cancionMedia ?? null)
                : null
          : slot.kind === 'song' && type === 'weekend'
            ? slot.role === 'canticoMeio'
              ? (sentinela?.songs.opening?.number ?? null)
              : slot.role === 'canticoFinal'
                ? (sentinela?.songs.closing?.number ?? null)
                : null
            : null;
      const autoItem = autoSong ? (songs.find((s) => s.number === autoSong)?.id ?? null) : null;
      const defaultPerson = slot.role === 'condutorSentinela' ? defaultConductorId : null;
      return [
        {
          role: slot.role,
          sortOrder: slot.sortOrder,
          personId: defaultPerson,
          subOrgPersonId: null,
          contentItemId: autoItem,
          value: null,
        },
      ];
    },
    [record, type, apostilaWeek, songs, sentinela, defaultConductorId],
  );

  const [drafts, setDrafts] = useState<Draft[]>(() =>
    slots.flatMap((slot) => buildDraftForSlot(slot)),
  );

  const [prevSlots, setPrevSlots] = useState(slots);
  if (slots !== prevSlots) {
    setPrevSlots(slots);
    setDrafts((prev) => {
      const existingRoles = new Set(prev.map((d) => d.role));
      const toAdd = slots.flatMap((slot) =>
        existingRoles.has(slot.role) ? [] : buildDraftForSlot(slot),
      );
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  }

  const [prevProgram, setPrevProgram] = useState(program);
  if (program !== prevProgram) {
    setPrevProgram(program);
    setDrafts((prev) => {
      if (type !== 'midweek' && type !== 'weekend') return prev;
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
              subOrgPersonId: saved?.subOrgPersonId ?? null,
              contentItemId: saved?.contentItemId ?? null,
              value: saved?.value ?? null,
            });
            existingRoles.add(row.role);
          }
          if (row.secondary?.role && !existingRoles.has(row.secondary.role)) {
            const saved = record?.assignments.find((a) => a.role === row.secondary?.role);
            toAdd.push({
              role: row.secondary.role,
              sortOrder: 100,
              personId: saved?.personId ?? null,
              subOrgPersonId: saved?.subOrgPersonId ?? null,
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
  }

  const slotByRole = useMemo(() => new Map(slots.map((s) => [s.role, s])), [slots]);

  const getPerson = useCallback(
    (personId: string | null) => (personId ? (people.find((p) => p.id === personId) ?? null) : null),
    [people],
  );

  const getItem = useCallback(
    (itemId: string | null, kind: 'song' | 'discurso') => {
      if (!itemId) return null;
      const list = kind === 'song' ? songs : discursos;
      return list.find((i) => i.id === itemId) ?? null;
    },
    [songs, discursos],
  );

  const getSubOrgPerson = useCallback(
    (subOrgPersonId: string | null) => {
      if (!subOrgPersonId) return null;
      for (const so of subOrgs) {
        const found = so.people.find((p) => p.id === subOrgPersonId);
        if (found) return { ...found, subOrgName: so.name };
      }
      return null;
    },
    [subOrgs],
  );

  const setPerson = useCallback(
    (role: string, personId: string | null) => {
      setDrafts((prev) => {
        let next = prev.map((d) => (d.role === role ? { ...d, personId } : d));
        if (personId) {
          for (const s of slotByRole.values()) {
            if (s.conflictsWith === role) {
              next = next.map((d) =>
                d.role === s.role && d.personId === personId ? { ...d, personId: null } : d,
              );
            }
          }
        }
        return next;
      });
    },
    [slotByRole],
  );

  const setSubOrgPerson = useCallback((role: string, subOrgPersonId: string | null) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.role === role
          ? { ...d, subOrgPersonId, personId: subOrgPersonId ? null : d.personId }
          : d,
      ),
    );
  }, []);

  const setItem = useCallback((role: string, contentItemId: string | null) => {
    setDrafts((prev) => prev.map((d) => (d.role === role ? { ...d, contentItemId } : d)));
  }, []);

  const setValue = useCallback((role: string, value: string) => {
    setDrafts((prev) => prev.map((d) => (d.role === role ? { ...d, value } : d)));
  }, []);

  const addPerson = useCallback((role: string, personId: string) => {
    setDrafts((prev) => {
      const exists = prev.some((d) => d.role === role && d.personId === personId);
      if (exists) return prev;
      return [
        ...prev,
        { role, sortOrder: 0, personId, subOrgPersonId: null, contentItemId: null, value: null },
      ];
    });
  }, []);

  const removePerson = useCallback((role: string, personId: string) => {
    setDrafts((prev) => prev.filter((d) => !(d.role === role && d.personId === personId)));
  }, []);

  const setRowTempo = useCallback(
    (sectionKey: string, rowKey: string, tempoMin: number) => {
      setProgram(
        (prev) =>
          prev?.map((sec) => {
            if (sec.key !== sectionKey) return sec;
            const si = Number(sec.key.replace('secao-', ''));
            const kind = Number.isFinite(si)
              ? (apostilaWeek?.secoes[si]?.secao ?? '')
              : '';
            const add = Math.max(0, tempoMin);
            const clockAdd = /minist|maestros|mestres/i.test(kind) ? add + 1 : add;
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

  const setRowTitle = useCallback((sectionKey: string, rowKey: string, title: string) => {
    setProgram(
      (prev) =>
        prev?.map((sec) =>
          sec.key === sectionKey
            ? { ...sec, rows: sec.rows.map((r) => (r.key === rowKey ? { ...r, title } : r)) }
            : sec,
        ) ?? prev,
    );
  }, []);

  const addRow = useCallback(
    (sectionKey: string) => {
      const role = `custom:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`;
      const si = Number(sectionKey.replace('secao-', ''));
      const kind = Number.isFinite(si) ? (apostilaWeek?.secoes[si]?.secao ?? '') : '';
      const clockAdd = /minist|maestros|mestres/i.test(kind) ? 6 : 5;
      const row: MidweekRow = {
        key: role,
        kind: 'person',
        title: '',
        tempoMin: 5,
        clockAdd,
        role,
        eligibility: 'any',
      };
      setProgram(
        (prev) =>
          prev?.map((sec) =>
            sec.key === sectionKey ? { ...sec, rows: [...sec.rows, row] } : sec,
          ) ?? prev,
      );
      setDrafts((prev) => [
        ...prev,
        { role, sortOrder: 100, personId: null, subOrgPersonId: null, contentItemId: null, value: null },
      ]);
    },
    [apostilaWeek],
  );

  const removeRow = useCallback(
    (sectionKey: string, rowKey: string) => {
      const row = program?.find((s) => s.key === sectionKey)?.rows.find((r) => r.key === rowKey);
      setProgram(
        (prev) =>
          prev?.map((sec) =>
            sec.key === sectionKey
              ? { ...sec, rows: sec.rows.filter((r) => r.key !== rowKey) }
              : sec,
          ) ?? prev,
      );
      if (row) {
        setDrafts((prev) => prev.filter((d) => d.role !== row.role && d.role !== row.secondary?.role));
      }
    },
    [program],
  );

  const handleCancel = useCallback(() => {
    setEditing(false);
    setProgram(
      record?.program?.sections?.length ? record.program.sections : (defaultProgram ?? []),
    );
    setDrafts(slots.flatMap((slot) => buildDraftForSlot(slot)));
  }, [record, defaultProgram, slots, buildDraftForSlot]);

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/meetings/${record.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignments: drafts
            .filter(
              (d) =>
                d.personId ||
                d.subOrgPersonId ||
                d.contentItemId ||
                (d.value !== null && d.value !== ''),
            )
            .map((d) => ({
              role: d.role,
              sortOrder: d.sortOrder,
              personId: d.personId,
              subOrgPersonId: d.subOrgPersonId,
              contentItemId: d.contentItemId,
              value: d.value,
            })),
          ...(program?.length ? { program: serializeProgram(program) } : {}),
        }),
      });
      if (!res.ok) {
        Alert.alert(t('common.error'), t('meetings.saveError'));
        return;
      }
      const data = await res.json();
      onUpdated(data.meeting);
      setEditing(false);
      Alert.alert(t('meetings.saved'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({ type, weekStart: toDateKey(startOfWeek(date)) }),
      });
      if (!res.ok) {
        Alert.alert(t('common.error'), t('meetings.createError'));
        return;
      }
      const data = await res.json();
      onCreated(data.meeting);
      setEditing(true);
      Alert.alert(t('meetings.created'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    Alert.alert(t('meetings.deleteConfirmTitle'), t('meetings.deleteConfirmDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const res = await apiFetch(`/api/meetings/${record.id}`, { method: 'DELETE' });
          if (!res.ok) {
            Alert.alert(t('common.error'), t('meetings.deleteError'));
            return;
          }
          onDeleted(record.id);
          Alert.alert(t('meetings.deleted'));
        },
      },
    ]);
  };

  const editable = canManage && editing;

  const cardEvents = useMemo(() => {
    const weekStart = startOfWeek(date);
    const weekEnd = addDays(weekStart, 6);
    return events
      .filter((ev) => ev.type !== 'memorial')
      .filter((ev) => {
        const s = parseDateKey(ev.date);
        const e = ev.endDate ? parseDateKey(ev.endDate) : s;
        return e >= weekStart && s <= weekEnd;
      });
  }, [date, events]);

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <ThemedText type="smallBold" style={{ color: MEETING_TYPE_COLOR[type] }}>
            {MEETING_TYPE_EMOJI[type]} {t(`meetings.types.${type}`)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatFullDate(date)}
            {time ? ` · ${time}` : ''}
          </ThemedText>
          {type === 'midweek' && apostilaWeek && (
            <ThemedText type="small" themeColor="textSecondary">
              {t('meetings.apostilaWeek')}: {apostilaWeek.semana}
            </ThemedText>
          )}
        </View>
        {canManage && record && (
          <View style={styles.cardActions}>
            {!editing && (
              <Pressable
                onPress={() => setEditing(true)}
                style={({ pressed }) => [styles.smallBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
              >
                <ThemedText type="small" style={{ color: theme.primary }}>
                  {t('meetings.edit')}
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.smallBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
            >
              <ThemedText type="small" style={{ color: theme.danger }}>
                {t('common.delete')}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      {cardEvents.length > 0 && (
        <View style={styles.eventChips}>
          {cardEvents.map((ev) => (
            <ThemedView
              key={ev.id}
              type="backgroundElement"
              style={[styles.eventChip, { borderColor: theme.border }]}
            >
              <ThemedText style={{ fontSize: 12 }}>
                {EVENT_EMOJI[ev.type] ?? '📌'} {t(`settings.specialEventTypes.${ev.type}`)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatShortDay(parseDateKey(ev.date))}
                {ev.endDate ? ` – ${formatShortDay(parseDateKey(ev.endDate))}` : ''}
              </ThemedText>
            </ThemedView>
          ))}
        </View>
      )}

      {!record ? (
        canManage ? (
          <Pressable
            onPress={handleCreate}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.8 },
              saving && { opacity: 0.5 },
            ]}
          >
            <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
              {saving ? t('meetings.creating') : t('meetings.createMeeting')}
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {t('meetings.notCreated')}
          </ThemedText>
        )
      ) : type === 'midweek' || type === 'weekend' ? (
        <ProgramView
          sections={program}
          drafts={drafts}
          editable={editable}
          time={time}
          people={people}
          songs={songs}
          discursos={discursos}
          subOrgs={subOrgs}
          orgName={orgName}
          personTalks={personTalks}
          getPerson={getPerson}
          getSubOrgPerson={getSubOrgPerson}
          getItem={getItem}
          setPerson={setPerson}
          setSubOrgPerson={setSubOrgPerson}
          setItem={setItem}
          setValue={setValue}
          setRowTempo={setRowTempo}
          setRowTitle={setRowTitle}
          addRow={addRow}
          removeRow={removeRow}
        />
      ) : (
        <MemorialSlots
          slots={slots}
          drafts={drafts}
          editable={editable}
          people={people}
          songs={songs}
          subOrgs={subOrgs}
          orgName={orgName}
          apostilaWeek={apostilaWeek}
          getPerson={getPerson}
          getSubOrgPerson={getSubOrgPerson}
          getItem={getItem}
          setPerson={setPerson}
          setSubOrgPerson={setSubOrgPerson}
          setItem={setItem}
          setValue={setValue}
          addPerson={addPerson}
          removePerson={removePerson}
        />
      )}

      {editable && (
        <View style={styles.saveRow}>
          <Pressable
            onPress={handleCancel}
            disabled={saving}
            style={({ pressed }) => [styles.outlineBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          >
            <ThemedText type="small">{t('common.cancel')}</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.8 },
              saving && { opacity: 0.5 },
            ]}
          >
            <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
              {saving ? t('meetings.saving') : t('meetings.save')}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

type ProgramViewProps = {
  sections: MidweekSection[] | null;
  drafts: Draft[];
  editable: boolean;
  time: string;
  people: Person[];
  songs: CatalogItem[];
  discursos: CatalogItem[];
  subOrgs: SubOrg[];
  orgName?: string;
  personTalks: PersonTalk[];
  getPerson: (id: string | null) => Person | null;
  getSubOrgPerson: (id: string | null) => (SubOrgPersonItem & { subOrgName: string }) | null;
  getItem: (id: string | null, kind: 'song' | 'discurso') => CatalogItem | null;
  setPerson: (role: string, personId: string | null) => void;
  setSubOrgPerson: (role: string, subOrgPersonId: string | null) => void;
  setItem: (role: string, contentItemId: string | null) => void;
  setValue: (role: string, value: string) => void;
  setRowTempo: (sectionKey: string, rowKey: string, tempoMin: number) => void;
  setRowTitle: (sectionKey: string, rowKey: string, title: string) => void;
  addRow: (sectionKey: string) => void;
  removeRow: (sectionKey: string, rowKey: string) => void;
};

function ProgramView({
  sections,
  drafts,
  editable,
  time,
  people,
  songs,
  discursos,
  subOrgs,
  orgName,
  personTalks,
  getPerson,
  getSubOrgPerson,
  getItem,
  setPerson,
  setSubOrgPerson,
  setItem,
  setValue,
  setRowTempo,
  setRowTitle,
  addRow,
  removeRow,
}: ProgramViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  let clock = parseTimeForClock(time || '19:00');

  return (
    <ThemedView type="backgroundElement" style={[styles.programBox, { borderColor: theme.border }]}>
      {sections?.map((section) => (
        <View key={section.key}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { backgroundColor: theme.backgroundSelected }]}>
            {section.title}
          </ThemedText>
          {section.rows.map((row) => {
            const timeLabel = formatMinutes(clock);
            clock += row.clockAdd ?? row.tempoMin;
            const primaryDraft = drafts.find((d) => d.role === row.role);
            return (
              <View key={row.key} style={[styles.programRow, { borderColor: theme.border }]}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.timeCell}>
                  {timeLabel}
                </ThemedText>
                <View style={styles.descCell}>
                  {row.kind === 'discurso' ? (
                    <ThemedText type="small">
                      {getItem(primaryDraft?.contentItemId ?? null, 'discurso')?.theme ??
                        t('meetings.pdf.publicTalk')}
                    </ThemedText>
                  ) : (
                    <ThemedText type="small">{row.title}</ThemedText>
                  )}
                  {!editable && row.tempoMin > 0 && (
                    <ThemedText type="small" themeColor="textSecondary">
                      · {row.tempoMin} min
                    </ThemedText>
                  )}
                </View>
                <View style={styles.assignedCell}>
                  {row.kind === 'static' ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      —
                    </ThemedText>
                  ) : (
                    <CellControl
                      row={row}
                      which="primary"
                      drafts={drafts}
                      editable={editable}
                      people={people}
                      songs={songs}
                      discursos={discursos}
                      subOrgs={subOrgs}
                      orgName={orgName}
                      personTalks={personTalks}
                      getPerson={getPerson}
                      getSubOrgPerson={getSubOrgPerson}
                      getItem={getItem}
                      setPerson={setPerson}
                      setSubOrgPerson={setSubOrgPerson}
                      setItem={setItem}
                      setValue={setValue}
                    />
                  )}
                </View>
                {row.secondary && (
                  <View style={styles.assignedCell}>
                    <CellControl
                      row={row}
                      which="secondary"
                      drafts={drafts}
                      editable={editable}
                      people={people}
                      songs={songs}
                      discursos={discursos}
                      subOrgs={subOrgs}
                      orgName={orgName}
                      personTalks={personTalks}
                      getPerson={getPerson}
                      getSubOrgPerson={getSubOrgPerson}
                      getItem={getItem}
                      setPerson={setPerson}
                      setSubOrgPerson={setSubOrgPerson}
                      setItem={setItem}
                      setValue={setValue}
                    />
                  </View>
                )}
                {editable && !row.fixed && (
                  <Pressable
                    onPress={() => removeRow(section.key, row.key)}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}
                  >
                    <ThemedText type="small" style={{ color: theme.danger }}>
                      ✕
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            );
          })}
          {editable && section.key !== 'introducao' && section.key !== 'conclusao' && (
            <Pressable
              onPress={() => addRow(section.key)}
              style={({ pressed }) => [styles.addRowBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
            >
              <ThemedText type="small" style={{ color: theme.primary }}>
                + {t('meetings.addPart')}
              </ThemedText>
            </Pressable>
          )}
        </View>
      ))}
    </ThemedView>
  );
}

type CellControlProps = {
  row: MidweekRow;
  which: 'primary' | 'secondary';
  drafts: Draft[];
  editable: boolean;
  people: Person[];
  songs: CatalogItem[];
  discursos: CatalogItem[];
  subOrgs: SubOrg[];
  orgName?: string;
  personTalks: PersonTalk[];
  getPerson: (id: string | null) => Person | null;
  getSubOrgPerson: (id: string | null) => (SubOrgPersonItem & { subOrgName: string }) | null;
  getItem: (id: string | null, kind: 'song' | 'discurso') => CatalogItem | null;
  setPerson: (role: string, personId: string | null) => void;
  setSubOrgPerson: (role: string, subOrgPersonId: string | null) => void;
  setItem: (role: string, contentItemId: string | null) => void;
  setValue: (role: string, value: string) => void;
};

function CellControl({
  row,
  which,
  drafts,
  editable,
  people,
  songs,
  discursos,
  subOrgs,
  orgName,
  personTalks,
  getPerson,
  getSubOrgPerson,
  getItem,
  setPerson,
  setSubOrgPerson,
  setItem,
  setValue,
}: CellControlProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSecondary = which === 'secondary';
  const role = isSecondary ? (row.secondary?.role ?? '') : row.role;
  const draft = drafts.find((d) => d.role === role);
  const [picker, setPicker] = useState<null | 'person' | 'song' | 'discurso' | 'orador'>(null);

  const person = getPerson(draft?.personId ?? null);
  const subOrgPerson = getSubOrgPerson(draft?.subOrgPersonId ?? null);

  const oradorMainOptions = useMemo(() => {
    const pool = people.filter((p) => p.active && p.discursoPublico);
    const selectedDiscursoId = drafts.find((d) => d.role === role)?.contentItemId ?? null;
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
  }, [people, personTalks, drafts, role]);

  if (row.kind === 'song') {
    const item = getItem(draft?.contentItemId ?? null, 'song');
    if (!editable) {
      return (
        <ThemedText type="small" themeColor="textSecondary" style={styles.assignedText}>
          {formatItemLabel(item)}
        </ThemedText>
      );
    }
    const options: PickerOption<string>[] = songs.map((s) => ({
      value: s.id,
      label: s.number != null ? `${s.number}. ${s.theme}` : s.theme,
    }));
    return (
      <>
        <Pressable
          onPress={() => setPicker('song')}
          style={({ pressed }) => [styles.pickerBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
        >
          <ThemedText type="small" numberOfLines={1}>
            {formatItemLabel(item)}
          </ThemedText>
        </Pressable>
        <OptionPicker
          visible={picker === 'song'}
          title={t('meetings.selectSong')}
          options={options}
          selected={draft?.contentItemId ?? null}
          onSelect={(v) => setItem(role, v)}
          onClose={() => setPicker(null)}
          placeholder={t('meetings.selectSong')}
        />
      </>
    );
  }

  if (row.kind === 'discurso') {
    if (isSecondary) {
      return (
        <OradorSelect
          role={role}
          draft={draft}
          editable={editable}
          subOrgs={subOrgs}
          orgName={orgName}
          mainOptions={oradorMainOptions}
          getPerson={getPerson}
          getSubOrgPerson={getSubOrgPerson}
          setPerson={setPerson}
          setSubOrgPerson={setSubOrgPerson}
        />
      );
    }
    if (editable) {
      const options: PickerOption<string>[] = discursos.map((d) => ({
        value: d.id,
        label: d.number != null ? `${d.number}. ${d.theme}` : d.theme,
      }));
      return (
        <>
          <Pressable
            onPress={() => setPicker('discurso')}
            style={({ pressed }) => [styles.pickerBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          >
            <ThemedText type="small" numberOfLines={1}>
              {getItem(draft?.contentItemId ?? null, 'discurso')?.theme ?? t('meetings.selectDiscurso')}
            </ThemedText>
          </Pressable>
          <OptionPicker
            visible={picker === 'discurso'}
            title={t('meetings.selectDiscurso')}
            options={options}
            selected={draft?.contentItemId ?? null}
            onSelect={(v) => {
              setItem(role, v);
              if (v) {
                const oradorRole = row.secondary?.role ?? '';
                setPerson(oradorRole, null);
                setSubOrgPerson(oradorRole, null);
              }
            }}
            onClose={() => setPicker(null)}
            placeholder={t('meetings.selectDiscurso')}
          />
        </>
      );
    }
    return <ThemedText type="small" themeColor="textSecondary" style={styles.assignedText}>—</ThemedText>;
  }

  // person / personDual / presidente / orador
  if (!editable) {
    if (isSecondary && row.secondary?.role === 'orador') {
      const display = subOrgPerson
        ? `${subOrgPerson.name} (${subOrgPerson.subOrgName})`
        : person
          ? `${person.name}${orgName ? ` (${orgName})` : ''}`
          : '—';
      return <ThemedText type="small" themeColor="textSecondary" style={styles.assignedText}>{display}</ThemedText>;
    }
    const display = subOrgPerson
      ? `${subOrgPerson.name} (${subOrgPerson.subOrgName})`
      : (person?.name ?? (isSecondary ? '—' : t('meetings.naoDesignado')));
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.assignedText}>
        {display}
      </ThemedText>
    );
  }

  const eligible = eligiblePeople(
    { role, labelKey: row.secondary?.label ?? '', kind: 'person', sortOrder: 0, eligibility: row.eligibility, dualOf: row.dualOf },
    people,
    drafts,
  );

  const options: PickerOption<string>[] = eligible.map((p) => ({
    value: `person:${p.id}`,
    label: p.name,
  }));

  return (
    <>
      {isSecondary && row.secondary?.label && (
        <ThemedText type="small" themeColor="textSecondary">
          {row.secondary.label}
        </ThemedText>
      )}
      <Pressable
        onPress={() => setPicker('person')}
        style={({ pressed }) => [styles.pickerBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
      >
        <ThemedText type="small" numberOfLines={1}>
          {subOrgPerson
            ? `${subOrgPerson.name} (${subOrgPerson.subOrgName})`
            : person?.name ?? t('meetings.selectPerson')}
        </ThemedText>
      </Pressable>
      <OptionPicker
        visible={picker === 'person'}
        title={t('meetings.selectPerson')}
        options={options}
        selected={draft?.personId ? `person:${draft.personId}` : null}
        onSelect={(v) => {
          if (v) setPerson(role, v.slice(7));
          else setPerson(role, null);
        }}
        onClose={() => setPicker(null)}
        placeholder={t('meetings.selectPerson')}
      />
    </>
  );
}

type OradorSelectProps = {
  role: string;
  draft: Draft | undefined;
  editable: boolean;
  subOrgs: SubOrg[];
  orgName?: string;
  mainOptions: Person[];
  getPerson: (id: string | null) => Person | null;
  getSubOrgPerson: (id: string | null) => (SubOrgPersonItem & { subOrgName: string }) | null;
  setPerson: (role: string, personId: string | null) => void;
  setSubOrgPerson: (role: string, subOrgPersonId: string | null) => void;
};

function OradorSelect({
  role,
  draft,
  editable,
  subOrgs,
  orgName,
  mainOptions,
  getPerson,
  getSubOrgPerson,
  setPerson,
  setSubOrgPerson,
}: OradorSelectProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const person = getPerson(draft?.personId ?? null);
  const subOrgPerson = getSubOrgPerson(draft?.subOrgPersonId ?? null);

  if (!editable) {
    const display = subOrgPerson
      ? `${subOrgPerson.name} (${subOrgPerson.subOrgName})`
      : person
        ? `${person.name}${orgName ? ` (${orgName})` : ''}`
        : '—';
    return <ThemedText type="small" themeColor="textSecondary" style={styles.assignedText}>{display}</ThemedText>;
  }

  const options: PickerOption<string>[] = [
    ...mainOptions.map((p) => ({ value: `person:${p.id}`, label: p.name, group: orgName ?? undefined })),
    ...subOrgs
      .filter((so) => so.people.length > 0)
      .flatMap((so) =>
        so.people.map((p) => ({ value: `sub:${p.id}`, label: p.name, group: so.name })),
      ),
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.pickerBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
      >
        <ThemedText type="small" numberOfLines={1}>
          {subOrgPerson
            ? `${subOrgPerson.name} (${subOrgPerson.subOrgName})`
            : person
              ? `${person.name}${orgName ? ` (${orgName})` : ''}`
              : t('meetings.selectPerson')}
        </ThemedText>
      </Pressable>
      <OptionPicker
        visible={open}
        title={t('meetings.roles.orador')}
        options={options}
        selected={
          draft?.subOrgPersonId
            ? `sub:${draft.subOrgPersonId}`
            : draft?.personId
              ? `person:${draft.personId}`
              : null
        }
        onSelect={(v) => {
          if (!v) {
            setPerson(role, null);
            setSubOrgPerson(role, null);
          } else if (v.startsWith('sub:')) {
            setSubOrgPerson(role, v.slice(4));
          } else {
            setPerson(role, v.slice(7));
          }
        }}
        onClose={() => setOpen(false)}
        placeholder={t('meetings.selectPerson')}
      />
    </>
  );
}

type MemorialSlotsProps = {
  slots: Slot[];
  drafts: Draft[];
  editable: boolean;
  people: Person[];
  songs: CatalogItem[];
  subOrgs: SubOrg[];
  orgName?: string;
  apostilaWeek: ApostilaSemana | null;
  getPerson: (id: string | null) => Person | null;
  getSubOrgPerson: (id: string | null) => (SubOrgPersonItem & { subOrgName: string }) | null;
  getItem: (id: string | null, kind: 'song' | 'discurso') => CatalogItem | null;
  setPerson: (role: string, personId: string | null) => void;
  setSubOrgPerson: (role: string, subOrgPersonId: string | null) => void;
  setItem: (role: string, contentItemId: string | null) => void;
  setValue: (role: string, value: string) => void;
  addPerson: (role: string, personId: string) => void;
  removePerson: (role: string, personId: string) => void;
};

function MemorialSlots({
  slots,
  drafts,
  editable,
  people,
  songs,
  subOrgs,
  orgName,
  apostilaWeek,
  getPerson,
  getSubOrgPerson,
  getItem,
  setPerson,
  setSubOrgPerson,
  setItem,
  setValue,
  addPerson,
  removePerson,
}: MemorialSlotsProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.slotsList}>
      {slots.map((slot) => {
        const slotDrafts = drafts.filter((d) => d.role === slot.role);
        const label = slotLabel(slot, apostilaWeek, (k) => t(k));

        if (slot.kind === 'text') {
          const value = slotDrafts[0]?.value ?? '';
          return (
            <View key={slot.role} style={styles.slotBlock}>
              <ThemedText type="smallBold">{label}</ThemedText>
              {editable ? (
                <TextInput
                  value={value}
                  onChangeText={(v) => setValue(slot.role, v)}
                  style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">{value || '—'}</ThemedText>
              )}
            </View>
          );
        }

        if (slot.kind === 'song') {
          const value = slotDrafts[0]?.contentItemId ?? null;
          const item = getItem(value, 'song');
          return (
            <View key={slot.role} style={styles.slotBlock}>
              <ThemedText type="smallBold">{label}</ThemedText>
              {editable ? (
                <SongPicker
                  value={value}
                  songs={songs}
                  onSelect={(v) => setItem(slot.role, v)}
                />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {formatItemLabel(item)}
                </ThemedText>
              )}
            </View>
          );
        }

        if (slot.kind === 'discurso') {
          const value = slotDrafts[0]?.contentItemId ?? null;
          const manualTitle = slotDrafts[0]?.value ?? '';
          const item = getItem(value, 'discurso');
          const displayed = manualTitle || (item ? `${item.number != null ? `${item.number}. ` : ''}${item.theme}` : '—');
          return (
            <View key={slot.role} style={styles.slotBlock}>
              <ThemedText type="smallBold">{label}</ThemedText>
              {editable ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {displayed}
                </ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">{displayed}</ThemedText>
              )}
            </View>
          );
        }

        if (slot.kind === 'orador') {
          return (
            <View key={slot.role} style={styles.slotBlock}>
              <ThemedText type="smallBold">{label}</ThemedText>
              <OradorSelect
                role={slot.role}
                draft={slotDrafts[0]}
                editable={editable}
                subOrgs={subOrgs}
                orgName={orgName}
                mainOptions={people.filter((p) => p.active && p.discursoPublico)}
                getPerson={getPerson}
                getSubOrgPerson={getSubOrgPerson}
                setPerson={setPerson}
                setSubOrgPerson={setSubOrgPerson}
              />
            </View>
          );
        }

        if (slot.kind === 'person' || slot.kind === 'personDual') {
          const value = slotDrafts[0]?.personId ?? null;
          const person = getPerson(value);
          return (
            <View key={slot.role} style={styles.slotBlock}>
              <ThemedText type="smallBold">{label}</ThemedText>
              {editable ? (
                <PersonPicker
                  role={slot.role}
                  value={value}
                  slot={slot}
                  people={people}
                  drafts={drafts}
                  onSelect={setPerson}
                />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {person?.name ?? '—'}
                </ThemedText>
              )}
            </View>
          );
        }

        return (
          <View key={slot.role} style={styles.slotBlock}>
            <ThemedText type="smallBold">{label}</ThemedText>
            {slotDrafts.length > 0 ? (
              slotDrafts.map((d) => {
                const p = getPerson(d.personId);
                if (!p) return null;
                return (
                  <View key={d.personId} style={styles.multiChip}>
                    <ThemedText type="small">{p.name}</ThemedText>
                    {editable && (
                      <Pressable onPress={() => d.personId && removePerson(slot.role, d.personId)}>
                        <ThemedText type="small" style={{ color: theme.danger }}> ✕</ThemedText>
                      </Pressable>
                    )}
                  </View>
                );
              })
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {t('meetings.noAssignments')}
              </ThemedText>
            )}
            {editable && (
              <MultiAddPicker
                role={slot.role}
                slot={slot}
                people={people}
                drafts={drafts}
                onAdd={addPerson}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function SongPicker({
  value,
  songs,
  onSelect,
}: {
  value: string | null;
  songs: CatalogItem[];
  onSelect: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const options: PickerOption<string>[] = songs.map((s) => ({
    value: s.id,
    label: s.number != null ? `${s.number}. ${s.theme}` : s.theme,
  }));
  const current = songs.find((s) => s.id === value);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <ThemedText type="small" style={{ color: '#2563EB' }}>
          {current ? (current.number != null ? `${current.number}. ${current.theme}` : current.theme) : t('meetings.selectSong')}
        </ThemedText>
      </Pressable>
      <OptionPicker
        visible={open}
        title={t('meetings.selectSong')}
        options={options}
        selected={value}
        onSelect={onSelect}
        onClose={() => setOpen(false)}
        placeholder={t('meetings.selectSong')}
      />
    </>
  );
}

function PersonPicker({
  role,
  value,
  slot,
  people,
  drafts,
  onSelect,
}: {
  role: string;
  value: string | null;
  slot: Slot;
  people: Person[];
  drafts: Draft[];
  onSelect: (role: string, personId: string | null) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const eligible = eligiblePeople(slot, people, drafts);
  const options: PickerOption<string>[] = eligible.map((p) => ({ value: p.id, label: p.name }));
  const current = people.find((p) => p.id === value);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <ThemedText type="small" style={{ color: '#2563EB' }}>
          {current?.name ?? t('meetings.selectPerson')}
        </ThemedText>
      </Pressable>
      <OptionPicker
        visible={open}
        title={t('meetings.selectPerson')}
        options={options}
        selected={value}
        onSelect={(v) => onSelect(role, v)}
        onClose={() => setOpen(false)}
        placeholder={t('meetings.selectPerson')}
      />
    </>
  );
}

function MultiAddPicker({
  role,
  slot,
  people,
  drafts,
  onAdd,
}: {
  role: string;
  slot: Slot;
  people: Person[];
  drafts: Draft[];
  onAdd: (role: string, personId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectedIds = new Set(drafts.filter((d) => d.role === role).map((d) => d.personId).filter(Boolean));
  const eligible = eligiblePeople(slot, people, drafts).filter((p) => !selectedIds.has(p.id));
  const options: PickerOption<string>[] = eligible.map((p) => ({ value: p.id, label: p.name }));
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <ThemedText type="small" style={{ color: '#2563EB' }}>
          + {t('meetings.addPerson')}
        </ThemedText>
      </Pressable>
      <OptionPicker
        visible={open}
        title={t('meetings.addPerson')}
        options={options}
        selected={null}
        onSelect={(v) => {
          if (v) onAdd(role, v);
        }}
        onClose={() => setOpen(false)}
        placeholder={t('meetings.addPerson')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 800,
  },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  weekNav: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  weekNavRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  navBtn: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  weekRange: { textAlign: 'center' },
  weekGrid: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  weekGridRow: {
    flexDirection: 'row',
    gap: Spacing.half,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.half,
  },
  dayLabel: { fontSize: 11 },
  dayNumber: { fontSize: 13 },
  dayMarks: { minHeight: 16, alignItems: 'center' },
  blockedBanner: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  blockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  blockedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedBadgeText: { fontSize: 24 },
  blockedHeaderText: { flex: 1 },
  blockedTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  blockedSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  blockedEvents: { gap: Spacing.two },
  blockedEventChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  blockedEventEmoji: { fontSize: 18, marginTop: 1 },
  blockedEventInfo: { flex: 1 },
  blockedEventName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  blockedEventMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 1,
  },
  meetingsList: { gap: Spacing.three },
  cardTabRow: { flexDirection: 'row', gap: Spacing.one },
  cardTabBtn: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
  card: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardHeaderLeft: { flex: 1, minWidth: 0, gap: Spacing.half },
  cardActions: { flexDirection: 'row', gap: Spacing.two, flexShrink: 0 },
  smallBtn: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  eventChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  eventChip: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  programBox: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeCell: { width: 40 },
  descCell: { flex: 1, minWidth: 0 },
  assignedCell: { flexShrink: 1, maxWidth: '45%', gap: Spacing.half },
  assignedText: { textAlign: 'right' },
  pickerBtn: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  addRowBtn: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  slotsList: { gap: Spacing.three },
  slotBlock: { gap: Spacing.one },
  multiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    alignSelf: 'flex-start',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
  },
});

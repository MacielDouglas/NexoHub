import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  ANNUAL_EVENT_TYPES,
  SPECIAL_EVENT_FIELDS,
  SPECIAL_EVENT_TYPES,
  type SpecialEventType,
} from "@/lib/special-events";

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

type SpecialEventFormValues = {
  type: SpecialEventType;
  date: string;
  endDate: string;
  time: string;
  location: string;
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const MEETING_TYPES = ["midweek", "weekend"] as const;

const EMPTY_EVENT_FORM: SpecialEventFormValues = {
  type: "memorial",
  date: "",
  endDate: "",
  time: "",
  location: "",
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function apiFetch(path: string, options: RequestInit = {}) {
  const cookies = await SecureStore.getItemAsync("nexohub_session");
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
      ...(options.headers as Record<string, string>),
    },
    credentials: "include",
  });
}

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom },
    web: { paddingTop: Spacing.six, paddingBottom: Spacing.four },
  });

  async function fetchAll() {
    const [configRes, eventRes] = await Promise.all([
      apiFetch("/api/meeting-configs"),
      apiFetch("/api/special-events"),
    ]);
    if (configRes.ok) {
      const data = await configRes.json();
      if (data.configs) setConfigs(data.configs);
    }
    if (eventRes.ok) {
      const data = await eventRes.json();
      if (data.events) setEvents(data.events);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [configRes, eventRes] = await Promise.all([
        apiFetch("/api/meeting-configs"),
        apiFetch("/api/special-events"),
      ]);
      if (cancelled) return;
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.configs) setConfigs(data.configs);
      }
      if (eventRes.ok) {
        const data = await eventRes.json();
        if (data.events) setEvents(data.events);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>{t("settings.title")}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t("settings.subtitle")}
        </ThemedText>

        {loading ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
            {t("common.loading")}
          </ThemedText>
        ) : (
          <>
            <ThemedView style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>{t("settings.meetingDays")}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
                {t("settings.meetingDaysSubtitle")}
              </ThemedText>

              <ThemedView style={styles.cardsColumn}>
                {MEETING_TYPES.map((type) => (
                  <MeetingDayCard
                    key={type}
                    type={type}
                    config={configs.find((c) => c.type === type)}
                    onSaved={fetchAll}
                  />
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>{t("settings.specialEvents")}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
                {t("settings.specialEventsSubtitle")}
              </ThemedText>

              <SpecialEventsSection events={events} onChanged={fetchAll} />
            </ThemedView>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function MeetingDayCard({
  type,
  config,
  onSaved,
}: {
  type: string;
  config: MeetingConfig | undefined;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [dayOfWeek, setDayOfWeek] = useState(config?.dayOfWeek ?? 3);
  const [startTime, setStartTime] = useState(config?.startTime ?? "19:30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = config
        ? await apiFetch(`/api/meeting-configs/${config.id}`, {
            method: "PUT",
            body: JSON.stringify({ dayOfWeek, startTime }),
          })
        : await apiFetch("/api/meeting-configs", {
            method: "POST",
            body: JSON.stringify({ type, dayOfWeek, startTime }),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Erro");
        return;
      }
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="default" style={{ fontWeight: "600" }}>
        {t(`settings.meetingType.${type}`)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {config
          ? `${t(`settings.days.${DAY_KEYS[config.dayOfWeek]}`)} ${t("settings.at")} ${config.startTime}`
          : t("settings.notConfigured")}
      </ThemedText>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("settings.dayOfWeek")}</ThemedText>
        <DayPicker selected={dayOfWeek} onSelect={setDayOfWeek} />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("settings.startTime")}</ThemedText>
        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="19:30"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        />
      </ThemedView>

      {error && <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText>}

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }, saving && { opacity: 0.5 }]}
      >
        <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>{t("common.save")}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function DayPicker({ selected, onSelect }: { selected: number; onSelect: (day: number) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.dayGrid}>
      {DAY_KEYS.map((key, index) => {
        const active = index === selected;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(index)}
            style={[
              styles.dayChip,
              { borderColor: theme.primary },
              active && { backgroundColor: theme.primary },
            ]}
          >
            <ThemedText
              type="small"
              style={[active && { color: theme.primaryForeground }, { textAlign: "center" }]}
            >
              {t(`settings.days.${key}`)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function SpecialEventsSection({
  events,
  onChanged,
}: {
  events: SpecialEvent[];
  onChanged: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function startCreate() {
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(event: SpecialEvent) {
    setEditingId(event.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const res = await apiFetch(`/api/special-events/${id}`, { method: "DELETE" });
    if (res.ok) await onChanged();
  }

  return (
    <ThemedView style={styles.eventsContainer}>
      {events.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
          {t("settings.noSpecialEvents")}
        </ThemedText>
      ) : (
        <ThemedView style={styles.eventsList}>
          {events.map((event) => (
            <ThemedView key={event.id} type="backgroundElement" style={styles.eventRow}>
              <ThemedView style={{ flex: 1 }}>
                <ThemedText type="default" style={{ fontWeight: "600" }}>
                  {t(`settings.specialEventTypes.${event.type}`)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatEventSummary(event, t)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.eventActions}>
                <Pressable onPress={() => startEdit(event)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                  <ThemedText style={{ color: theme.primary, fontSize: 13 }}>{t("common.edit")}</ThemedText>
                </Pressable>
                <Pressable onPress={() => handleDelete(event.id)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                  <ThemedText style={{ color: theme.danger, fontSize: 13 }}>{t("common.remove")}</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {showForm ? (
        <SpecialEventForm
          key={editingId ?? "new"}
          event={events.find((e) => e.id === editingId) ?? null}
          onCancel={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setEditingId(null);
            void onChanged();
          }}
        />
      ) : (
        <Pressable
          onPress={startCreate}
          style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: theme.backgroundSelected }, pressed && { opacity: 0.8 }]}
        >
          <ThemedText style={{ fontWeight: "600" }}>{t("settings.newSpecialEvent")}</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

function SpecialEventForm({
  event,
  onCancel,
  onSaved,
}: {
  event: SpecialEvent | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [form, setForm] = useState<SpecialEventFormValues>(() =>
    event
      ? {
          type: event.type as SpecialEventType,
          date: event.date,
          endDate: event.endDate ?? "",
          time: event.time ?? "",
          location: event.location ?? "",
        }
      : EMPTY_EVENT_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = SPECIAL_EVENT_FIELDS[form.type];
  const isAnnual = (ANNUAL_EVENT_TYPES as readonly string[]).includes(form.type);

  async function handleSubmit() {
    if (!form.date) {
      setError(t("settings.eventDate"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        type: form.type,
        date: form.date,
      };
      if (fields.endDate) payload.endDate = form.endDate;
      if (fields.time) payload.time = form.time;
      if (fields.location) payload.location = form.location;

      const res = event
        ? await apiFetch(`/api/special-events/${event.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/special-events", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Erro");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.formCard}>
      <ThemedText type="default" style={{ fontWeight: "600", marginBottom: Spacing.three }}>
        {event ? t("settings.editSpecialEvent") : t("settings.newSpecialEvent")}
      </ThemedText>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("settings.specialEventType")}</ThemedText>
        <View style={styles.typeGrid}>
          {SPECIAL_EVENT_TYPES.map((type) => {
            const active = type === form.type;
            return (
              <Pressable
                key={type}
                onPress={() => setForm({ ...form, type })}
                style={[
                  styles.typeChip,
                  { borderColor: theme.primary },
                  active && { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[active && { color: theme.primaryForeground }, { textAlign: "center" }]}
                >
                  {t(`settings.specialEventTypes.${type}`)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{fields.endDate ? t("settings.eventStartDate") : t("settings.eventDate")}</ThemedText>
        <TextInput
          value={form.date}
          onChangeText={(date) => setForm({ ...form, date })}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        />
      </ThemedView>

      {fields.endDate && (
        <ThemedView style={styles.field}>
          <ThemedText type="small">{t("settings.eventEndDate")}</ThemedText>
          <TextInput
            value={form.endDate}
            onChangeText={(endDate) => setForm({ ...form, endDate })}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          />
        </ThemedView>
      )}

      {fields.time && (
        <ThemedView style={styles.field}>
          <ThemedText type="small">{t("settings.eventTime")}</ThemedText>
          <TextInput
            value={form.time}
            onChangeText={(time) => setForm({ ...form, time })}
            placeholder="19:30"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          />
        </ThemedView>
      )}

      {fields.location && (
        <ThemedView style={styles.field}>
          <ThemedText type="small">{t("settings.eventLocation")}</ThemedText>
          <TextInput
            value={form.location}
            onChangeText={(location) => setForm({ ...form, location })}
            placeholder={t("settings.eventLocation")}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          />
        </ThemedView>
      )}

      {isAnnual && (
        <ThemedText type="small" style={{ color: theme.warning, fontWeight: "600" }}>
          {t("settings.onePerYear")}
        </ThemedText>
      )}

      {error && <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText>}

      <ThemedView style={styles.actionsRow}>
        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }, saving && { opacity: 0.5 }]}
        >
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>{t("common.save")}</ThemedText>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: theme.backgroundSelected }, pressed && { opacity: 0.8 }]}
        >
          <ThemedText style={{ fontWeight: "600" }}>{t("common.cancel")}</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

function formatEventSummary(
  event: SpecialEvent,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const parts: string[] = [event.date];
  if (event.endDate) parts.push(`– ${event.endDate}`);
  if (event.time) parts.push(t("settings.at"), event.time);
  if (event.location) parts.push("·", event.location);
  return parts.join(" ");
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: "row", justifyContent: "center" },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  section: { gap: Spacing.three, marginBottom: Spacing.five },
  sectionTitle: { fontWeight: "700" },
  sectionSubtitle: { marginTop: -Spacing.one },
  cardsColumn: { gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
  field: { gap: Spacing.one },
  input: { borderRadius: Spacing.two, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontSize: 16 },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  dayChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1, minWidth: 92 },
  primaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
  secondaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
  eventsContainer: { gap: Spacing.three },
  eventsList: { gap: Spacing.two },
  eventRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  eventActions: { flexDirection: "row", gap: Spacing.three, marginLeft: Spacing.two },
  formCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  typeChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1 },
  actionsRow: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.one },
});

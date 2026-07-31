import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type MeetingPart = {
  id: string;
  name: string;
  durationMinutes: number | null;
  sortOrder: number;
  description: string | null;
};

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number | null;
  isActive: boolean;
  parts: MeetingPart[];
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom },
    web: { paddingTop: Spacing.six, paddingBottom: Spacing.four },
  });

  async function fetchConfigs() {
    const res = await apiFetch("/api/meeting-configs");
    const data = await res.json();
    if (data.configs) setConfigs(data.configs);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await apiFetch("/api/meeting-configs");
      const data = await res.json();
      if (cancelled) return;
      if (data.configs) setConfigs(data.configs);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    const res = await apiFetch(`/api/meeting-configs/${id}`, { method: "DELETE" });
    if (res.ok) await fetchConfigs();
  }

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

        <Pressable
          onPress={() => setShowForm(!showForm)}
          style={({ pressed }) => [styles.addButton, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }]}
        >
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>
            {showForm ? t("settings.cancel") : t("settings.newConfig")}
          </ThemedText>
        </Pressable>

        {showForm && <ConfigForm onSaved={() => { setShowForm(false); fetchConfigs(); }} />}

        {loading ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
            {t("settings.loading")}
          </ThemedText>
        ) : configs.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
            {t("settings.noConfigs")}
          </ThemedText>
        ) : (
          <ThemedView style={styles.configsList}>
            {configs.map((config) => (
              <ThemedView key={config.id} type="backgroundElement" style={styles.configCard}>
                <ThemedView style={styles.configHeader}>
                  <ThemedView style={{ flex: 1 }}>
                    <ThemedText type="default" style={{ fontWeight: "600" }}>
                      {t(`settings.meetingType.${config.type}`)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t(`settings.days.${["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][config.dayOfWeek]}`)} {t("settings.at")} {config.startTime}
                      {config.durationMinutes ? ` · ${config.durationMinutes}min` : ""}
                    </ThemedText>
                  </ThemedView>
                  <Pressable onPress={() => handleDelete(config.id)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                    <ThemedText style={{ color: theme.danger, fontSize: 13 }}>{t("settings.remove")}</ThemedText>
                  </Pressable>
                </ThemedView>

                {config.parts.length > 0 && (
                  <ThemedView style={styles.partsSection}>
                    {config.parts.map((part) => (
                      <ThemedView key={part.id} type="backgroundSelected" style={styles.partRow}>
                        <ThemedText type="small">#{part.sortOrder} {part.name}</ThemedText>
                        {part.durationMinutes && (
                          <ThemedText type="small" themeColor="textSecondary">{part.durationMinutes}min</ThemedText>
                        )}
                      </ThemedView>
                    ))}
                  </ThemedView>
                )}
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function ConfigForm({ onSaved }: { onSaved: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [type, setType] = useState<"midweek" | "weekend">("midweek");
  const [dayOfWeek, setDayOfWeek] = useState("3");
  const [startTime, setStartTime] = useState("19:30");
  const [durationMinutes, setDurationMinutes] = useState("105");

  async function handleSave() {
    const res = await apiFetch("/api/meeting-configs", {
      method: "POST",
      body: JSON.stringify({ type, dayOfWeek: Number(dayOfWeek), startTime, durationMinutes: durationMinutes ? Number(durationMinutes) : null }),
    });
    if (res.ok) onSaved();
  }

  return (
    <ThemedView type="backgroundElement" style={styles.formCard}>
      <ThemedText type="default" style={{ fontWeight: "600", marginBottom: Spacing.three }}>{t("settings.newConfig")}</ThemedText>

      <ThemedView style={styles.formRow}>
        <Pressable onPress={() => setType("midweek")} style={[styles.typeBtn, { borderColor: theme.primary }, type === "midweek" && { backgroundColor: theme.primary }]}>
          <ThemedText style={[type === "midweek" && { color: theme.primaryForeground }, { textAlign: "center" }]}>{t("settings.meetingType.midweek")}</ThemedText>
        </Pressable>
        <Pressable onPress={() => setType("weekend")} style={[styles.typeBtn, { borderColor: theme.primary }, type === "weekend" && { backgroundColor: theme.primary }]}>
          <ThemedText style={[type === "weekend" && { color: theme.primaryForeground }, { textAlign: "center" }]}>{t("settings.meetingType.weekend")}</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("settings.dayOfWeek")}</ThemedText>
        <TextInput value={dayOfWeek} onChangeText={setDayOfWeek} keyboardType="numeric" style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("settings.startTime")}</ThemedText>
        <TextInput value={startTime} onChangeText={setStartTime} style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("settings.duration")}</ThemedText>
        <TextInput value={durationMinutes} onChangeText={setDurationMinutes} keyboardType="numeric" style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} />
      </ThemedView>

      <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }]}>
        <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>{t("settings.create")}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: "row", justifyContent: "center" },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  addButton: { paddingVertical: Spacing.two, borderRadius: Spacing.three, alignItems: "center", marginBottom: Spacing.three },
  configsList: { gap: Spacing.three, marginTop: Spacing.three },
  configCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
  configHeader: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two },
  partsSection: { gap: Spacing.two, paddingLeft: Spacing.two },
  partRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two },
  formCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three, marginBottom: Spacing.three },
  formRow: { flexDirection: "row", gap: Spacing.two },
  typeBtn: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, borderWidth: 1 },
  field: { gap: Spacing.half },
  input: { borderRadius: Spacing.two, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontSize: 16 },
  saveBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", marginTop: Spacing.one },
});

import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { PeoplePanel } from "@/components/people-panel";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ProfileData = {
  userId: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  personId: string | null;
  personName: string | null;
};

export default function ProfileScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { organizationRole } = useAuth();
  const canManage = organizationRole === "owner" || organizationRole === "admin";
  const [tab, setTab] = useState<"profile" | "people">("profile");

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: canManage ? 0 : insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: canManage ? Spacing.two : Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {canManage && (
        <ThemedView
          style={[
            styles.segmentWrapper,
            { paddingTop: Platform.OS === "web" ? Spacing.six : insets.top },
          ]}
        >
          <ThemedView style={styles.segmentRow}>
            {(
              [
                { key: "profile", label: t("profile.title") },
                { key: "people", label: t("nav.people") },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={({ pressed }) => [
                  styles.segmentBtn,
                  {
                    backgroundColor:
                      tab === item.key ? theme.primary : theme.backgroundSelected,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText
                  style={{
                    color:
                      tab === item.key ? theme.primaryForeground : theme.text,
                    fontWeight: "600",
                  }}
                >
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </ThemedView>
      )}

      {tab === "people" ? (
        <PeoplePanel embedded />
      ) : (
        <ProfileContent
          insets={insets}
          contentPlatformStyle={contentPlatformStyle}
        />
      )}
    </View>
  );
}

function ProfileContent({
  insets,
  contentPlatformStyle,
}: {
  insets: ReturnType<typeof useSafeAreaInsets> & { bottom: number };
  contentPlatformStyle:
    | { paddingTop?: number; paddingBottom?: number }
    | undefined;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [personName, setPersonName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setPersonName(data.profile.personName ?? "");
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const res = await apiFetch("/api/profile");
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setPersonName(data.profile.personName ?? "");
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    const trimmed = personName.trim();
    if (trimmed.length < 3) {
      setError(t("profile.minLength"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? t("common.error"));
        return;
      }
      if (data.profile) setProfile(data.profile);
      Alert.alert(t("profile.saved"));
      await load();
    } finally {
      setSaving(false);
    }
  }

  const hasPerson = Boolean(profile?.personId);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>{t("profile.title")}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t("profile.subtitle")}
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="default" style={styles.sectionTitle}>{t("profile.account")}</ThemedText>
          <ThemedView type="backgroundElement" style={styles.accountCard}>
            {profile?.image ? (
              <Image source={{ uri: profile.image }} style={styles.avatar} />
            ) : (
              <ThemedView type="backgroundSelected" style={styles.avatar}>
                <ThemedText type="smallBold">
                  {profile?.name?.charAt(0).toUpperCase() ?? "?"}
                </ThemedText>
              </ThemedView>
            )}
            <ThemedView style={{ flex: 1 }}>
              <ThemedText type="default" style={{ fontWeight: "600" }}>
                {profile?.name ?? "—"}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {profile?.email ?? "—"}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="default" style={styles.sectionTitle}>{t("profile.person")}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("profile.personDescription")}
          </ThemedText>

          {hasPerson ? (
            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedView style={styles.field}>
                <ThemedText type="small">{t("profile.personName")}</ThemedText>
                <TextInput
                  value={personName}
                  onChangeText={setPersonName}
                  placeholder={t("profile.namePlaceholder")}
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
                <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>
                  {saving ? t("common.loading") : t("common.save")}
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <ThemedView type="backgroundElement" style={styles.noPersonCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {t("profile.noPerson")}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <View style={styles.spacer} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: "row", justifyContent: "center" },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  section: { gap: Spacing.two, marginBottom: Spacing.five },
  sectionTitle: { fontWeight: "700" },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  formCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two, marginTop: Spacing.two },
  noPersonCard: { padding: Spacing.three, borderRadius: Spacing.three, marginTop: Spacing.two },
  field: { gap: Spacing.one },
  input: { borderRadius: Spacing.two, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontSize: 16 },
  primaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center" },
  spacer: { height: Spacing.four },
  segmentWrapper: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
  segmentRow: { flexDirection: "row", gap: Spacing.one },
  segmentBtn: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center" },
});

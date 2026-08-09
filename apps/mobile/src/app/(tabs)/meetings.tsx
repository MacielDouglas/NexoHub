import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MeetingContentPanel } from '@/components/meeting-content-panel';
import { MeetingsCalendar } from '@/components/meetings-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

export default function MeetingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { organizationRole } = useAuth();

  const canManage = organizationRole === 'owner' || organizationRole === 'admin';

  const [tab, setTab] = useState<'meetings' | 'content'>('meetings');

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: { paddingTop: Spacing.six, paddingBottom: Spacing.four },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>{t('nav.meetings')}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t('meetings.subtitle')}
        </ThemedText>

        {canManage && (
          <ThemedView style={styles.segmentRow}>
            {(
              [
                { key: 'meetings', label: t('meetings.tabMeetings') },
                { key: 'content', label: t('meetings.tabContent') },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={({ pressed }) => [
                  styles.segmentBtn,
                  { backgroundColor: tab === item.key ? theme.primary : theme.backgroundSelected },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText
                  style={{
                    color: tab === item.key ? theme.primaryForeground : theme.text,
                    fontWeight: '600',
                  }}
                >
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        )}

        {tab === 'content' ? <MeetingContentPanel /> : <MeetingsCalendar />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  segmentRow: { flexDirection: 'row', gap: Spacing.one, marginBottom: Spacing.four },
  segmentBtn: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
});

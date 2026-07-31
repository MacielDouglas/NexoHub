import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
  parts: { id: string }[];
};

type SpecialEvent = {
  id: string;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
};

const DAY_KEYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const;

const EVENT_EMOJI: Record<string, string> = {
  convention: '🏟️',
  assembly: '👥',
  memorial: '🍷',
  special_talk: '🎤',
  visitor: '👫',
  special_meeting: '👥',
};

function eventEmoji(type: string): string {
  return EVENT_EMOJI[type] ?? '⭐';
}

export default function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const containerPadding = {
    paddingTop: safeAreaInsets.top + Spacing.two,
    paddingLeft: safeAreaInsets.left,
    paddingRight: safeAreaInsets.right,
    paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const fetchAll = useCallback(async () => {
    try {
      const [configRes, eventRes, memberRes] = await Promise.all([
        apiFetch('/api/meeting-configs'),
        apiFetch('/api/special-events'),
        apiFetch('/api/members'),
      ]);
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.configs) setConfigs(data.configs);
      }
      if (eventRes.ok) {
        const data = await eventRes.json();
        if (data.events) setEvents(data.events);
      }
      if (memberRes.ok) {
        const data = await memberRes.json();
        if (data.members) setMemberCount(data.members.length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  }

  const upcomingMeetings = configs
    .filter((c) => c.isActive)
    .map((config) => ({
      config,
      date: nextDateForDay(config.dayOfWeek, config.startTime),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = startOfToday();
  const upcomingEvents = events
    .filter((event) => new Date(`${event.date}T00:00:00`) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, containerPadding]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerTop}>
            <ThemedView style={styles.headerTopLeft}>
              <ThemedText type="subtitle" style={styles.welcomeText}>
                {t('home.welcome', { name: session?.user?.name?.split(' ')[0] ?? '' })}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitleText}>
                {t('home.subtitle')}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.headerActions}>
              <LanguageSwitcher />
              <Pressable
                onPress={handleSignOut}
                disabled={signingOut}
                style={({ pressed }) => [
                  styles.signOutBtn,
                  { borderColor: theme.danger },
                  pressed && { opacity: 0.7 },
                  signingOut && { opacity: 0.5 },
                ]}
              >
                <ThemedText type="small" style={{ color: theme.danger, fontWeight: '600' }}>
                  {signingOut ? t('settings.signingOut') : t('settings.signOut')}
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {loading ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
            {t('common.loading')}
          </ThemedText>
        ) : (
          <>
            <ThemedView type="primary" style={styles.heroCard}>
              <ThemedText style={styles.heroLabel}>{t('home.nextMeeting')}</ThemedText>
              <ThemedText style={styles.heroValue}>
                {upcomingMeetings.length > 0
                  ? formatDate(upcomingMeetings[0].date, t)
                  : t('home.noMeetings')}
              </ThemedText>
              {upcomingMeetings.length > 0 && (
                <ThemedText style={styles.heroSubValue}>
                  {t(`settings.meetingType.${upcomingMeetings[0].config.type}`)}
                  {` · ${t('settings.days.' + DAY_KEYS[upcomingMeetings[0].config.dayOfWeek])} ${t('settings.at')} ${upcomingMeetings[0].config.startTime}`}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.grid}>
              <ThemedView type="backgroundElement" style={styles.statCard}>
                <ThemedText type="small" themeColor="textSecondary">{t('home.statMeetings')}</ThemedText>
                <ThemedText type="subtitle" style={styles.statValue}>{configs.length}</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.statCard}>
                <ThemedText type="small" themeColor="textSecondary">{t('home.statMembers')}</ThemedText>
                <ThemedText type="subtitle" style={styles.statValue}>{memberCount}</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.statCard}>
                <ThemedText type="small" themeColor="textSecondary">{t('home.statEvents')}</ThemedText>
                <ThemedText type="subtitle" style={styles.statValue}>{events.length}</ThemedText>
              </ThemedView>
            </ThemedView>

            {upcomingEvents.length > 0 && (
              <ThemedView style={styles.eventsSection}>
                <ThemedText type="default" style={styles.eventsSectionTitle}>
                  {t('home.upcomingEvents')}
                </ThemedText>
                <ThemedView style={styles.eventsGrid}>
                  {upcomingEvents.map((event) => (
                    <ThemedView key={event.id} type="backgroundElement" style={styles.eventCard}>
                      <ThemedText style={{ fontSize: 28, marginRight: Spacing.two }}>
                        {eventEmoji(event.type)}
                      </ThemedText>
                      <ThemedView style={styles.eventInfo}>
                        <ThemedText type="default" style={styles.eventTypeText}>
                          {t(`settings.specialEventTypes.${event.type}`)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.eventDateText}>
                          {formatEventDate(event, t)}
                        </ThemedText>
                        {event.location && (
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.eventLocation}>
                            {event.location}
                          </ThemedText>
                        )}
                      </ThemedView>
                    </ThemedView>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            <ThemedView style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>{t('home.schedule')}</ThemedText>
              {upcomingMeetings.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">{t('home.noMeetings')}</ThemedText>
              ) : (
                upcomingMeetings.map(({ config, date }) => (
                  <ThemedView key={config.id} type="backgroundElement" style={styles.rowCard}>
                    <ThemedView style={{ flex: 1 }}>
                      <ThemedText type="default" style={{ fontWeight: '600' }}>
                        {t(`settings.meetingType.${config.type}`)}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatDate(date, t)}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.rowBadge}>
                      <ThemedText type="small" style={{ color: theme.primary, fontWeight: '600' }}>
                        {t('settings.days.' + DAY_KEYS[config.dayOfWeek])} · {config.startTime}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                ))
              )}
            </ThemedView>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function formatEventDate(event: SpecialEvent, t: (key: string, opts?: Record<string, unknown>) => string) {
  const parts: string[] = [event.date];
  if (event.endDate) parts.push(`– ${event.endDate}`);
  if (event.time) parts.push(` ${t('settings.at')} ${event.time}`);
  return parts.join(' ');
}

function nextDateForDay(dayOfWeek: number, time: string): Date {
  const today = startOfToday();
  let diff = (dayOfWeek - today.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  const next = new Date(today);
  next.setDate(next.getDate() + diff);
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDate(date: Date, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  if (date.getTime() === today.getTime()) return t('home.today');
  if (date.getTime() === tomorrow.getTime()) return t('home.tomorrow');
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${t(`settings.days.${dayKey}`)}`;
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { justifyContent: 'center' },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.two },
  header: { gap: Spacing.half, marginBottom: Spacing.two },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  headerTopLeft: { flex: 1, gap: Spacing.half },
  headerActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  welcomeText: { fontSize: 18 },
  subtitleText: { fontSize: 12 },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  heroCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.half,
    marginBottom: Spacing.three,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  heroValue: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  heroSubValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '500' },
  grid: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  statCard: { flex: 1, borderRadius: Spacing.three, padding: Spacing.two, gap: Spacing.half },
  statValue: { fontSize: 24 },
  eventsSection: { gap: Spacing.two, marginBottom: Spacing.three },
  eventsSectionTitle: { fontWeight: '700' },
  eventsGrid: { gap: Spacing.two },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  eventInfo: { flex: 1, gap: Spacing.half },
  eventTypeText: { fontWeight: '600' },
  eventDateText: { fontSize: 12 },
  eventLocation: { fontSize: 11 },
  section: { gap: Spacing.two, marginBottom: Spacing.two },
  sectionTitle: { fontWeight: '700' },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  rowBadge: { backgroundColor: 'transparent' },
});
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

type OverviewItem = {
  id: string;
  kind: 'meeting' | 'designation' | 'cleaning';
  date: string;
  titleKey: string | null;
  title: string | null;
  subtitleKey: string | null;
  subtitle: string | null;
  task?: string | null;
};

type NextMeeting = {
  type: string;
  date: string;
  time: string;
};

type OverviewData = {
  personName: string | null;
  weekStart: string;
  weekEnd: string;
  today: string;
  nextMeeting: NextMeeting | null;
  weekAssignments: OverviewItem[];
  upcoming: OverviewItem[];
  pastMonth: OverviewItem[];
};

const KIND_EMOJI: Record<OverviewItem['kind'], string> = {
  meeting: '📅',
  designation: '🎤',
  cleaning: '🧹',
};

const KIND_BADGE_COLOR: Record<OverviewItem['kind'], string> = {
  meeting: '#2563EB',
  designation: '#7C3AED',
  cleaning: '#16A34A',
};

export default function OverviewScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const containerPadding = {
    paddingTop: safeAreaInsets.top + Spacing.two,
    paddingLeft: safeAreaInsets.left,
    paddingRight: safeAreaInsets.right,
    paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await apiFetch('/api/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  }

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
                {t('overview.title')}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitleText}>
                {t('overview.subtitle')}
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

        {loading || !data ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
            {t('common.loading')}
          </ThemedText>
        ) : (
          <>
            <CurrentWeekCard data={data} />

            {!data.personName ? (
              <ThemedView type="backgroundElement" style={styles.emptyCard}>
                <ThemedText style={{ fontSize: 28 }}>👤</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  {t('overview.noPerson')}
                </ThemedText>
              </ThemedView>
            ) : (
              <>
                <AssignmentGroup
                  icon="✨"
                  title={t('overview.yourAssignments')}
                  items={data.weekAssignments}
                  empty={t('overview.noAssignments')}
                  today={data.today}
                />

                <AssignmentGroup
                  icon="📅"
                  title={t('overview.upcoming')}
                  items={data.upcoming}
                  empty={t('overview.noUpcoming')}
                  today={data.today}
                />

                <AssignmentGroup
                  icon="🕘"
                  title={t('overview.pastMonth')}
                  items={data.pastMonth}
                  empty={t('overview.noPast')}
                  today={data.today}
                />
              </>
            )}
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function CurrentWeekCard({ data }: { data: OverviewData }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <ThemedView type="primary" style={styles.weekCard}>
      <View style={styles.weekCardHeader}>
        <ThemedText style={styles.weekCardLabel}>
          {t('overview.currentWeek')} · {t('overview.weekCountLabel')}
        </ThemedText>
        <ThemedText style={styles.weekCount}>
          {data.weekAssignments.length}
        </ThemedText>
      </View>

      <ThemedText style={styles.weekRange}>
        {formatDate(data.weekStart)} – {formatDate(data.weekEnd)}
      </ThemedText>

      <View style={styles.divider} />

      <View style={styles.nextMeetingRow}>
        <ThemedText style={styles.nextMeetingLabel}>
          {t('overview.nextMeeting')}
        </ThemedText>
        {data.nextMeeting ? <RelativeBadge today={data.today} date={data.nextMeeting.date} /> : null}
      </View>

      {data.nextMeeting ? (
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.nextMeetingBody}>
          <ThemedText style={styles.nextMeetingType}>
            {t(`meetings.types.${data.nextMeeting.type}`)}
          </ThemedText>
          <ThemedText style={styles.nextMeetingMeta}>
            {formatDate(data.nextMeeting.date)}
            {data.nextMeeting.time ? ` · ${data.nextMeeting.time}` : ''}
          </ThemedText>
          {expanded && data.weekAssignments.length > 0 ? (
            <ThemedText style={styles.nextMeetingDetail}>
              {data.weekAssignments
                .map((item) => itemTitle(item, t))
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          ) : null}
        </Pressable>
      ) : (
        <ThemedText style={styles.noMeetingText}>
          {t('overview.noNextMeeting')}
        </ThemedText>
      )}
    </ThemedView>
  );
}

function AssignmentGroup({
  icon,
  title,
  items,
  empty,
  today,
}: {
  icon: string;
  title: string;
  items: OverviewItem[];
  empty: string;
  today: string;
}) {
  return (
    <ThemedView style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionIcon}>{icon}</ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          {title}
        </ThemedText>
        <View style={styles.sectionLine} />
      </View>

      {items.length === 0 ? (
        <ThemedView type="backgroundElement" style={styles.emptyListCard}>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            {empty}
          </ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} today={today} />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

function ItemRow({ item, today }: { item: OverviewItem; today: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const isCleaning = item.kind === 'cleaning';
  const taskKey = isCleaning ? item.task : null;
  const task = taskKey
    ? t(taskKey)
    : isCleaning
      ? t('overview.noCleaningTask')
      : null;

  const badgeColor = KIND_BADGE_COLOR[item.kind];

  return (
    <ThemedView type="backgroundElement" style={styles.itemCard}>
      <Pressable
        onPress={isCleaning ? () => setOpen((v) => !v) : undefined}
        style={styles.itemRow}
      >
        <View style={[styles.itemIcon, { backgroundColor: `${badgeColor}1f` }]}>
          <ThemedText style={{ fontSize: 16 }}>{KIND_EMOJI[item.kind]}</ThemedText>
        </View>

        <View style={styles.itemInfo}>
          {itemTitle(item, t) ? (
            <ThemedText type="default" numberOfLines={1} style={{ fontWeight: '600' }}>
              {itemTitle(item, t)}
            </ThemedText>
          ) : null}
          {itemSubtitle(item, t) ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {itemSubtitle(item, t)}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.itemMeta}>
          <View style={[styles.itemBadge, { backgroundColor: `${badgeColor}14` }]}>
            <ThemedText type="small" style={{ fontSize: 11, fontWeight: '600', color: badgeColor }}>
              {t(`overview.kinds.${item.kind}`)}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.itemDate}>
            {formatDate(item.date)}
          </ThemedText>
          {isCleaning ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              {open ? '▲' : '▼'}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>

      {isCleaning && open && task ? (
        <View style={[styles.itemTask, { borderColor: theme.border }]}>
          <ThemedText type="small">{task}</ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

function itemTitle(item: OverviewItem, t: (key: string) => string): string | null {
  return item.titleKey ? t(item.titleKey) : item.title;
}

function itemSubtitle(item: OverviewItem, t: (key: string) => string): string | null {
  if (item.subtitleKey) return t(item.subtitleKey);
  return item.subtitle;
}

function RelativeBadge({ today, date }: { today: string; date: string }) {
  const { t } = useTranslation();
  const diff = Math.round(
    (new Date(`${date}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86_400_000,
  );

  let label: string;
  if (diff === 0) label = t('overview.today');
  else if (diff === 1) label = t('overview.tomorrow');
  else if (diff > 1) label = t('overview.inDays', { count: diff });
  else return null;

  return (
    <View style={[styles.relativeBadge, { backgroundColor: diff === 0 ? '#ffffff22' : '#ffffff14' }]}>
      <ThemedText style={{ fontSize: 11, fontWeight: '600', color: '#ffffff' }}>{label}</ThemedText>
    </View>
  );
}

function formatDate(key: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
  welcomeText: { fontSize: 22 },
  subtitleText: { fontSize: 12 },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  weekCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.three,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  weekCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekCardLabel: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  weekCount: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  weekRange: { color: '#e2e8f0', fontSize: 13, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#ffffff22', marginVertical: Spacing.two },
  nextMeetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  nextMeetingLabel: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  nextMeetingBody: { gap: Spacing.half, marginTop: Spacing.half },
  nextMeetingType: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  nextMeetingMeta: { color: '#e2e8f0', fontSize: 13, fontWeight: '500' },
  nextMeetingDetail: { color: '#e2e8f0', fontSize: 12, marginTop: Spacing.half },
  noMeetingText: { color: '#e2e8f0', fontSize: 13, marginTop: Spacing.half },
  relativeBadge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  emptyCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  section: { gap: Spacing.two, marginBottom: Spacing.three },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionIcon: { fontSize: 14 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLine: { height: 1, flex: 1, backgroundColor: '#e5eaf2' },
  emptyListCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
  },
  list: { gap: Spacing.two },
  itemCard: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 2, minWidth: 0 },
  itemMeta: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  itemBadge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: 1,
  },
  itemDate: { fontSize: 11 },
  itemTask: {
    borderTopWidth: 1,
    padding: Spacing.three,
  },
});

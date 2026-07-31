import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

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
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">{t('home.welcome')}</ThemedText>
          <ThemedText themeColor="textSecondary">{t('home.subtitle')}</ThemedText>
        </ThemedView>

        <ThemedView type="primary" style={styles.heroCard}>
          <ThemedText style={styles.heroLabel}>Nexohub</ThemedText>
          <ThemedText style={styles.heroValue}>{t('common.appTagline')}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.grid}>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <ThemedText type="small" themeColor="textSecondary">{t('home.statMidweek')}</ThemedText>
            <ThemedText type="subtitle" style={styles.statValue}>2</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <ThemedText type="small" themeColor="textSecondary">{t('home.statWeekend')}</ThemedText>
            <ThemedText type="subtitle" style={styles.statValue}>1</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  header: { gap: Spacing.one, marginBottom: Spacing.five },
  heroCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    marginBottom: Spacing.four,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  heroValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 32,
  },
});

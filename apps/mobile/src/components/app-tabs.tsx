import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function AppTabs() {
  const colors = Colors.light;
  const { t } = useTranslation();
  const { organizationRole } = useAuth();
  const canManage = organizationRole === 'owner' || organizationRole === 'admin';

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('nav.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {canManage && (
        <NativeTabs.Trigger name="people">
          <NativeTabs.Trigger.Label>{t('nav.people')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="person.3"
            src={require('@/assets/images/tabIcons/people.png')}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      )}

      <NativeTabs.Trigger name="meeting-content">
        <NativeTabs.Trigger.Label>{t('nav.meetingContent')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="books.vertical"
          src={require('@/assets/images/tabIcons/books.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('nav.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.crop.circle"
          src={require('@/assets/images/tabIcons/profile.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('nav.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="gear"
          src={require('@/assets/images/tabIcons/settings.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

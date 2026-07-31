import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { session, hasOrganization, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (hasOrganization) {
    return <Redirect href="/(tabs)" />;
  }

  if (session.user.globalRole === 'super_user') {
    return <Redirect href="/admin" />;
  }

  if (session.user.globalRole === 'owner') {
    return <Redirect href="/create-org" />;
  }

  return <Redirect href="/welcome" />;
}
